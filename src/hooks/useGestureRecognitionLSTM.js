import { useEffect, useRef, useState, useCallback } from 'react';
import {
  extractKeypoints,
  handDetected,
  MODEL_CONFIG,
} from '@/lib/gestureRecognitionLSTM';
import { displayText } from '@/lib/vocabulary';
import { preprocessSequence, resampleSequence } from '@/lib/preprocess';
import {
  decidePrediction,
  isDuplicate,
  REJECTION_MESSAGES,
  sentenceToText,
} from '@/lib/recognition';
import { isSpeechSupported, speak, stopSpeaking } from '@/lib/speech';
import { getVideoConstraints } from '@/lib';

const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const REJECTION_VISIBLE_MS = 3500;
const MAX_FRAME_FAILURES = 60; // ~2 s seguidos fallando: MediaPipe no esta funcionando

/**
 * Reconocimiento de señas LSC con el modelo v7 (ver gesto_releasev1/src/preprocess.py).
 * Los parametros del modelo (frames, umbral, margen, clases) se leen de
 * /models/model_config.json; si no se puede leer, se muestra un error en vez de
 * predecir con valores inventados.
 */
export function useGestureRecognitionLSTM(options = {}) {
  const {
    threshold: thresholdOverride = null,
    marginFrame = MODEL_CONFIG.MARGIN_FRAME,
    delayFrames = MODEL_CONFIG.DELAY_FRAMES,
    minLengthFrames = MODEL_CONFIG.MIN_LENGTH_FRAMES,
    maxSentenceLength = 12,
    onPrediction = null,
  } = options;

  const videoRef = useRef(null);
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const loopTimerRef = useRef(null);
  const activeRef = useRef(true);
  const modelRef = useRef(null);
  const tfRef = useRef(null);
  const configRef = useRef(null);
  const onResultsRef = useRef(null);
  const rejectionTimerRef = useRef(null);

  const keypointsSequenceRef = useRef([]);
  const countFrameRef = useRef(0);
  const fixFramesRef = useRef(0);
  const recordingRef = useRef(false);
  const processingRef = useRef(false);
  const lastPredictionRef = useRef({ wordId: null, timestamp: 0 });
  const mutedRef = useRef(false);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isHolisticReady, setIsHolisticReady] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [isVideoMounted, setIsVideoMounted] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [rejection, setRejection] = useState(null);
  const [sentence, setSentence] = useState([]);
  const [status, setStatus] = useState('Inicializando...');
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [modelConfig, setModelConfig] = useState(null);

  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    setIsVideoMounted(!!node);
  }, []);

  const resetCaptureState = useCallback(() => {
    keypointsSequenceRef.current = [];
    countFrameRef.current = 0;
    fixFramesRef.current = 0;
    recordingRef.current = false;
  }, []);

  const showRejection = useCallback((reason, confidence) => {
    setRejection({ reason, message: REJECTION_MESSAGES[reason], confidence });
    clearTimeout(rejectionTimerRef.current);
    rejectionTimerRef.current = setTimeout(() => setRejection(null), REJECTION_VISIBLE_MS);
  }, []);

  /** Carga el modelo TF.js y su configuracion. Cualquier fallo es un error visible. */
  const loadModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setStatus('Cargando modelo...');

      const tf = await import('@tensorflow/tfjs');
      tfRef.current = tf;

      const configResponse = await fetch('/models/model_config.json');
      if (!configResponse.ok) throw new Error('model_config.json no disponible');
      const config = await configResponse.json();
      if (!config.frames || !config.features || !Array.isArray(config.classes)) {
        throw new Error('model_config.json incompleto');
      }

      const model = await tf.loadLayersModel('/models/model.json');
      const inputShape = model.inputs[0].shape;
      if (inputShape[1] !== config.frames || inputShape[2] !== config.features) {
        throw new Error(`El modelo espera ${inputShape.slice(1)} y la config declara ${config.frames}x${config.features}`);
      }

      // Calentamiento: la primera inferencia compila los kernels y tarda mucho mas.
      tf.tidy(() => model.predict(tf.zeros([1, config.frames, config.features])));

      if (!activeRef.current) {
        model.dispose();
        return;
      }
      modelRef.current = model;
      configRef.current = config;
      setModelConfig(config);
      setIsModelLoading(false);
      setStatus('Modelo listo');
    } catch (err) {
      console.error('Error cargando modelo:', err);
      setError('No se pudo cargar el modelo de reconocimiento. Recarga la página.');
      setIsModelLoading(false);
    }
  }, []);

  /** Infiere sobre una secuencia ya capturada y decide si aceptarla. */
  const processPrediction = useCallback(async (capturedSequence) => {
    const model = modelRef.current;
    const config = configRef.current;
    const tf = tfRef.current;
    if (!model || !config || !tf || capturedSequence.length === 0) return;

    processingRef.current = true;
    try {
      setStatus('Procesando...');

      const trim = marginFrame + delayFrames;
      const sequence = capturedSequence.length > trim ? capturedSequence.slice(0, -trim) : capturedSequence;

      // El modelo manda: use_face=false (modelos con LSC-54) deja la cara fuera. Sin el campo, como el v7.
      const features = preprocessSequence(resampleSequence(sequence, config.frames), {
        useFace: config.preprocess?.use_face !== false,
      });
      const flat = new Float32Array(config.frames * config.features);
      features.forEach((frame, i) => flat.set(frame, i * config.features));

      const input = tf.tensor(flat, [1, config.frames, config.features], 'float32');
      const output = model.predict(input);
      const probs = await output.data();
      input.dispose();
      output.dispose();

      const decision = decidePrediction(probs, config.classes, {
        threshold: thresholdOverride ?? config.threshold,
        margin: config.margin,
        negativeClass: config.negative_class,
      });

      if (!decision.accepted) {
        showRejection(decision.reason, decision.confidence);
        return;
      }

      const wordId = decision.label;
      const now = Date.now();
      if (isDuplicate(lastPredictionRef.current, wordId, now, MODEL_CONFIG.COOLDOWN_MS)) return;
      lastPredictionRef.current = { wordId, timestamp: now };

      const text = displayText(config, wordId);
      const result = { label: wordId, wordId, text, confidence: decision.confidence };

      clearTimeout(rejectionTimerRef.current);
      setRejection(null);
      setCurrentPrediction(result);
      setSentence((prev) => [...prev, text].slice(-maxSentenceLength));
      if (!mutedRef.current) speak(text);
      onPrediction?.(result);
    } catch (err) {
      console.error('Error en predicción:', err);
    } finally {
      processingRef.current = false;
    }
  }, [marginFrame, delayFrames, maxSentenceLength, onPrediction, thresholdOverride, showRejection]);

  /** Segmenta gestos por presencia de manos y dispara la inferencia. */
  const onResults = useCallback((results) => {
    if (handDetected(results) || recordingRef.current) {
      recordingRef.current = false;
      countFrameRef.current += 1;
      if (countFrameRef.current > marginFrame) {
        keypointsSequenceRef.current.push(extractKeypoints(results));
        setStatus('Capturando seña...');
      }
      return;
    }

    if (countFrameRef.current >= minLengthFrames + marginFrame) {
      fixFramesRef.current += 1;
      if (fixFramesRef.current < delayFrames) {
        recordingRef.current = true;
        return;
      }
      // Fin del gesto: se toma la secuencia y se reinicia la captura de inmediato,
      // asi un gesto nuevo no se mezcla con uno en proceso.
      const captured = keypointsSequenceRef.current;
      resetCaptureState();
      if (!processingRef.current) processPrediction(captured);
      return;
    }

    resetCaptureState();
    setStatus('Listo para capturar');
  }, [marginFrame, delayFrames, minLengthFrames, resetCaptureState, processPrediction]);

  // MediaPipe guarda el callback una sola vez; esta referencia mantiene siempre el vigente.
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  const initializeHolistic = useCallback(async () => {
    try {
      const { Holistic } = await import('@mediapipe/holistic');
      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0,
        minTrackingConfidence: 0.5,
      });
      holistic.onResults((results) => onResultsRef.current?.(results));

      if (!activeRef.current) {
        holistic.close();
        return;
      }
      holisticRef.current = holistic;
      setIsHolisticReady(true);
    } catch (err) {
      console.error('Error inicializando Holistic:', err);
      setError('Error al inicializar MediaPipe. Revisa tu conexión a internet.');
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !holisticRef.current) return;

    try {
      setStatus('Solicitando permisos de cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { ...getVideoConstraints(), frameRate: { ideal: TARGET_FPS, max: TARGET_FPS } },
        audio: false,
      });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      cameraRef.current = { stop: () => stream.getTracks().forEach((t) => t.stop()) };

      video.addEventListener('loadeddata', () => {
        setIsWebcamReady(true);
        setStatus('Listo para capturar');

        let consecutiveFailures = 0;
        const processFrame = async () => {
          if (!activeRef.current) return;
          const started = performance.now();
          if (holisticRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
            try {
              await holisticRef.current.send({ image: video });
              consecutiveFailures = 0;
            } catch (err) {
              consecutiveFailures += 1;
              if (consecutiveFailures === 1) console.error('Error procesando frame:', err);
              if (consecutiveFailures >= MAX_FRAME_FAILURES) {
                setError('No se pudo cargar el detector de manos (MediaPipe). Revisa tu conexión a internet y recarga la página.');
                return;
              }
            }
          }
          const wait = Math.max(0, FRAME_INTERVAL_MS - (performance.now() - started));
          loopTimerRef.current = setTimeout(processFrame, wait);
        };
        processFrame();
      }, { once: true });

      await video.play();
    } catch (err) {
      console.error('Error iniciando cámara:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permisos de cámara denegados. Permite el acceso a la cámara para continuar.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en el dispositivo.');
      } else {
        setError(`No se pudo acceder a la cámara: ${err.message}`);
      }
    }
  }, []);

  const clearSentence = useCallback(() => {
    stopSpeaking();
    setSentence([]);
    setCurrentPrediction(null);
    setRejection(null);
    lastPredictionRef.current = { wordId: null, timestamp: 0 };
  }, []);

  const speakSentence = useCallback(() => {
    speak(sentenceToText(sentence));
  }, [sentence]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    if (next) stopSpeaking();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    activeRef.current = true;
    setSpeechSupported(isSpeechSupported());

    (async () => {
      await loadModel();
      if (activeRef.current) await initializeHolistic();
    })();

    return () => {
      activeRef.current = false;
      clearTimeout(loopTimerRef.current);
      clearTimeout(rejectionTimerRef.current);
      cameraRef.current?.stop();
      cameraRef.current = null;
      holisticRef.current?.close();
      holisticRef.current = null;
      modelRef.current?.dispose();
      modelRef.current = null;
      stopSpeaking();
    };
  }, [loadModel, initializeHolistic]);

  useEffect(() => {
    if (!isModelLoading && isHolisticReady && isVideoMounted && !isWebcamReady && !error) {
      startCamera();
    }
  }, [isModelLoading, isHolisticReady, isVideoMounted, isWebcamReady, error, startCamera]);

  return {
    videoRef: setVideoRef,
    isModelLoading,
    isWebcamReady,
    currentPrediction,
    rejection,
    sentence,
    status,
    error,
    clearSentence,
    speakSentence,
    isMuted,
    toggleMute,
    speechSupported,
    modelConfig,
  };
}
