import { useEffect, useRef, useState, useCallback } from 'react';
import {
  extractKeypoints,
  handDetected,
  normalizeKeypoints,
  normalizeKeypointsSequence,
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
  const animationFrameIdRef = useRef(null);
  const modelRef = useRef(null);
  const labelsRef = useRef([]);
  const normalizationStatsRef = useRef(null);

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
   * Carga el modelo TFJS, las etiquetas y las estadísticas de normalización
   */
  const loadModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setStatus('Cargando modelo LSTM...');

      const tf = await import('@tensorflow/tfjs');
      const model = await tf.loadLayersModel('/models/model.json');
      modelRef.current = model;

      // Cargar etiquetas
      const response = await fetch('/models/words.json');
      const data = await response.json();
      labelsRef.current = data.word_ids || [];

      try {
        const statsResponse = await fetch('/models/normalization_stats.json');
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          normalizationStatsRef.current = stats;
        } else {
          normalizationStatsRef.current = null;
        }
      } catch (statsError) {
        normalizationStatsRef.current = null;
      }

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

      const tf = await import('@tensorflow/tfjs');

      let sequence = keypointsSequenceRef.current;
      const trimAmount = marginFrame + delayFrames;
      if (trimAmount > 0 && sequence.length > trimAmount) {
        sequence = sequence.slice(0, -trimAmount);
      }

      const normalized = normalizeKeypoints(sequence, MODEL_CONFIG.FRAMES);

      const sequenceData = normalized.map(frame => {
        if (frame instanceof Float32Array) {
          return Array.from(frame);
        }
        return Array.from(frame);
      });
      const sequenceTensor = tf.tensor2d(sequenceData, [MODEL_CONFIG.FRAMES, MODEL_CONFIG.KEYPOINTS_LENGTH], 'float32');

      let normalizedSequenceTensor = sequenceTensor;
      if (normalizationStatsRef.current) {
        normalizedSequenceTensor = normalizeKeypointsSequence(
          sequenceTensor,
          normalizationStatsRef.current,
          tf
        );
      }

      if (normalizedSequenceTensor.shape[0] !== MODEL_CONFIG.FRAMES || 
          normalizedSequenceTensor.shape[1] !== MODEL_CONFIG.KEYPOINTS_LENGTH) {
        console.error('❌ ERROR: Tensor normalizado tiene forma incorrecta:', 
          normalizedSequenceTensor.shape, 
          'esperado: [', MODEL_CONFIG.FRAMES, ',', MODEL_CONFIG.KEYPOINTS_LENGTH, ']');
      }
      
      const inputTensor = normalizedSequenceTensor.expandDims(0);
      
      if (inputTensor.shape[0] !== 1 || 
          inputTensor.shape[1] !== MODEL_CONFIG.FRAMES || 
          inputTensor.shape[2] !== MODEL_CONFIG.KEYPOINTS_LENGTH) {
        console.error('❌ ERROR: Tensor de entrada tiene forma incorrecta:', 
          inputTensor.shape, 
          'esperado: [1,', MODEL_CONFIG.FRAMES, ',', MODEL_CONFIG.KEYPOINTS_LENGTH, ']');
      }

      const prediction = modelRef.current.predict(inputTensor);
      const outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
      const probabilities = await outputTensor.data();
      
      inputTensor.dispose();
      if (normalizedSequenceTensor !== sequenceTensor) {
        normalizedSequenceTensor.dispose();
      }
      sequenceTensor.dispose();
      outputTensor.dispose();
      if (Array.isArray(prediction) && prediction.length > 1) {
        prediction.slice(1).forEach(t => t.dispose());
      }

      const maxIdx = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[maxIdx];

      if (confidence > threshold) {
        const label = labelsRef.current[maxIdx];
        const wordId = label.replace(/-(der|izq|gen)$/, '');
        
        const now = Date.now();
        const timeSinceLastPrediction = now - lastPredictionRef.current.timestamp;
        const isSameGesture = lastPredictionRef.current.wordId === wordId;
        
        if (!isSameGesture || timeSinceLastPrediction > PREDICTION_COOLDOWN) {
          const text = WORDS_TEXT[wordId] || 
            wordId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

          const predictionResult = {
            label,
            wordId,
            text,
            confidence: confidence.toFixed(2),
          };

          setCurrentPrediction(predictionResult);
          setSentence(prev => {
            const newSentence = [text, ...prev];
            return newSentence.slice(0, maxSentenceLength);
          });

          if (onPrediction) {
            onPrediction(predictionResult);
          }
          
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
      const videoConstraints = getVideoConstraints();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          ...videoConstraints,
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });

      const video = videoRef.current;
      video.srcObject = stream;
      const lastFrameTimeRef = { current: 0 };
      const TARGET_FPS = 30;
      const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

      video.addEventListener('loadeddata', async () => {
        setIsWebcamReady(true);
        setStatus('✋ Listo para capturar');

        const processFrame = async () => {
          const now = performance.now();
          const elapsed = now - lastFrameTimeRef.current;
          
          if (elapsed >= FRAME_INTERVAL_MS) {
            lastFrameTimeRef.current = now;
            
            if (holisticRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
              await holisticRef.current.send({ image: video });
            }
          }
          
          if (cameraRef.current) {
            const nextDelay = Math.max(0, FRAME_INTERVAL_MS - (performance.now() - lastFrameTimeRef.current));
            animationFrameIdRef.current = setTimeout(processFrame, nextDelay);
          }
        };

        cameraRef.current = { stream, stop: () => stream.getTracks().forEach(track => track.stop()) };
        lastFrameTimeRef.current = performance.now();
        animationFrameIdRef.current = setTimeout(processFrame, FRAME_INTERVAL_MS);
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
    if (typeof window === 'undefined') return;

    const initialize = async () => {
      await loadModel();
      await initializeHolistic();
    };

    initialize();

    return () => {
      if (animationFrameIdRef.current) {
        clearTimeout(animationFrameIdRef.current);
      }
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
    videoRef: setVideoRef,
    isModelLoading,
    isWebcamReady,
    currentPrediction,
    sentence,
    status,
    error,
    clearSentence,
  };
}
