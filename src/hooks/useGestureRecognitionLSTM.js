import { useEffect, useRef, useState, useCallback } from 'react';
import {
  extractKeypoints,
  handDetected,
  normalizeKeypoints,
  MODEL_CONFIG,
  WORDS_TEXT
} from '@/lib/gestureRecognitionLSTM';
import { getVideoConstraints } from '@/lib';

/**
 * Hook personalizado para reconocimiento de gestos con LSTM
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones del reconocimiento
 */
export function useGestureRecognitionLSTM(options = {}) {
  const {
    threshold = MODEL_CONFIG.DEFAULT_THRESHOLD,
    marginFrame = MODEL_CONFIG.MARGIN_FRAME,
    delayFrames = MODEL_CONFIG.DELAY_FRAMES,
    minLengthFrames = MODEL_CONFIG.MIN_LENGTH_FRAMES,
    maxSentenceLength = 10, // Límite máximo de gestos en el historial
    onPrediction = null,
  } = options;

  // Referencias
  const videoRef = useRef(null);
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const labelsRef = useRef([]);

  // Estado de captura
  const keypointsSequenceRef = useRef([]);
  const countFrameRef = useRef(0);
  const fixFramesRef = useRef(0);
  const recordingRef = useRef(false);
  
  // Cooldown para evitar predicciones duplicadas
  const lastPredictionRef = useRef({ wordId: null, timestamp: 0 });
  const PREDICTION_COOLDOWN = 1500; // ms - tiempo mínimo entre predicciones del mismo gesto

  // Estado React
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isHolisticReady, setIsHolisticReady] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [isVideoMounted, setIsVideoMounted] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [sentence, setSentence] = useState([]);
  const [status, setStatus] = useState('Inicializando...');
  const [error, setError] = useState(null);

  // Callback ref para detectar cuando el video está montado
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node) {
      setIsVideoMounted(true);
    } else {
      setIsVideoMounted(false);
    }
  }, []);

  /**
   * Carga el modelo TFJS y las etiquetas
   */
  const loadModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setStatus('Cargando modelo LSTM...');

      // Importar TensorFlow.js dinámicamente (solo en cliente)
      const tf = await import('@tensorflow/tfjs');
      // Cargar modelo TensorFlow.js (GraphModel, no LayersModel)
      // El modelo generado desde SavedModel es un GraphModel
      const model = await tf.loadLayersModel('/models/model.json');
      modelRef.current = model;

      // Cargar etiquetas
      const response = await fetch('/models/words.json');
      const data = await response.json();
      labelsRef.current = data.word_ids || [];

      // console.log('✅ Modelo LSTM cargado:', labelsRef.current);
      // console.log('✅ Input shape esperado:', model.inputs[0].shape);
      // console.log('📊 Model info:');
      // console.log('  - Inputs:', model.inputs.map(i => ({ name: i.name, shape: i.shape })));
      // console.log('  - Outputs:', model.outputs.map(o => ({ name: o.name, shape: o.shape })));
      setIsModelLoading(false);
      setStatus('Modelo listo');
    } catch (err) {
      console.error('❌ Error cargando modelo:', err);
      setError('No se pudo cargar el modelo LSTM');
      setIsModelLoading(false);
    }
  }, []);

  /**
   * Procesa los resultados de MediaPipe y captura keypoints
   */
  const onResults = useCallback((results) => {

    // Lógica de captura (igual a run_local_recognition.py)
    const isHandPresent = handDetected(results);

    if (isHandPresent || recordingRef.current) {
      recordingRef.current = false;
      countFrameRef.current += 1;

      if (countFrameRef.current > marginFrame) {
        const keyframe = extractKeypoints(results);
        keypointsSequenceRef.current.push(keyframe);
        setStatus('🔴 Capturando gesto...');
      }
    } else {
      // No hay manos detectadas
      if (countFrameRef.current >= minLengthFrames + marginFrame) {
        fixFramesRef.current += 1;

        if (fixFramesRef.current < delayFrames) {
          recordingRef.current = true;
          setStatus('🔴 Capturando gesto...');
        } else {
          // Tiempo de procesar la secuencia
          processPrediction();
        }
      } else {
        // Reset
        resetCaptureState();
        setStatus('✋ Listo para capturar');
      }
    }

  }, [marginFrame, delayFrames, minLengthFrames, threshold]);

  /**
   * Procesa la predicción con el modelo LSTM
   */
  const processPrediction = useCallback(async () => {
    if (!modelRef.current || keypointsSequenceRef.current.length === 0) {
      resetCaptureState();
      return;
    }

    try {
      setStatus('🔍 Procesando...');

      // Importar TensorFlow.js dinámicamente
      const tf = await import('@tensorflow/tfjs');

      // Recortar frames del margen y delay
      let sequence = keypointsSequenceRef.current;
      const trimAmount = marginFrame + delayFrames;
      if (trimAmount > 0 && sequence.length > trimAmount) {
        sequence = sequence.slice(0, -trimAmount);
      }

      // Normalizar a 15 frames
      const normalized = normalizeKeypoints(sequence, MODEL_CONFIG.FRAMES);

      // Convertir a tensor [1, 15, 1662]
      // GraphModel requiere que el input sea un tensor con la forma correcta
      const sequenceData = normalized.map(frame => Array.from(frame));
      // console.log('➡️ Input tensor data shape:', [1, MODEL_CONFIG.FRAMES, MODEL_CONFIG.KEYPOINTS_LENGTH]);
      const inputTensor = tf.tensor3d([sequenceData], [1, MODEL_CONFIG.FRAMES, MODEL_CONFIG.KEYPOINTS_LENGTH]);

      // Predicción con GraphModel usando execute()
      // Para GraphModel con LSTM, usar execute() en lugar de executeAsync()
      const prediction = modelRef.current.predict(inputTensor);
      
      // Si execute devuelve un array, tomar el primer tensor
      const outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
      const probabilities = await outputTensor.data();
      
      // Limpiar tensores
      inputTensor.dispose();
      outputTensor.dispose();
      if (Array.isArray(prediction) && prediction.length > 1) {
        prediction.slice(1).forEach(t => t.dispose());
      }

      // Obtener clase predicha
      const maxIdx = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[maxIdx];

      if (confidence > threshold) {
        const label = labelsRef.current[maxIdx];
        
        // Remover SOLO sufijos de direccionalidad (-der, -izq, -gen)
        // pero mantener guiones en nombres de gestos (ej: "lo-siento", "como-estas")
        const wordId = label.replace(/-(der|izq|gen)$/, '');
        
        // Sistema de cooldown para evitar predicciones duplicadas
        const now = Date.now();
        const timeSinceLastPrediction = now - lastPredictionRef.current.timestamp;
        const isSameGesture = lastPredictionRef.current.wordId === wordId;
        
        // Solo agregar si es un gesto diferente o si ha pasado el tiempo de cooldown
        if (!isSameGesture || timeSinceLastPrediction > PREDICTION_COOLDOWN) {
          // Buscar en diccionario o formatear automáticamente
          const text = WORDS_TEXT[wordId] || 
            wordId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

          const predictionResult = {
            label,
            wordId,
            text,
            confidence: confidence.toFixed(2),
          };

          setCurrentPrediction(predictionResult);

          // Actualizar frase
          setSentence(prev => {
            const newSentence = [text, ...prev];
            return newSentence.slice(0, maxSentenceLength);
          });

          // Callback opcional
          if (onPrediction) {
            onPrediction(predictionResult);
          }
          
          // Actualizar el timestamp de la última predicción
          lastPredictionRef.current = { wordId, timestamp: now };
        }

      }
    } catch (err) {
      console.error('Error en predicción:', err);
    } finally {
      resetCaptureState();
    }
  }, []);

  /**
   * Resetea el estado de captura
   */
  const resetCaptureState = useCallback(() => {
    keypointsSequenceRef.current = [];
    countFrameRef.current = 0;
    fixFramesRef.current = 0;
    recordingRef.current = false;
  }, []);

  /**
   * Inicializa MediaPipe Holistic
   */
  const initializeHolistic = useCallback(async () => {
    try {
      setStatus('Inicializando MediaPipe Holistic...');
      console.log('🔧 Inicializando MediaPipe Holistic...');

      // Importar MediaPipe dinámicamente (solo en cliente)
      const { Holistic } = await import('@mediapipe/holistic');

      const holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0,
        minTrackingConfidence: 0.5
      });

      holistic.onResults(onResults);
      holisticRef.current = holistic;

      setIsHolisticReady(true);
    } catch (err) {
      console.error('❌ Error inicializando Holistic:', err);
      setError('Error al inicializar MediaPipe Holistic');
    }
  }, [onResults]);

  /**
   * Inicia la cámara usando getUserMedia nativo
   */
  const startCamera = useCallback(async () => {
    
    if (!videoRef.current || !holisticRef.current) {
      console.error('❌ Referencias no disponibles');
      return;
    }

    try {
      setStatus('Solicitando permisos de cámara...');
      // console.log('📷 Solicitando acceso a cámara...');
      const videoConstraints = getVideoConstraints();

      // Usar getUserMedia nativo en lugar de @mediapipe/camera_utils
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });


      const video = videoRef.current;
      video.srcObject = stream;
      video.addEventListener('loadeddata', async () => {
        setIsWebcamReady(true);
        setStatus('✋ Listo para capturar');

        // Procesar frames manualmente
        const processFrame = async () => {
          if (holisticRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
            await holisticRef.current.send({ image: video });
          }
          if (cameraRef.current) {
            requestAnimationFrame(processFrame);
          }
        };

        // Iniciar el loop de procesamiento
        cameraRef.current = { stream, stop: () => stream.getTracks().forEach(track => track.stop()) };
        requestAnimationFrame(processFrame);
      });

      await video.play();
    } catch (err) {
      console.error('❌ Error iniciando cámara:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en el dispositivo.');
      } else {
        setError('No se pudo acceder a la cámara: ' + err.message);
      }
    }
  }, []);

  /**
   * Limpia la frase acumulada
   */
  const clearSentence = useCallback(() => {
    setSentence([]);
    setCurrentPrediction(null);
  }, []);

  /**
   * Efecto de inicialización
   */
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const initialize = async () => {
      await loadModel();
      await initializeHolistic();
    };

    initialize();

    // Cleanup
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (holisticRef.current) {
        holisticRef.current.close();
      }
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, [loadModel, initializeHolistic]);

  // Iniciar cámara cuando todo esté listo
  useEffect(() => {
    
    if (!isModelLoading && isHolisticReady && isVideoMounted && videoRef.current && !isWebcamReady) {
      startCamera();
    }
  }, [isModelLoading, isHolisticReady, isVideoMounted, isWebcamReady, startCamera]);

  return {
    videoRef: setVideoRef,  // Devuelve el callback ref
    isModelLoading,
    isWebcamReady,
    currentPrediction,
    sentence,
    status,
    error,
    clearSentence,
  };
}
