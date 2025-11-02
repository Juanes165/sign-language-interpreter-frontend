/**
 * Utilidades para el reconocimiento de gestos con modelo LSTM
 * Compatible con MediaPipe Holistic
 */

/**
 * Normaliza las coordenadas de una mano centrando respecto a la muñeca y normalizando la escala
 * @param {Array} landmarks - Array de landmarks de MediaPipe
 * @returns {Array} Landmarks normalizados
 */
function normalizeHandGeometry(landmarks) {
  if (!landmarks || landmarks.length === 0) return landmarks;
  
  // La muñeca es el landmark índice 0
  const wrist = landmarks[0];
  
  // Calcular la distancia promedio desde la muñeca a los otros puntos para normalizar escala
  let meanDistance = 0;
  let validPoints = 0;
  
  for (let i = 1; i < landmarks.length; i++) {
    const dx = landmarks[i].x - wrist.x;
    const dy = landmarks[i].y - wrist.y;
    const dz = landmarks[i].z - wrist.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 0) {
      meanDistance += distance;
      validPoints++;
    }
  }
  
  // Usar la distancia promedio como factor de escala
  const scale = validPoints > 0 ? meanDistance / validPoints : 1;
  
  // Evitar división por cero o escala muy pequeña
  const normalizedScale = Math.max(scale, 0.001);
  
  // Normalizar cada landmark: centrar en muñeca y dividir por escala
  return landmarks.map(lm => {
    const normalizedX = (lm.x - wrist.x) / normalizedScale;
    const normalizedY = (lm.y - wrist.y) / normalizedScale;
    const normalizedZ = (lm.z - wrist.z) / normalizedScale;
    
    return { x: normalizedX, y: normalizedY, z: normalizedZ };
  });
}

/**
 * Extrae los keypoints de los resultados de MediaPipe Holistic
 * Replica la función extract_keypoints de Python
 * @param {Object} results - Resultados de MediaPipe Holistic
 * @returns {Float32Array} Array de 1662 valores (pose: 132, face: 1404, left_hand: 63, right_hand: 63)
 */
export function extractKeypoints(results) {
  const pose = results.poseLandmarks
    ? results.poseLandmarks.flatMap(lm => [lm.x, lm.y, lm.z, lm.visibility || 0])
    : new Array(33 * 4).fill(0);

  const face = results.faceLandmarks
    ? results.faceLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(468 * 3).fill(0);

  // Aplicar normalización geométrica a las manos para hacerlas invariantes a distancia
  let leftHand;
  if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
    const normalizedLeft = normalizeHandGeometry(results.leftHandLandmarks);
    leftHand = normalizedLeft.flatMap(lm => [lm.x, lm.y, lm.z]);
  } else {
    leftHand = new Array(21 * 3).fill(0);
  }

  let rightHand;
  if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
    const normalizedRight = normalizeHandGeometry(results.rightHandLandmarks);
    rightHand = normalizedRight.flatMap(lm => [lm.x, lm.y, lm.z]);
  } else {
    rightHand = new Array(21 * 3).fill(0);
  }

  return new Float32Array([...pose, ...face, ...leftHand, ...rightHand]);
}

/**
 * Detecta si hay manos presentes en los resultados
 * @param {Object} results - Resultados de MediaPipe Holistic
 * @returns {boolean}
 */
export function handDetected(results) {
  return !!(results.leftHandLandmarks || results.rightHandLandmarks);
}

/**
 * Interpola keypoints para ajustar la longitud de la secuencia
 * Replica normalize_keypoints de run_local_recognition.py
 * @param {Array} keypoints - Array de frames con keypoints
 * @param {number} targetLength - Longitud objetivo (default: 15)
 * @returns {Array}
 */
export function interpolateKeypoints(keypoints, targetLength = 15) {
  const cur = keypoints.length;
  if (cur === targetLength) return keypoints;

  if (cur < targetLength) {
    const indices = [];
    for (let i = 0; i < targetLength; i++) {
      indices.push((i * (cur - 1)) / (targetLength - 1));
    }
    
    const out = [];
    for (const idx of indices) {
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      const w = idx - lo;
      
      if (lo === hi || hi >= cur) {
        out.push(keypoints[lo]);
      } else {
        const interpolated = new Float32Array(keypoints[lo].length);
        for (let j = 0; j < keypoints[lo].length; j++) {
          interpolated[j] = (1 - w) * keypoints[lo][j] + w * keypoints[hi][j];
        }
        out.push(interpolated);
      }
    }
    return out;
  }

  const step = cur / targetLength;
  const indices = [];
  for (let i = 0; i < targetLength; i++) {
    indices.push(Math.floor(i * step));
  }
  
  return indices.map(i => keypoints[i]);
}

/**
 * Normaliza la secuencia de keypoints al largo objetivo
 * Replica normalize_keypoints de run_local_recognition.py
 * @param {Array} keypoints - Array de frames
 * @param {number} targetLength - Longitud objetivo
 * @returns {Array}
 */
export function normalizeKeypoints(keypoints, targetLength = 15) {
  return interpolateKeypoints(keypoints, targetLength);
}

/**
 * Normaliza una secuencia de keypoints por componente usando estadísticas (mean/std)
 * Esta normalización debe aplicarse ANTES de pasar los datos al modelo LSTM
 * Replica normalizeKeypointsSequence del backend (train_lstm_node_v5.js)
 * @param {tf.Tensor} sequence - Tensor de forma (frames, keypoints) - ejemplo: (15, 1662)
 * @param {Object} stats - Estadísticas de normalización con mean y std por componente
 * @param {Object} tf - TensorFlow.js importado dinámicamente
 * @returns {tf.Tensor} Secuencia normalizada con mean=0, std=1 por componente
 */
export function normalizeKeypointsSequence(sequence, stats, tf) {
  if (!stats || !tf) {
    return sequence;
  }
  
  return tf.tidy(() => {
    const POSE_START = 0;
    const POSE_END = 132;
    const FACE_START = 132;
    const FACE_END = 1536;
    const LEFT_HAND_START = 1536;
    const LEFT_HAND_END = 1599;
    const RIGHT_HAND_START = 1599;
    const RIGHT_HAND_END = 1662;
    
    const frames = sequence.shape[0];
    const components = [];
    
    if (stats.pose && stats.pose.mean && stats.pose.std) {
      const poseMean = tf.tensor1d(stats.pose.mean);
      const poseStd = tf.tensor1d(stats.pose.std.map(s => Math.max(s, 1e-6)));
      const poseData = sequence.slice([0, POSE_START], [frames, POSE_END - POSE_START]);
      const poseNormalized = poseData.sub(poseMean).div(poseStd);
      components.push(poseNormalized);
      poseMean.dispose();
      poseStd.dispose();
    } else {
      components.push(sequence.slice([0, POSE_START], [frames, POSE_END - POSE_START]));
    }
    
    if (stats.face && stats.face.mean && stats.face.std) {
      const faceMean = tf.tensor1d(stats.face.mean);
      const faceStd = tf.tensor1d(stats.face.std.map(s => Math.max(s, 1e-6)));
      const faceData = sequence.slice([0, FACE_START], [frames, FACE_END - FACE_START]);
      const faceNormalized = faceData.sub(faceMean).div(faceStd);
      components.push(faceNormalized);
      faceMean.dispose();
      faceStd.dispose();
    } else {
      components.push(sequence.slice([0, FACE_START], [frames, FACE_END - FACE_START]));
    }
    
    if (stats.left_hand && stats.left_hand.mean && stats.left_hand.std) {
      const lhMean = tf.tensor1d(stats.left_hand.mean);
      const lhStd = tf.tensor1d(stats.left_hand.std.map(s => Math.max(s, 1e-6)));
      const lhData = sequence.slice([0, LEFT_HAND_START], [frames, LEFT_HAND_END - LEFT_HAND_START]);
      const lhNormalized = lhData.sub(lhMean).div(lhStd);
      components.push(lhNormalized);
      lhMean.dispose();
      lhStd.dispose();
    } else {
      components.push(sequence.slice([0, LEFT_HAND_START], [frames, LEFT_HAND_END - LEFT_HAND_START]));
    }
    
    if (stats.right_hand && stats.right_hand.mean && stats.right_hand.std) {
      const rhMean = tf.tensor1d(stats.right_hand.mean);
      const rhStd = tf.tensor1d(stats.right_hand.std.map(s => Math.max(s, 1e-6)));
      const rhData = sequence.slice([0, RIGHT_HAND_START], [frames, RIGHT_HAND_END - RIGHT_HAND_START]);
      const rhNormalized = rhData.sub(rhMean).div(rhStd);
      components.push(rhNormalized);
      rhMean.dispose();
      rhStd.dispose();
    } else {
      components.push(sequence.slice([0, RIGHT_HAND_START], [frames, RIGHT_HAND_END - RIGHT_HAND_START]));
    }
    
    const result = tf.concat(components, 1);
    
    if (result.shape[0] !== frames || result.shape[1] !== 1662) {
      console.error('❌ ERROR: Tensor normalizado tiene forma incorrecta:', result.shape, 'esperado: [', frames, ', 1662]');
    }
    
    return result;
  });
}

/**
 * Dibuja los landmarks de MediaPipe en el canvas
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {Object} results - Resultados de MediaPipe Holistic
 * @param {number} width - Ancho del canvas
 * @param {number} height - Alto del canvas
 */
export function drawHolisticLandmarks(ctx, results, width, height) {
  ctx.save();

  const drawLandmarks = (landmarks, connections, color) => {
    if (!landmarks) return;

    if (connections) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          ctx.beginPath();
          ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
          ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
          ctx.stroke();
        }
      });
    }

    ctx.fillStyle = color;
    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
    [25, 27], [26, 28]
  ];

  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
  ];

  drawLandmarks(results.poseLandmarks, POSE_CONNECTIONS, '#FF5050');
  drawLandmarks(results.leftHandLandmarks, HAND_CONNECTIONS, '#50FF50');
  drawLandmarks(results.rightHandLandmarks, HAND_CONNECTIONS, '#5050FF');

  ctx.restore();
}

/**
 * Constantes del modelo
 */
export const MODEL_CONFIG = {
  FRAMES: 15,
  KEYPOINTS_LENGTH: 1662,
  MIN_LENGTH_FRAMES: 5,
  DEFAULT_THRESHOLD: 0.1,
  MARGIN_FRAME: 1,
  DELAY_FRAMES: 3,
};

/**
 * Mapeo de palabras a texto hablado (español)
 * Convierte los IDs de gestos (con guiones) a texto legible
 */
export const WORDS_TEXT = {
  "hola": "Hola",
  "adios": "Adiós",
  "bien": "Bien",
  "mal": "Mal",
  "gracias": "Gracias",
  "perdon": "Perdón",
  "lo-siento": "Lo siento",
  "por-favor": "Por favor",
  "con-gusto": "Con gusto",
  "buenos-dias": "Buenos días",
  "buenas-tardes": "Buenas tardes",
  "buenas-noches": "Buenas noches",
  "bienvenido": "Bienvenido",
  "como-estas": "¿Cómo estás?",
  "mas-o-menos": "Más o menos",
  "sordo": "Sordo",
  "permiso": "Permiso",
  "feliz-cumpleanos": "Feliz cumpleaños",
};
