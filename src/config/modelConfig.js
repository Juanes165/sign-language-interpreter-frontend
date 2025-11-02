/**
 * Configuración del Modelo de Reconocimiento de Gestos
 * 
 * IMPORTANTE: Estos valores deben coincidir con los del backend
 * (Tesis/gesto_releasev1/src/app_constants.py)
 */

export const MODEL_CONFIG = {
  // Frames del modelo LSTM
  MODEL_FRAMES: 15,  // Coincide con el modelo entrenado (train_lstm_node_v5.js y convert_frontend_samples_to_npy.py)
  
  // Keypoints por frame (MediaPipe Holistic)
  LENGTH_KEYPOINTS: 1662,
  
  // Configuración de captura
  MIN_REQUIRED_FRAMES: 5,   // Mínimo para capturar (validación básica)
  PRE_CAPTURE_FRAMES: 1,    // Frames antes de iniciar captura
  FRAME_DELAY: 3,           // Frames de delay para detener captura
  
  // Recomendaciones de captura
  RECOMMENDED_MIN_FRAMES: 10,   // Mínimo recomendado para buena calidad
  OPTIMAL_FRAMES: 15,           // Óptimo (coincide con MODEL_FRAMES)
  EXCELLENT_FRAMES: 20,         // Excelente calidad
};

/**
 * Evalúa la calidad de una muestra basándose en el número de frames
 */
export function evaluateQuality(totalFrames) {
  if (totalFrames >= MODEL_CONFIG.EXCELLENT_FRAMES) {
    return {
      level: 'excellent',
      label: '¡Excelente calidad!',
      color: 'green',
      message: 'Esta muestra tiene más frames que el óptimo, será entrenada con muestreo uniforme.'
    };
  }
  
  if (totalFrames >= MODEL_CONFIG.OPTIMAL_FRAMES) {
    return {
      level: 'optimal',
      label: '¡Calidad óptima!',
      color: 'green',
      message: 'Esta muestra es ideal para el modelo (coincide con MODEL_FRAMES).'
    };
  }
  
  if (totalFrames >= 8) {
    return {
      level: 'good',
      label: 'Buena calidad',
      color: 'blue',
      message: 'Esta muestra es válida y contribuirá bien al entrenamiento.'
    };
  }
  
  if (totalFrames >= MODEL_CONFIG.RECOMMENDED_MIN_FRAMES) {
    return {
      level: 'acceptable',
      label: 'Calidad aceptable',
      color: 'blue',
      message: 'Esta muestra es válida y contribuirá bien al entrenamiento.'
    };
  }
  
  if (totalFrames >= MODEL_CONFIG.MIN_REQUIRED_FRAMES) {
    return {
      level: 'acceptable',
      label: 'Calidad aceptable',
      color: 'yellow',
      message: 'La muestra es válida pero beneficiaría de más frames.'
    };
  }
  
  return {
    level: 'poor',
    label: 'Calidad baja',
    color: 'red',
    message: `Se recomienda capturar al menos ${MODEL_CONFIG.MIN_REQUIRED_FRAMES} frames.`
  };
}

export default MODEL_CONFIG;

