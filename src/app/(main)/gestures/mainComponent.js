'use client';
import { useState, useEffect } from 'react';
import { useGestureRecognitionLSTM } from '@/hooks/useGestureRecognitionLSTM';
import { CameraIcon, DeleteIcon } from '@/utils/icons';

export default function GesturesMainComponent() {
  const [availableGestures, setAvailableGestures] = useState([]);
  const [isLoadingGestures, setIsLoadingGestures] = useState(true);
  const [showInfoPopUp, setShowInfoPopUp] = useState(false);

  const {
    videoRef,
    isModelLoading,
    isWebcamReady,
    currentPrediction,
    sentence,
    status,
    error,
    clearSentence,
  } = useGestureRecognitionLSTM({
    threshold: 0,
    marginFrame: 1,
    delayFrames: 3,
    maxSentenceLength: 10,
    onPrediction: (prediction) => {
      console.log('Nueva predicción:', prediction);
    }
  });

  // Cargar gestos dinámicamente desde el modelo
  useEffect(() => {
    async function loadGestures() {
      try {
        const response = await fetch('/models/words.json');
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
    <div className='pb-8 relative'>
      <h1 className="text-amethyst text-2xl md:text-4xl text-center w-full font-semibold py-3 md:py-4">
        {"> Reconocimiento de señas <"}
      </h1>

      <div className="px-12 md:px-20 flex flex-col lg:flex-row space-x-10 justify-between pb-8">

        {/* CÁMARA Y VIDEO */}
        <section className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark dark:bg-main-light/5 rounded-3xl md:rounded-4xl shadow-md/50 dark:shadow-sm dark:shadow-main-light">

          {/* Loading State */}
          {(isModelLoading || !isWebcamReady) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-platinum flex flex-col items-center">
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
            className={`${!isWebcamReady ? 'hidden' : 'block'} absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-3xl md:rounded-4xl`}
            autoPlay
            playsInline
          />

          {/* OVERLAY FOR STATUS */}
          {isWebcamReady && (
            <div className="absolute top-0 left-0 h-10 m-4 z-2">
              <div className="w-full h-full bg-main-light/70 dark:bg-main-dark/35 backdrop-blur-sm rounded-2xl md:rounded-3xl flex px-6 py-0 items-center justify-center">
                <span className="text-green-400 text-lg font-medium">
                  {status}
                </span>
              </div>
            </div>
          )}

        </section>


        {/* RIGTH PANEL, PREDICTIONS AND INFORMATION */}
        <section className="flex flex-col w-full pt-4 lg:max-w-80 2xl:max-w-96 justify-center items-center self-center">

          {/* CURRENT PREDICTION */}
          <div className="rounded-3xl w-full">

            {currentPrediction ? (
              <>
                <div className="text-center flex items-center justify-between">

                  <span className="text-3xl font-semibold text-amethyst flex w-56 h-24 items-center justify-center">
                    {currentPrediction?.text}
                  </span>

                  <span className="text-wisteria text-3xl w-20 font-semibold">
                    {(currentPrediction?.confidence * 100).toFixed(0) || 0}%
                  </span>

                  {/* Barra de progreso de confianza */}
                  <div className="w-4 bg-platinum rounded-full h-20 overflow-hidden flex flex-col justify-end">
                    <div
                      className={`transition-all duration-300 ${currentPrediction?.confidence > 0.8 ? 'bg-green-500' :
                        currentPrediction?.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ height: `${(currentPrediction?.confidence * 100)}%` }}
                    />
                  </div>

                </div>

                {/* Indicador de confianza por color */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {currentPrediction?.confidence > 0.8 && (
                    <span className="bg-green-200 bg-opacity-20 text-green-500 px-3 py-1 rounded-full">
                      ✓ Alta confianza
                    </span>
                  )}
                  {currentPrediction?.confidence > 0.5 && currentPrediction?.confidence <= 0.8 && (
                    <span className="bg-yellow-200 bg-opacity-20 text-yellow-500 px-3 py-1 rounded-full">
                      ⚠ Media confianza
                    </span>
                  )}
                  {currentPrediction?.confidence <= 0.5 && (
                    <span className="bg-red-200 bg-opacity-20 text-red-500 px-3 py-1 rounded-full">
                      ✗ Baja confianza
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="h-24 flex items-center text-lg px-12 bg-platinum/35 dark:bg-platinum/15 rounded-lg">
                <span className='text-center'>Realiza un gesto para ver la predicción</span>
              </div>
            )}
          </div>

          {/* Frase acumulada */}
          <div className="mt-8 h-50 py-2 px-4 w-full border-2 border-platinum border-dashed rounded-lg dotted bg-platinum/25 dark:bg-platinum/10">
            <div className="flex justify-between items-center">
              <h3 className="text-amethyst text-xl font-bold">
                Historial
              </h3>
              {sentence.length > 0 && (
                <button
                  onClick={clearSentence}
                  className="text-main-dark/25 dark:text-main-light/35"
                >
                  <DeleteIcon className="w-8 h-8" />
                </button>
              )}
            </div>
            <div className="space-y-0 mb-2 overflow-y-auto h-34">
              {sentence.length > 0 ? (
                sentence.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-opacity-20 px-6 py-1 rounded-lg text-lg font-medium"
                  >
                    {word}
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
          {/* <div className="bg-main-dark rounded-3xl p-6 w-full">
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
            
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
              <p className="text-blue-200 text-xs">
                💡 <strong>Tip:</strong> Asegúrate de tener buena iluminación para mejor reconocimiento
              </p>
            </div>
          </div> */}

          {/* Gestos disponibles */}
          {/* <div className="bg-main-dark rounded-3xl p-6 w-full">
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
          </div> */}

        </section>
      </div>

      <div className='w-full flex items-center justify-center'>
        <span className='text-center text-balance'>
          <span className='font-semibold bg-main'>⚠️ Nota:</span> Actualmente soportamos un total de 18 señas oficiales de la LSC. Para ver las señas disponibles haz click <span onClick={() => setShowInfoPopUp(true)} className='text-grape dark:text-wisteria font-semibold underline cursor-pointer'>aquí</span>
        </span>
      </div>

      {showInfoPopUp &&
        <InformationPopUp information={supportedSignsInfo} setShow={setShowInfoPopUp} />
      }
    </div>
  );
}

function InformationPopUp({ information, setShow }) {

  const {
    title,
    description,
    description2,
    listOfItems
  } = information;

  return (
    <>
      <div className="absolute inset-0 bg-main-light/25 dark:bg-main-dark/30 backdrop-blur-lg z-10" />
      <div className="fixed inset-0 flex items-center justify-center z-20">

        <div className="relative p-8 mx-8 w-100 lg:w-150 rounded-4xl bg-main-light dark:bg-main-dark border border-amethyst dark:border-grape z-15">
          <button type="button" onClick={() => setShow(false)} className="absolute top-0 right-0 h-6 w-6 mt-7 mr-7 flex items-center justify-center cursor-pointer">
            <span className="absolute w-6 h-0.5 rounded-full rotate-45 bg-main-dark/35" />
            <span className="absolute w-6 h-0.5 rounded-full -rotate-45 bg-main-dark/35" />
          </button>

          <h1 className="text-center text-2xl">{title}</h1>
          <p className="text-xs text-center xs:text-sm lg:text-lg mt-4 mb-2">{description}</p>
          <p className="text-xs text-center xs:text-sm lg:text-lg mt-4 mb-2">{description2}</p>

          <div className='grid grid-cols-2 lg:grid-cols-3 pt-4'>
            {listOfItems.map((item, index) => (
              <div key={index} className='flex justify-end items-center not-first:py-2 space-x-2'>
                <span className='text-xs lg:text-base'>{item.itemTitle}</span>
                <span>{item.itemIcon}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setShow(false)} className="w-full px-4 py-2 text-main-light bg-amethyst dark:bg-grape rounded-lg mt-8 cursor-pointer">¡Entendido!</button>
        </div>
      </div>
    </>
  )
}

const supportedSignsInfo = {
  title: "Señas soportadas",
  description: "✅  La seña es detectada de forma consistente",
  description2: "⚠️  La seña es detectada de forma inconsistente",
  listOfItems: [
    { itemTitle: "Buenos días", itemIcon: "✅" },
    { itemTitle: "Buenas tardes", itemIcon: "✅" },
    { itemTitle: "Buenas noches", itemIcon: "✅" },
    { itemTitle: "Cómo estás", itemIcon: "✅" },
    { itemTitle: "Por favor", itemIcon: "✅" },
    { itemTitle: "Gracias", itemIcon: "⚠️" },
    { itemTitle: "Perdón", itemIcon: "✅" },
    { itemTitle: "Con gusto", itemIcon: "✅" },
    { itemTitle: "Hola", itemIcon: "⚠️" },
    { itemTitle: "Adiós", itemIcon: "✅" },
    { itemTitle: "Bien", itemIcon: "⚠️" },
    { itemTitle: "Mal", itemIcon: "⚠️" },
    { itemTitle: "Más o menos", itemIcon: "✅" },
    { itemTitle: "Sordo", itemIcon: "⚠️" },
    { itemTitle: "Bienvenido", itemIcon: "⚠️" },
    { itemTitle: "Permiso", itemIcon: "✅" },
    { itemTitle: "Lo siento", itemIcon: "✅" },
    { itemTitle: "Feliz cumpleaños", itemIcon: "✅" }
  ]
}