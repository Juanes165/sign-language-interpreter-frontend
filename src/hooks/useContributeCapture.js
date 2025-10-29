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
  const waitingForDecisionRef = useRef(false); // ⭐ Control de procesamiento

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
  const [pendingSamples, setPendingSamples] = useState([]); // ⭐ Muestras pendientes de subir
  const [currentSample, setCurrentSample] = useState(null); // ⭐ Muestra actual esperando decisión
  const [waitingForDecision, setWaitingForDecision] = useState(false); // ⭐ Pausa la captura
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
   * Captura una muestra y PAUSA esperando decisión del usuario
   * El usuario debe confirmar (subir) o rechazar (eliminar)
   */
  const saveSample = useCallback(async (keypoints, gesture) => {
    if (!keypoints || keypoints.length === 0) {
      console.warn('⚠️ No hay keypoints para guardar');
      return null;
    }

    const timestamp = Date.now();
    const sample = {
      id: `sample_${timestamp}`, // ID único para identificar la muestra
      gesture: gesture.id,
      gestureName: gesture.label,
      timestamp,
      totalFrames: keypoints.length,
      keypoints, // Array de arrays [1662 valores cada uno]
      metadata: {
        date: new Date().toISOString(),
        browser: navigator.userAgent,
      },
      uploaded: false, // ⭐ Estado de subida
    };

    console.log(`✅ Muestra capturada: ${sample.totalFrames} frames - Esperando decisión del usuario`);

    // ⭐ PAUSA y espera decisión del usuario
    setCurrentSample(sample);
    setWaitingForDecision(true);
    waitingForDecisionRef.current = true; // ⭐ Pausar procesamiento de MediaPipe
    setStatus('⏸️ Esperando tu decisión...');

    if (onCapture) {
      onCapture(sample);
    }

    return sample;
  }, [onCapture]);

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

  /**
   * El usuario CONFIRMA la muestra - la sube
   */
  const confirmCurrentSample = useCallback(async () => {
    if (!currentSample) return;

    console.log(`📤 Usuario confirmó subir muestra: ${currentSample.id}`);

    // Opción 1: Google Drive (recomendado) ⭐
    let uploadResult = { success: false };
    
    if (useDrive) {
      try {
        const result = await uploadToDrive(currentSample);
        console.log(`✅ Subido a Drive: ${result.filename}`);
        uploadResult = { success: true, method: 'drive', result };
      } catch (error) {
        console.error('❌ Error subiendo a Drive:', error);
        console.log('⚠️ Intentando guardar en backend local...');
      }
    }

    // Opción 2: Backend local (fallback)
    if (!uploadResult.success) {
      try {
        const result = await saveToBackend(currentSample);
        console.log(`✅ Guardado en backend local: ${result.filename}`);
        uploadResult = { success: true, method: 'backend', result };
      } catch (error) {
        console.error('❌ Error en backend local:', error);
        console.log('⚠️ Guardando en localStorage...');
      }
    }

    // Opción 3: localStorage (último recurso)
    if (!uploadResult.success) {
      const storageKey = `gesture_${currentSample.gesture}_${currentSample.timestamp}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentSample));
        console.log(`✅ Muestra guardada localmente: ${storageKey}`);
        uploadResult = { success: true, method: 'localStorage', result: { key: storageKey } };
      } catch (err) {
        console.error('❌ Error guardando muestra:', err);
        if (err.name === 'QuotaExceededError') {
          alert('⚠️ Memoria llena. Contacta al administrador.');
        }
      }
    }

    // Agregar a la lista de subidas (para historial)
    if (uploadResult.success) {
      setPendingSamples(prev => [...prev, { ...currentSample, uploaded: true }]);
      setTotalSamples(prev => prev + 1);
    }

    // Resetear y continuar
    setCurrentSample(null);
    setWaitingForDecision(false);
    waitingForDecisionRef.current = false; // ⭐ Reanudar procesamiento de MediaPipe
    setStatus('✋ Listo para capturar');

    return uploadResult;
  }, [currentSample, useDrive]);

  /**
   * El usuario RECHAZA la muestra - la elimina
   */
  const rejectCurrentSample = useCallback(() => {
    if (!currentSample) return;

    console.log(`🗑️ Usuario rechazó muestra: ${currentSample.id}`);

    // Simplemente descartamos la muestra
    setCurrentSample(null);
    setWaitingForDecision(false);
    waitingForDecisionRef.current = false; // ⭐ Reanudar procesamiento de MediaPipe
    setStatus('✋ Listo para capturar');
  }, [currentSample]);

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

    // ⭐ Si está esperando decisión, mostrar overlay de pausa
    if (waitingForDecision) {
      // Oscurecer la imagen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Mensaje grande en el centro
      ctx.fillStyle = '#FFA500';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⏸️ PAUSADO', canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Esperando tu decisión...', canvas.width / 2, canvas.height / 2 + 20);
      
      // Resetear alineación
      ctx.textAlign = 'left';
      return;
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
    frameDelay,
    waitingForDecision
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
          // ⭐ NO PROCESAR si está esperando decisión del usuario
          if (!waitingForDecisionRef.current && holisticRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
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
    waitingForDecisionRef.current = false; // ⭐ Resetear ref
    setCurrentSample(null);
    setWaitingForDecision(false);
  }, [resetCaptureState]);

  /**
   * Limpia la lista de muestras
   */
  const clearSamples = useCallback(() => {
    setTotalSamples(0);
    setPendingSamples([]);
  }, []);

  /**
   * Elimina una muestra específica de la lista temporal
   */
  const deleteSample = useCallback((sampleId) => {
    setPendingSamples(prev => prev.filter(s => s.id !== sampleId));
    setTotalSamples(prev => prev - 1);
    console.log(`🗑️ Muestra eliminada: ${sampleId}`);
  }, []);

  /**
   * Sube una muestra específica a Drive/Backend
   */
  const uploadSample = useCallback(async (sampleId) => {
    const sample = pendingSamples.find(s => s.id === sampleId);
    if (!sample) {
      console.error('❌ Muestra no encontrada:', sampleId);
      return { success: false, error: 'Muestra no encontrada' };
    }

    console.log(`📤 Subiendo muestra ${sampleId}...`);

    // Opción 1: Google Drive (recomendado) ⭐
    if (useDrive) {
      try {
        const result = await uploadToDrive(sample);
        console.log(`✅ Subido a Drive: ${result.filename}`);
        
        // Marcar como subido
        setPendingSamples(prev => prev.map(s => 
          s.id === sampleId ? { ...s, uploaded: true } : s
        ));
        
        return { success: true, method: 'drive', result };
      } catch (error) {
        console.error('❌ Error subiendo a Drive:', error);
        console.log('⚠️ Intentando guardar en backend local...');
      }
    }

    // Opción 2: Backend local (fallback)
    try {
      const result = await saveToBackend(sample);
      console.log(`✅ Guardado en backend local: ${result.filename}`);
      
      setPendingSamples(prev => prev.map(s => 
        s.id === sampleId ? { ...s, uploaded: true } : s
      ));
      
      return { success: true, method: 'backend', result };
    } catch (error) {
      console.error('❌ Error en backend local:', error);
      console.log('⚠️ Intentando guardar en localStorage...');
    }

    // Opción 3: localStorage (último recurso)
    const storageKey = `gesture_${sample.gesture}_${sample.timestamp}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(sample));
      console.log(`✅ Muestra guardada localmente: ${storageKey}`);

      setPendingSamples(prev => prev.map(s => 
        s.id === sampleId ? { ...s, uploaded: true } : s
      ));

      return { success: true, method: 'localStorage', result: { key: storageKey } };
    } catch (err) {
      console.error('❌ Error guardando muestra:', err);
      if (err.name === 'QuotaExceededError') {
        return { success: false, error: 'Memoria llena. Contacta al administrador.' };
      }
      return { success: false, error: err.message };
    }
  }, [pendingSamples, useDrive]);

  /**
   * Sube todas las muestras pendientes
   */
  const uploadAllSamples = useCallback(async () => {
    const unuploadedSamples = pendingSamples.filter(s => !s.uploaded);
    console.log(`📤 Subiendo ${unuploadedSamples.length} muestras...`);

    const results = [];
    for (const sample of unuploadedSamples) {
      const result = await uploadSample(sample.id);
      results.push({ sampleId: sample.id, ...result });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Subidas exitosas: ${successful}, ❌ Fallos: ${failed}`);
    return { successful, failed, results };
  }, [pendingSamples, uploadSample]);

  /**
   * Elimina todas las muestras subidas de la lista
   */
  const clearUploadedSamples = useCallback(() => {
    setPendingSamples(prev => prev.filter(s => !s.uploaded));
    const uploadedCount = pendingSamples.filter(s => s.uploaded).length;
    setTotalSamples(prev => prev - uploadedCount);
    console.log(`🧹 ${uploadedCount} muestras subidas eliminadas de la lista`);
  }, [pendingSamples]);

  return {
    videoRef,
    canvasRef,
    isHolisticReady,
    isWebcamReady,
    isCapturing,
    capturedFrames,
    totalSamples,
    pendingSamples,
    currentSample, // ⭐ Muestra actual esperando decisión
    waitingForDecision, // ⭐ Flag de pausa
    status,
    error,
    initializeHolistic,
    startCamera,
    cleanup,
    clearSamples,
    confirmCurrentSample, // ⭐ Confirmar y subir
    rejectCurrentSample, // ⭐ Rechazar y eliminar
    // Funciones legacy para compatibilidad con SamplesList
    deleteSample,
    uploadSample,
    uploadAllSamples,
    clearUploadedSamples,
  };
}
