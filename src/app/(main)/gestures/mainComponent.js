'use client';
import { useState } from 'react';
import { useGestureRecognitionLSTM } from '@/hooks/useGestureRecognitionLSTM';
import { sentenceToText } from '@/lib/recognition';
import { groupByCategory, vocabularySize } from '@/lib/vocabulary';
import { CameraIcon, DeleteIcon } from '@/utils/icons';

export default function GesturesMainComponent() {
  const [showInfoPopUp, setShowInfoPopUp] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    videoRef,
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
  } = useGestureRecognitionLSTM({ maxSentenceLength: 12 });

  const copySentence = async () => {
    try {
      await navigator.clipboard.writeText(sentenceToText(sentence));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className='pb-4 lg:pb-8 relative'>
      <h1 className="text-amethyst text-2xl md:text-4xl text-center w-full font-semibold py-3 md:py-4">
        {"> Reconocimiento de señas <"}
      </h1>

      <div className="px-12 md:px-20 flex flex-col lg:flex-row space-x-10 justify-between pb-8">

        {/* CÁMARA Y VIDEO */}
        <section className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark dark:bg-main-light/5 rounded-3xl md:rounded-4xl shadow-md/50 dark:shadow-sm dark:shadow-main-light">

          {/* Loading State */}
          {(isModelLoading || !isWebcamReady) && !error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-platinum flex flex-col items-center">
              <CameraIcon className="text-platinum w-40 h-40" />
              <span className="text-3xl text-center font-semibold mt-4">
                {isModelLoading ? 'Cargando modelo...' : 'Iniciando cámara...'}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div role="alert" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5/6 text-red-500 flex flex-col items-center z-20">
              <span className="text-2xl text-center font-semibold">⚠️ {error}</span>
            </div>
          )}

          {/* Video */}
          <video
            ref={videoRef}
            className={`${!isWebcamReady ? 'hidden' : 'block'} scale-x-[-1] absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-3xl md:rounded-4xl`}
            autoPlay
            playsInline
            muted
            aria-label="Vista de tu cámara"
          />

          {/* OVERLAY FOR STATUS */}
          {isWebcamReady && !error && (
            <div className="absolute top-0 left-0 h-10 m-4 z-2">
              <div className="w-full h-full bg-main-light/70 dark:bg-main-dark/35 backdrop-blur-sm rounded-2xl md:rounded-3xl flex px-6 py-0 items-center justify-center">
                <span role="status" aria-live="polite" className="text-green-400 text-lg font-medium">
                  {status}
                </span>
              </div>
            </div>
          )}

        </section>


        {/* RIGTH PANEL, PREDICTIONS AND INFORMATION */}
        <section className="flex flex-col w-full pt-4 lg:max-w-80 2xl:max-w-96 justify-center items-center self-center">

          {/* CURRENT PREDICTION */}
          <div className="rounded-3xl w-full" aria-live="polite">

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

            {rejection && (
              <p role="status" className="mt-3 text-center text-sm bg-yellow-200/20 text-yellow-600 dark:text-yellow-400 px-3 py-2 rounded-lg">
                {rejection.message}
              </p>
            )}
          </div>

          {/* Frase acumulada */}
          <div className="mt-8 py-2 px-4 w-full border-2 border-platinum border-dashed rounded-lg dotted bg-platinum/25 dark:bg-platinum/10">
            <div className="flex justify-between items-center gap-2">
              <h3 className="text-amethyst text-xl font-bold">
                Frase
              </h3>
              {sentence.length > 0 && (
                <button
                  type="button"
                  onClick={clearSentence}
                  aria-label="Borrar la frase"
                  title="Borrar la frase"
                  className="text-main-dark/40 dark:text-main-light/50 cursor-pointer"
                >
                  <DeleteIcon className="w-8 h-8" />
                </button>
              )}
            </div>

            <p aria-live="polite" className="min-h-24 max-h-40 overflow-y-auto py-2 text-lg font-medium">
              {sentence.length > 0
                ? sentenceToText(sentence)
                : <span className="text-gray-400">Las palabras aparecerán aquí, en orden de lectura</span>}
            </p>

            <div className="flex flex-wrap gap-2 pb-2">
              {speechSupported && (
                <button
                  type="button"
                  onClick={speakSentence}
                  disabled={sentence.length === 0}
                  className="px-3 py-1 rounded-lg text-sm text-main-light bg-amethyst dark:bg-grape disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Leer en voz alta
                </button>
              )}
              <button
                type="button"
                onClick={copySentence}
                disabled={sentence.length === 0}
                className="px-3 py-1 rounded-lg text-sm border border-amethyst dark:border-grape disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={isMuted}
                  className="px-3 py-1 rounded-lg text-sm border border-platinum cursor-pointer"
                >
                  {isMuted ? 'Activar voz automática' : 'Silenciar voz automática'}
                </button>
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

      {modelConfig && (
        <div className='w-full flex items-center justify-center'>
          <span className='text-center text-balance'>
            <span className='font-semibold bg-main'>⚠️ Nota:</span> Actualmente soportamos {vocabularySize(modelConfig)} señas de la LSC. Para verlas haz click <button type="button" onClick={() => setShowInfoPopUp(true)} className='text-grape dark:text-wisteria font-semibold underline cursor-pointer'>aquí</button>
          </span>
        </div>
      )}

      {showInfoPopUp && modelConfig &&
        <InformationPopUp groups={groupByCategory(modelConfig)} setShow={setShowInfoPopUp} />
      }
    </div>
  );
}

const TITLE_ID = 'signs-dialog-title';

/** Quita tildes y pasa a minusculas para que "cómo" encuentre "como". */
const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function InformationPopUp({ groups, setShow }) {
  const [query, setQuery] = useState('');
  const q = normalize(query.trim());

  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => normalize(item.label).includes(q)) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div className="absolute inset-0 bg-main-light/25 dark:bg-main-dark/30 backdrop-blur-lg z-10" onClick={() => setShow(false)} />
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className="relative pointer-events-auto flex flex-col max-h-[85vh] p-8 mx-4 w-full max-w-3xl rounded-4xl bg-main-light dark:bg-main-dark border border-amethyst dark:border-grape"
        >
          <button type="button" aria-label="Cerrar" onClick={() => setShow(false)} className="absolute top-0 right-0 h-6 w-6 mt-7 mr-7 flex items-center justify-center cursor-pointer">
            <span className="absolute w-6 h-0.5 rounded-full rotate-45 bg-main-dark/35" />
            <span className="absolute w-6 h-0.5 rounded-full -rotate-45 bg-main-dark/35" />
          </button>

          <h1 id={TITLE_ID} className="text-center text-2xl">Señas soportadas</h1>
          <p className="text-xs text-center xs:text-sm lg:text-base mt-3 mb-3">
            Si una seña no se detecta, repítela con calma, con buena luz y con las manos dentro de la imagen.
          </p>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar una seña…"
            aria-label="Buscar una seña"
            className="w-full px-4 py-2 mb-4 rounded-lg border border-platinum dark:border-platinum/30 bg-transparent"
          />

          <div className="overflow-y-auto pr-1">
            {visible.length === 0 && <p className="text-center text-gray-400 py-6">No hay señas que coincidan.</p>}
            {visible.map((group) => (
              <section key={group.key} className="mb-4">
                <h2 className="text-amethyst dark:text-grape font-semibold mb-2">{group.label}</h2>
                <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                  {group.items.map((item) => (
                    <li key={item.id} className="text-sm lg:text-base">{item.label}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <button type="button" onClick={() => setShow(false)} className="w-full px-4 py-2 text-main-light bg-amethyst dark:bg-grape rounded-lg mt-4 cursor-pointer">¡Entendido!</button>
        </div>
      </div>
    </>
  );
}