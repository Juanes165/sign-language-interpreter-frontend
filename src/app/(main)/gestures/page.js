'use client';
import { useState, useEffect } from 'react';
import { useGestureRecognitionLSTM } from '@/hooks/useGestureRecognitionLSTM';
import { CameraIcon } from '@/utils/icons';

export default function GesturesPage() {
  const [availableGestures, setAvailableGestures] = useState([]);
  const [isLoadingGestures, setIsLoadingGestures] = useState(true);
  
  const {
    videoRef,
    canvasRef,
    isModelLoading,
    isWebcamReady,
    currentPrediction,
    sentence,
    status,
    error,
    clearSentence,
  } = useGestureRecognitionLSTM({
    threshold: 0.7,
    marginFrame: 1,
    delayFrames: 3,
    maxSentenceLength: 6,
    enableSpeech: false, // Cambiar a true para habilitar TTS
    onPrediction: (prediction) => {
      console.log('Nueva predicción:', prediction);
    }
  });

  // Cargar gestos dinámicamente desde el modelo
  useEffect(() => {
    async function loadGestures() {
      try {
        const response = await fetch('/models/lstm_gestos/words.json');
        const data = await response.json();
        setAvailableGestures(data.word_ids || ['hola', 'bien', 'adios', 'como-estas']);
        
        console.log('✅ Gestos cargados:', data.word_ids);
      } catch (error) {
        console.error('Error cargando gestos:', error);
        // Fallback a gestos por defecto
        setAvailableGestures(['hola', 'bien', 'adios', 'como-estas']);
      } finally {
        setIsLoadingGestures(false);
      }
    }
    
    loadGestures();
  }, []);

  return (
    <>
      <div className="text-amethyst text-4xl md:text-5xl text-center w-full font-semibold mt-8 mb-2">
        RECONOCIMIENTO DE GESTOS DINÁMICOS
      </div>
      
      <div className="px-8 md:px-20 py-8 flex flex-col lg:flex-row space-x-10 justify-between">
        {/* CÁMARA Y VIDEO */}
        <section className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark rounded-4xl overflow-hidden">
          
          {/* Loading State */}
          {(isModelLoading || !isWebcamReady) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-platinum flex flex-col items-center z-20">
              <CameraIcon className="text-platinum w-40 h-40" />
              <span className="text-3xl text-center font-semibold mt-4">
                {isModelLoading ? 'Cargando modelo LSTM...' : 'Iniciando cámara...'}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 flex flex-col items-center z-20">
              <span className="text-2xl text-center font-semibold">⚠️ {error}</span>
            </div>
          )}

          {/* Video */}
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Canvas para landmarks (opcional) */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-10"
            width={640}
            height={480}
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Overlay superior - Frase acumulada */}
          <div className="absolute top-0 left-0 right-0 bg-red-600 bg-opacity-90 px-4 py-2 z-20">
            <p className="text-white text-xl font-semibold text-center truncate">
              {sentence.length > 0 ? sentence.join(' | ') : 'Esperando gestos...'}
            </p>
          </div>

          {/* Overlay inferior - Estado y última predicción */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 px-4 py-3 z-20">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-lg font-medium">
                {status}
              </span>
              {currentPrediction && (
                <span className="text-white text-lg font-semibold">
                  {currentPrediction.spokenText} ({(currentPrediction.confidence * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        </section>

        {/* PANEL DERECHO - Información */}
        <section className="flex flex-col w-full pt-6 max-w-md justify-start items-center self-center space-y-6">
          
          {/* Predicción actual */}
          <div className="bg-main-dark rounded-3xl p-6 w-full">
            <h3 className="text-amethyst text-2xl font-bold mb-4 text-center">
              Última Predicción
            </h3>
            {currentPrediction ? (
              <div className="text-center space-y-4">
                <p className="text-platinum text-5xl font-bold">
                  {currentPrediction.spokenText}
                </p>
                <p className="text-wisteria text-3xl">
                  {(currentPrediction.confidence * 100).toFixed(0)}%
                </p>
                
                {/* Barra de progreso de confianza */}
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      currentPrediction.confidence > 0.8 ? 'bg-green-500' :
                      currentPrediction.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(currentPrediction.confidence * 100)}%` }}
                  />
                </div>
                
                {/* Indicador de confianza por color */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {currentPrediction.confidence > 0.8 && (
                    <span className="bg-green-500 bg-opacity-20 text-green-400 px-3 py-1 rounded-full">
                      ✓ Alta confianza
                    </span>
                  )}
                  {currentPrediction.confidence > 0.6 && currentPrediction.confidence <= 0.8 && (
                    <span className="bg-yellow-500 bg-opacity-20 text-yellow-400 px-3 py-1 rounded-full">
                      ⚠ Media confianza
                    </span>
                  )}
                  {currentPrediction.confidence <= 0.6 && (
                    <span className="bg-red-500 bg-opacity-20 text-red-400 px-3 py-1 rounded-full">
                      ✗ Baja confianza
                    </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-xs">
                  ID: {currentPrediction.label}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-center text-lg">
                Realiza un gesto para ver la predicción
              </p>
            )}
          </div>

          {/* Frase acumulada */}
          <div className="bg-main-dark rounded-3xl p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-amethyst text-2xl font-bold">
                Frase Capturada
              </h3>
              {sentence.length > 0 && (
                <button
                  onClick={clearSentence}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="space-y-2">
              {sentence.length > 0 ? (
                sentence.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-wisteria bg-opacity-20 text-platinum px-4 py-2 rounded-lg text-lg font-medium"
                  >
                    {idx + 1}. {word}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">
                  Las palabras aparecerán aquí
                </p>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-main-dark rounded-3xl p-6 w-full">
            <h3 className="text-amethyst text-xl font-bold mb-3">
              📋 Instrucciones
            </h3>
            <ul className="text-platinum text-sm space-y-2 list-disc list-inside">
              <li>Colócate frente a la cámara con buena iluminación</li>
              <li>Realiza el gesto de señas de forma clara</li>
              <li>Mantén el gesto hasta ver &quot;Capturando...&quot;</li>
              <li>Baja las manos para procesar el gesto</li>
              <li>La palabra aparecerá en la frase acumulada</li>
              <li>Usa &quot;Limpiar&quot; para resetear la frase</li>
            </ul>
            
            {/* Indicador de calidad de iluminación */}
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
              <p className="text-blue-200 text-xs">
                💡 <strong>Tip:</strong> Asegúrate de tener buena iluminación para mejor reconocimiento
              </p>
            </div>
          </div>

          {/* Gestos disponibles */}
          <div className="bg-main-dark rounded-3xl p-6 w-full">
            <h3 className="text-amethyst text-xl font-bold mb-3">
              ✋ Gestos Disponibles
            </h3>
            {isLoadingGestures ? (
              <p className="text-gray-400 text-center">Cargando gestos...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-platinum text-sm">
                {availableGestures.length > 0 ? (
                  availableGestures.slice(0, 12).map((gesture, idx) => (
                    <div key={`${gesture}-${idx}`} className="bg-wisteria bg-opacity-20 px-3 py-2 rounded-lg">
                      {gesture.charAt(0).toUpperCase() + gesture.slice(1).replace(/-/g, ' ')}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No hay gestos disponibles</p>
                )}
                {availableGestures.length > 12 && (
                  <div className="bg-wisteria bg-opacity-10 px-3 py-2 rounded-lg text-center border-2 border-dashed border-wisteria">
                    +{availableGestures.length - 12} más
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
