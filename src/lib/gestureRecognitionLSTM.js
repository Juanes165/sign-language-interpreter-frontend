/**
 * Utilidades para el reconocimiento de gestos con modelo LSTM
 * Compatible con MediaPipe Holistic
 */

/**
 * Extrae los keypoints de los resultados de MediaPipe Holistic
 * Replica la función extract_keypoints de Python
 * @param {Object} results - Resultados de MediaPipe Holistic
 * @returns {Float32Array} Array de 1662 valores (pose: 132, face: 1404, left_hand: 63, right_hand: 63)
 */
export function extractKeypoints(results) {
  // Pose: 33 landmarks × 4 valores (x, y, z, visibility) = 132
  const pose = results.poseLandmarks
    ? results.poseLandmarks.flatMap(lm => [lm.x, lm.y, lm.z, lm.visibility || 0])
    : new Array(33 * 4).fill(0);

  // Face: 468 landmarks × 3 valores (x, y, z) = 1404
  const face = results.faceLandmarks
    ? results.faceLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(468 * 3).fill(0);

  // Left Hand: 21 landmarks × 3 valores = 63
  const leftHand = results.leftHandLandmarks
    ? results.leftHandLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(21 * 3).fill(0);

  // Right Hand: 21 landmarks × 3 valores = 63
  const rightHand = results.rightHandLandmarks
    ? results.rightHandLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(21 * 3).fill(0);

  // Total: 132 + 1404 + 63 + 63 = 1662
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
 * @param {Array} keypoints - Array de frames con keypoints
 * @param {number} targetLength - Longitud objetivo (default: 15)
 * @returns {Array}
 */
export function interpolateKeypoints(keypoints, targetLength = 15) {
  const cur = keypoints.length;
  if (cur === targetLength) return keypoints;

  const indices = [];
  for (let i = 0; i < targetLength; i++) {
    indices.push((i * (cur - 1)) / (targetLength - 1));
  }

  const out = [];
  for (const idx of indices) {
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const w = idx - lo;

    if (lo === hi) {
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

/**
 * Normaliza la secuencia de keypoints al largo objetivo
 * @param {Array} keypoints - Array de frames
 * @param {number} targetLength - Longitud objetivo
 * @returns {Array}
 */
export function normalizeKeypoints(keypoints, targetLength = 15) {
  const cur = keypoints.length;

  if (cur < targetLength) {
    return interpolateKeypoints(keypoints, targetLength);
  }

  if (cur > targetLength) {
    const step = cur / targetLength;
    const indices = [];
    for (let i = 0; i < targetLength; i++) {
      indices.push(Math.floor(i * step));
    }
    return indices.map(i => keypoints[i]);
  }

  return keypoints;
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

  // Helper para dibujar landmarks
  const drawLandmarks = (landmarks, connections, color) => {
    if (!landmarks) return;

    // Dibujar conexiones
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

    // Dibujar puntos
    ctx.fillStyle = color;
    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Pose connections (simplificado)
  const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
    [25, 27], [26, 28]
  ];

  // Hand connections
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
  ];

  // Dibujar pose (rojo)
  drawLandmarks(results.poseLandmarks, POSE_CONNECTIONS, '#FF5050');

  // Dibujar manos
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
  DEFAULT_THRESHOLD: 0.7,
  MARGIN_FRAME: 1,
  DELAY_FRAMES: 3,
};

/**
 * Mapeo de palabras a texto hablado (español)
 */
export const WORDS_TEXT = {
  "adios": "Adiós",
  "bien": "Bien",
  "hola": "Hola",
  "como": "Cómo",
  "dias": "Buenos días",
  "paz": "Paz",
};
