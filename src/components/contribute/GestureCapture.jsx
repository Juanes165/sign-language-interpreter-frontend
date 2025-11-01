'use client';

import { useEffect, useRef, useState } from 'react';
import { useContributeCapture } from '@/hooks/useContributeCapture';
import SamplesList from './SamplesList';
import SampleConfirmModal from './SampleConfirmModal';

export default function GestureCapture({ gesture, onBack }) {
  const [isClient, setIsClient] = useState(false);
  const initialized = useRef(false);
  
  const {
    videoRef,
    canvasRef,
    isHolisticReady,
    isWebcamReady,
    isCapturing,
    capturedFrames,
    totalSamples,
    pendingSamples,
    currentSample,
    waitingForDecision,
    status,
    error,
    initializeHolistic,
    startCamera,
    cleanup,
    confirmCurrentSample,
    rejectCurrentSample,
    deleteSample,
    uploadSample,
    uploadAllSamples,
    clearUploadedSamples,
  } = useContributeCapture({
    preCaptureFrames: 1,
    minRequiredFrames: 5,
    frameDelay: 3,
    onCapture: (sample) => {
      console.log('📦 Muestra capturada:', sample);
    },
  });

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Inicializar cuando el componente esté montado (SOLO UNA VEZ)
  useEffect(() => {
    if (!isClient || !gesture || initialized.current) {
      return;
    }

    console.log('🎬 Iniciando captura para gesto:', gesture.label);
    initialized.current = true;

    const init = async () => {
      try {
        await initializeHolistic(gesture);
        await startCamera();
      } catch (err) {
        console.error('Error en inicialización:', err);
        initialized.current = false;
      }
    };
    
    init();

    return () => {
      console.log('🛑 Limpiando componente');
      cleanup();
      initialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, gesture?.id]); // Solo depende de isClient y gesture.id

  // ⌨️ Soporte de teclado para el modal (Enter = Subir, Delete = Eliminar)
  useEffect(() => {
    if (!waitingForDecision || !currentSample) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmCurrentSample();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        rejectCurrentSample();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [waitingForDecision, currentSample, confirmCurrentSample, rejectCurrentSample]);

  // No renderizar hasta que esté en el cliente
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          ← Volver
        </button>
        
        <h1 className="text-3xl font-bold mb-2">
          Capturando: {gesture?.label || 'Gesto'}
        </h1>
        
        <p className="text-gray-400">
          Realiza el gesto cuando estés listo. La captura comenzará automáticamente al detectar tus manos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Estado</div>
          <div className="text-lg font-semibold">{status}</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Frames Capturados</div>
          <div className="text-lg font-semibold">
            {isCapturing ? (
              <span className="text-red-500 animate-pulse">{capturedFrames}</span>
            ) : (
              capturedFrames
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Muestras Guardadas</div>
          <div className="text-lg font-semibold text-green-500">{totalSamples}</div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-6 rounded-3xl md:rounded-4xl">
        {/* Video oculto (solo para MediaPipe) */}
        <video
          ref={videoRef}
          className={`${!isWebcamReady ? 'hidden' : 'block'} scale-x-[-1] absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-3xl md:rounded-4xl`}
          autoPlay
          playsInline
          muted
        />
        
        {/* Canvas visible (con landmarks dibujados) */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-contain"
        />
        
        {/* Overlay de estado */}
        {(!isHolisticReady || !isWebcamReady) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">{status}</p>
            </div>
          </div>
        )}
        
        {isCapturing && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-semibold animate-pulse">
            ● GRABANDO
          </div>
        )}
      </div>

      {/* Error Help Section */}
      {error && (
        <div className="mb-6 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-red-400 mb-4">⚠️ Problema Detectado</h3>
          
          <p className="text-red-200 mb-4 text-lg font-semibold">{error}</p>
          
          <div className="space-y-3 text-red-100">
            <p className="font-semibold">Soluciones comunes:</p>
            
            <div className="bg-red-950 bg-opacity-50 p-4 rounded">
              <p className="font-semibold mb-2">🔴 Si dice "Cámara en uso":</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Cierra otras aplicaciones que usen la cámara (Zoom, Teams, Skype, etc.)</li>
                <li>Cierra otras pestañas del navegador que usen la cámara</li>
                <li>Reinicia el navegador si el problema persiste</li>
              </ul>
            </div>
            
            <div className="bg-red-950 bg-opacity-50 p-4 rounded">
              <p className="font-semibold mb-2">🔒 Si dice "Permiso denegado":</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Haz click en el ícono de candado/cámara en la barra de direcciones</li>
                <li>Selecciona "Permitir" para el acceso a la cámara</li>
                <li>Recarga la página después de permitir el acceso</li>
              </ul>
            </div>
            
            <div className="bg-red-950 bg-opacity-50 p-4 rounded">
              <p className="font-semibold mb-2">📷 Si dice "No se encontró cámara":</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Verifica que tu cámara esté conectada correctamente</li>
                <li>Verifica que los drivers de la cámara estén instalados</li>
                <li>Prueba con otro navegador si el problema persiste</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={async () => {
              if (initialized.current) {
                console.log('⏸️ Deteniendo sesión anterior...');
                cleanup();
                initialized.current = false;
                
                // Esperar a que se libere la cámara
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              console.log('🔄 Reintentando...');
              try {
                await initializeHolistic(gesture);
                await startCamera();
                initialized.current = true;
              } catch (err) {
                console.error('Error al reintentar:', err);
              }
            }}
            className="mt-4 w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📝 Instrucciones</h3>
        
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <p>
              <strong>Posiciónate:</strong> Colócate frente a la cámara, asegúrate de que tus manos sean visibles.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <p>
              <strong>Espera:</strong> La captura comenzará automáticamente cuando detecte tus manos.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <p>
              <strong>Realiza el gesto:</strong> Ejecuta la seña <strong>&quot;{gesture?.label}&quot;</strong> de forma natural.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">4️⃣</span>
            <p>
              <strong>Finaliza:</strong> Retira tus manos del cuadro para detener la grabación.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">5️⃣</span>
            <p>
              <strong>Repite:</strong> Puedes capturar múltiples muestras del mismo gesto para mejorar el entrenamiento.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>💡 Consejo:</strong> Captura al menos 3-5 muestras del mismo gesto desde diferentes ángulos
            y con distintas velocidades para que el modelo aprenda mejor.
          </p>
        </div>
      </div>

      {/* Historial de muestras subidas */}
      <div className="mt-8">
        <SamplesList
          samples={pendingSamples}
          onClearUploaded={clearUploadedSamples}
        />
      </div>

      {/* Modal de Confirmación - Aparece después de cada captura */}
      <SampleConfirmModal
        sample={currentSample}
        onUpload={confirmCurrentSample}
        onDelete={rejectCurrentSample}
        isOpen={waitingForDecision && currentSample !== null}
      />
    </div>
  );
}
