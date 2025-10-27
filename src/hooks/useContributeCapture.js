import { useRef, useState, useCallback } from 'react';
import { uploadToDrive, saveToBackend } from '@/lib/saveToBackend';

/**
 * Hook para capturar gestos en la página de contribución
 * Sube automáticamente a Google Drive
 */
export function useContributeCapture(options = {}) {
  const {
    preCaptureFrames = 1,
    minRequiredFrames = 5,
    frameDelay = 3,
    onCapture = null,
    useDrive = true, // ⭐ Usar Google Drive por defecto
  } = options;

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const isInitializingRef = useRef(false); // Prevenir inicializaciones concurrentes

  // Estado de captura
  const keypointsBufferRef = useRef([]); // Guardamos keypoints (1662 valores por frame)
  const frameCounterRef = useRef(0);
  const delayedFramesRef = useRef(0);
  const capturingRef = useRef(false);

  // Estado React
  const [isHolisticReady, setIsHolisticReady] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const [status, setStatus] = useState('Inicializando...');
  const [error, setError] = useState(null);

  /**
   * Detecta si hay manos en el resultado
   */
  const handDetected = useCallback((results) => {
    return !!(results.leftHandLandmarks || results.rightHandLandmarks);
  }, []);

  /**
   * Extrae keypoints del resultado de MediaPipe (formato compatible con train_lstm_node.js)
   * Replica extract_keypoints() de utility.py
   */
  const extractKeypoints = useCallback((results) => {
    // Helper: redondear a 6 decimales para reducir tamaño
    const round = (num) => Math.round(num * 1000000) / 1000000;

    // POSE: 33 landmarks × 4 valores (x, y, z, visibility) = 132
    const pose = results.poseLandmarks
      ? results.poseLandmarks.flatMap(lm => [
          round(lm.x), 
          round(lm.y), 
          round(lm.z), 
          round(lm.visibility ?? 0)
        ])
      : new Array(33 * 4).fill(0);

    // FACE: 468 landmarks × 3 valores (x, y, z) = 1404
    const face = results.faceLandmarks
      ? results.faceLandmarks.flatMap(lm => [
          round(lm.x), 
          round(lm.y), 
          round(lm.z)
        ])
      : new Array(468 * 3).fill(0);

    // LEFT HAND: 21 landmarks × 3 valores (x, y, z) = 63
    const leftHand = results.leftHandLandmarks
      ? results.leftHandLandmarks.flatMap(lm => [
          round(lm.x), 
          round(lm.y), 
          round(lm.z)
        ])
      : new Array(21 * 3).fill(0);

    // RIGHT HAND: 21 landmarks × 3 valores (x, y, z) = 63
    const rightHand = results.rightHandLandmarks
      ? results.rightHandLandmarks.flatMap(lm => [
          round(lm.x), 
          round(lm.y), 
          round(lm.z)
        ])
      : new Array(21 * 3).fill(0);

    // Total: 132 + 1404 + 63 + 63 = 1662 valores
    return [...pose, ...face, ...leftHand, ...rightHand];
  }, []);

  /**
   * Guarda una muestra capturada con keypoints
   * Prioridad: Google Drive → Backend local → localStorage
   */
  const saveSample = useCallback(async (keypoints, gesture) => {
    if (!keypoints || keypoints.length === 0) {
      console.warn('⚠️ No hay keypoints para guardar');
      return null;
    }

    const timestamp = Date.now();
    const sample = {
      gesture: gesture.id,
      gestureName: gesture.label,
      timestamp,
      totalFrames: keypoints.length,
      keypoints, // Array de arrays [1662 valores cada uno]
      metadata: {
        date: new Date().toISOString(),
        browser: navigator.userAgent,
      }
    };

    // Opción 1: Google Drive (recomendado) ⭐
    if (useDrive) {
      try {
        const result = await uploadToDrive(sample);
        console.log(`✅ Subido a Drive: ${result.filename}`);
        setTotalSamples(prev => prev + 1);
        
        if (onCapture) {
          onCapture(sample);
        }
        
        return result;
      } catch (error) {
        console.error('❌ Error subiendo a Drive:', error);
        console.log('⚠️ Intentando guardar en backend local...');
        // Continuar con backend local si falla Drive
      }
    }

    // Opción 2: Backend local (fallback)
    try {
      const result = await saveToBackend(sample);
      console.log(`✅ Guardado en backend local: ${result.filename}`);
      setTotalSamples(prev => prev + 1);
      
      if (onCapture) {
        onCapture(sample);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error en backend local:', error);
      console.log('⚠️ Intentando guardar en localStorage...');
    }

    // Opción 3: localStorage (último recurso)
    const storageKey = `gesture_${gesture.id}_${timestamp}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(sample));
      console.log(`✅ Muestra guardada localmente: ${storageKey}`);

      setTotalSamples(prev => prev + 1);

      if (onCapture) {
        onCapture(sample);
      }

      return sample;
    } catch (err) {
      console.error('❌ Error guardando muestra:', err);
      if (err.name === 'QuotaExceededError') {
        alert('⚠️ Memoria llena. Contacta al administrador.');
      }
      return null;
    }
  }, [useDrive, onCapture]);

  /**
   * Resetea el estado de captura
   */
  const resetCaptureState = useCallback(() => {
    keypointsBufferRef.current = [];
    frameCounterRef.current = 0;
    delayedFramesRef.current = 0;
    capturingRef.current = false;
    setIsCapturing(false);
    setCapturedFrames(0);
  }, []);

  // ⚡ Landmarks desactivados para mejor rendimiento

  /**
   * Procesa los resultados de MediaPipe (sin dibujar landmarks para mejor rendimiento)
   */
  const onResults = useCallback((results, gesture) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar video (sin landmarks para mejor rendimiento)
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // Lógica de captura
    const isHandPresent = handDetected(results);

    if (isHandPresent || capturingRef.current) {
      capturingRef.current = false;
      frameCounterRef.current += 1;

      if (frameCounterRef.current > preCaptureFrames) {
        // Extraer keypoints del frame actual
        const keypoints = extractKeypoints(results);
        keypointsBufferRef.current.push(keypoints);

        setIsCapturing(true);
        setCapturedFrames(keypointsBufferRef.current.length);
        setStatus('🔴 Capturando...');

        // Indicador visual
        ctx.fillStyle = 'rgba(255, 50, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF3200';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Capturando...', 10, 40);
        ctx.fillText(`Frames: ${keypointsBufferRef.current.length}`, 10, 70);
      }
    } else {
      // No hay manos
      if (keypointsBufferRef.current.length >= minRequiredFrames + preCaptureFrames) {
        delayedFramesRef.current += 1;

        if (delayedFramesRef.current < frameDelay) {
          capturingRef.current = true;
          return;
        }

        // Guardar muestra (remover keypoints de pre-captura y delay)
        const keypointsToSave = keypointsBufferRef.current.slice(
          0,
          -(preCaptureFrames + frameDelay)
        );

        if (keypointsToSave.length >= minRequiredFrames) {
          console.log(`💾 Guardando muestra con ${keypointsToSave.length} keypoints`);
          saveSample(keypointsToSave, gesture);

          // Efecto visual
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#00FF00';
          ctx.font = 'bold 32px Arial';
          ctx.fillText('✓ Guardado!', canvas.width / 2 - 80, canvas.height / 2);
        }
      }

      // Reset
      resetCaptureState();
      setStatus('✋ Listo para capturar');

      // Indicador visual
      ctx.fillStyle = '#00DC64';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Listo para capturar...', 10, 40);
    }
  }, [
    handDetected,
    extractKeypoints,
    saveSample,
    resetCaptureState,
    preCaptureFrames,
    minRequiredFrames,
    frameDelay
  ]);

  /**
   * Inicializa MediaPipe Holistic
   */
  const initializeHolistic = useCallback(async (gesture) => {
    // Prevenir inicializaciones concurrentes
    if (isInitializingRef.current) {
      console.warn('⚠️ Ya hay una inicialización en curso, ignorando...');
      return;
    }

    // Si ya existe una instancia, limpiarla primero
    if (holisticRef.current) {
      console.log('🧹 Limpiando instancia previa de Holistic...');
      holisticRef.current.close();
      holisticRef.current = null;
    }

    isInitializingRef.current = true;

    try {
      setStatus('Inicializando MediaPipe...');
      console.log('🔧 Inicializando MediaPipe Holistic...');

      const { Holistic } = await import('@mediapipe/holistic');
      console.log('✅ MediaPipe importado');

      const holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
      });

      holistic.setOptions({
        modelComplexity: 1, // ✅ Balanceado entre precisión y velocidad (consistente con reconocimiento)
        smoothLandmarks: true, // ✅ Suavizado activado para keypoints más estables
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false, // ⚡ No necesitamos precisión facial
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      holistic.onResults((results) => onResults(results, gesture));
      holisticRef.current = holistic;

      console.log('✅ MediaPipe Holistic inicializado');
      setIsHolisticReady(true);
      setStatus('MediaPipe listo');
    } catch (err) {
      console.error('❌ Error inicializando Holistic:', err);
      setError('Error al inicializar MediaPipe');
    } finally {
      isInitializingRef.current = false;
    }
  }, [onResults]);

  /**
   * Inicia la cámara
   */
  const startCamera = useCallback(async () => {
    console.log('📷 Iniciando cámara...');

    if (!videoRef.current || !holisticRef.current) {
      console.error('❌ Referencias no disponibles');
      return;
    }

    // Si ya hay una cámara activa, detenerla primero
    if (cameraRef.current) {
      console.log('🛑 Deteniendo cámara previa...');
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    try {
      setStatus('Solicitando permisos de cámara...');
      console.log('📷 Solicitando acceso a cámara...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          frameRate: { ideal: 30, max: 30 }  // ← Añadir esto
        },
        audio: false
      });

      console.log('✅ Stream de cámara obtenido');

      const video = videoRef.current;
      video.srcObject = stream;

      video.addEventListener('loadeddata', async () => {
        console.log('✅ Video cargado, iniciando procesamiento...');
        setIsWebcamReady(true);
        setStatus('✋ Listo para capturar');

        const processFrame = async () => {
          if (holisticRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
            await holisticRef.current.send({ image: video });
          }
          if (cameraRef.current) {
            requestAnimationFrame(processFrame);
          }
        };

        cameraRef.current = {
          stream,
          stop: () => stream.getTracks().forEach(track => track.stop())
        };

        requestAnimationFrame(processFrame);
      }, { once: true }); // Asegurar que solo se ejecute una vez

      console.log('📷 Reproduciendo video...');
      await video.play();
    } catch (err) {
      console.error('❌ Error iniciando cámara:', err);

      let errorMessage = 'No se pudo acceder a la cámara';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en el dispositivo.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso. Cierra otras aplicaciones que la usen.';
      }

      setError(errorMessage);
      setStatus(`❌ ${errorMessage}`);
    }
  }, []);

  /**
   * Limpieza
   */
  const cleanup = useCallback(() => {
    console.log('🧹 Ejecutando limpieza completa...');
    
    if (cameraRef.current) {
      console.log('🛑 Deteniendo cámara...');
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (holisticRef.current) {
      console.log('🛑 Cerrando Holistic...');
      holisticRef.current.close();
      holisticRef.current = null;
    }

    resetCaptureState();
    setIsHolisticReady(false);
    setIsWebcamReady(false);
    setStatus('Detenido');
    setError(null);
    isInitializingRef.current = false;
  }, [resetCaptureState]);

  /**
   * Limpia la lista de muestras
   */
  const clearSamples = useCallback(() => {
    setTotalSamples(0);
  }, []);

  return {
    videoRef,
    canvasRef,
    isHolisticReady,
    isWebcamReady,
    isCapturing,
    capturedFrames,
    totalSamples,
    status,
    error,
    initializeHolistic,
    startCamera,
    cleanup,
    clearSamples,
  };
}
