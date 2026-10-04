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
  const pose = results.poseLandmarks
    ? results.poseLandmarks.flatMap(lm => [lm.x, lm.y, lm.z, lm.visibility || 0])
    : new Array(33 * 4).fill(0);

  const face = results.faceLandmarks
    ? results.faceLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(468 * 3).fill(0);

  const leftHand = results.leftHandLandmarks
    ? results.leftHandLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(21 * 3).fill(0);

  const rightHand = results.rightHandLandmarks
    ? results.rightHandLandmarks.flatMap(lm => [lm.x, lm.y, lm.z])
    : new Array(21 * 3).fill(0);

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
 * Parametros de segmentacion de la captura. El numero de frames, el umbral de
 * confianza y el margen vienen de public/models/model_config.json (los fija el
 * entrenamiento), no se hardcodean aqui.
 */
export const MODEL_CONFIG = {
  MIN_LENGTH_FRAMES: 5,
  MARGIN_FRAME: 1,
  DELAY_FRAMES: 3,
  COOLDOWN_MS: 1500,
};
