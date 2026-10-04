'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { displayText, groupByCategory, vocabularySize } from '@/lib/vocabulary';

// Importación dinámica para evitar SSR con MediaPipe
const GestureCapture = dynamic(
  () => import('@/components/contribute/GestureCapture'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amethyst dark:border-grape mx-auto mb-4"></div>
          <p className="text-amethyst dark:text-grape text-lg">Cargando capturador de gestos...</p>
        </div>
      </div>
    )
  }
);

// La lista de señas sale de public/models/model_config.json (vocabulario único del modelo).
// Aquí solo se guardan los emojis decorativos; una seña nueva sin emoji usa el genérico.
const EMOJIS = {
  'mal': '👎', 'hola': '👋', 'lo-siento': '😔', 'sordo': '👂', 'mas-o-menos': '🤷', 'bien': '👍',
  'buenas-tardes': '🌤️', 'adios': '👋', 'feliz-cumpleanos': '🎂', 'gracias': '🙏', 'buenas-noches': '🌙',
  'como-estas': '🤔', 'permiso': '🚶', 'buenos-dias': '☀️', 'bienvenido': '🤗', 'perdon': '🙇',
  'por-favor': '🥺', 'con-gusto': '😊',
};
const DEFAULT_EMOJI = '🤟';

// Clase de rechazo: grabar movimientos reales que NO son señas enseña al modelo a no inventar palabras.
const NEGATIVE_GESTURE = {
  id: 'sin-sena',
  label: 'No es una seña',
  description: 'Mueve las manos como lo harías normalmente, sin hacer ninguna seña',
  emoji: '🙌',
};

function toGesture(config, item, categoryLabel) {
  return {
    id: item.id,
    label: displayText(config, item.id),
    description: categoryLabel,
    emoji: EMOJIS[item.id] ?? DEFAULT_EMOJI,
  };
}

function GestureButton({ gesture, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(gesture)}
      className="p-4 border-2 border-platinum dark:border-platinum/20 rounded-lg hover:border-amethyst dark:hover:border-grape hover:bg-wisteria/20 dark:hover:bg-amethyst/20 transition-all duration-200 text-left group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">{gesture.emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-amethyst dark:text-grape group-hover:text-wisteria dark:group-hover:text-amethyst">
              {gesture.label}
            </h3>
            <p className="text-sm text-main-dark dark:text-platinum/70">
              {gesture.description}
            </p>
          </div>
        </div>
        <svg
          className="w-6 h-6 text-platinum dark:text-platinum/50 group-hover:text-amethyst dark:group-hover:text-grape"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export default function ContributePage() {
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(false);
  const [userStats, setUserStats] = useState({
    totalContributions: 0,
    totalGestures: 0
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/models/model_config.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => { if (!cancelled) setConfig(data); })
      .catch(() => { if (!cancelled) setConfigError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setIsMounted(true);

    // Calcular estadísticas del usuario desde localStorage
    const contributions = Object.keys(localStorage)
      .filter(k => k.startsWith('gesture_'))
      .map(k => JSON.parse(localStorage.getItem(k)));

    const uniqueGestures = new Set(contributions.map(c => c.gesture));

    setUserStats({
      totalContributions: contributions.length,
      totalGestures: uniqueGestures.size
    });
  }, []);

  const handleGestureSelect = (gesture) => {
    setSelectedGesture(gesture);
    setShowInstructions(false);
  };

  const handleBackToSelection = () => {
    setSelectedGesture(null);
    setShowInstructions(true);
  };

  // No renderizar hasta que esté montado en el cliente
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amethyst dark:border-grape mx-auto mb-4"></div>
          <p className="text-amethyst dark:text-grape text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  const groups = config ? groupByCategory(config) : [];

  return (
    <div className="mt-5 py-8 pb-4 lg:pb-8">
      <div className="max-w-7xl mx-auto px-12 md:px-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-semibold text-amethyst dark:text-grape mb-2">
            🤝 Contribuir con Nuevos Gestos
          </h1>
          <p className="text-lg text-main-dark dark:text-platinum/70">
            Ayúdanos a mejorar el modelo grabando gestos en lenguaje de señas
          </p>
        </div>

        {showInstructions && !selectedGesture && (
          <div className="mb-8 space-y-4">
            {/* Estadísticas del usuario */}
            {userStats.totalContributions > 0 && (
              <div className="bg-wisteria/20 dark:bg-amethyst/20 border-l-4 border-amethyst dark:border-grape p-4 rounded-lg shadow-md">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🎉</div>
                  <div>
                    <p className="text-lg font-semibold text-amethyst dark:text-grape">
                      ¡Gran trabajo!
                    </p>
                    <p className="text-sm text-main-dark dark:text-platinum/70">
                      Has contribuido con <strong className="text-amethyst dark:text-grape">{userStats.totalContributions}</strong> muestras
                      en <strong className="text-amethyst dark:text-grape">{userStats.totalGestures}</strong> gestos diferentes
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-main-light dark:bg-main-dark border border-platinum dark:border-platinum/20 rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-amethyst dark:text-grape mb-4">
                📋 Instrucciones
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-main-dark dark:text-platinum/70">
                <li>Selecciona el gesto que deseas grabar de la lista</li>
                <li>Permite el acceso a tu cámara cuando se solicite</li>
                <li>Colócate frente a la cámara con buena iluminación</li>
                <li>Cuando veas &quot;Listo para capturar&quot;, realiza el gesto</li>
                <li>La grabación iniciará automáticamente al detectar tus manos</li>
                <li>Mantén el gesto hasta que termine la captura</li>
                <li>Puedes grabar múltiples muestras del mismo gesto</li>
              </ol>

              <div className="mt-6 space-y-3">
                <div className="p-4 bg-wisteria/20 dark:bg-amethyst/20 border-l-4 border-wisteria dark:border-amethyst rounded">
                  <p className="text-sm text-main-dark">
                    <strong className="text-amethyst dark:text-grape">💡 Consejo:</strong> Graba al menos 3-5 muestras de cada gesto
                    desde diferentes ángulos para mejorar la precisión del modelo.
                  </p>
                </div>

                {config && (
                  <div className="p-4 bg-amethyst/20 dark:bg-grape/20 border-l-4 border-amethyst dark:border-grape rounded">
                    <p className="text-sm text-main-dark dark:text-platinum/70">
                      <strong className="text-amethyst dark:text-grape">📊 Objetivo:</strong> Grabemos todos los {vocabularySize(config)} gestos
                      para tener un modelo completo y robusto.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-wisteria/20 dark:bg-amethyst/20 border-l-4 border-wisteria dark:border-amethyst rounded">
                  <p className="text-sm text-main-dark dark:text-platinum/70">
                    <strong className="text-amethyst dark:text-grape">🙌 También ayuda mucho:</strong> grabar la opción
                    &quot;No es una seña&quot; (rascarte, acomodarte el cabello, gesticular al hablar). Así la app aprende
                    a no confundir esos movimientos con una palabra.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedGesture ? (
          /* Selección de gestos */
          <div className="bg-main-light dark:bg-main-dark border border-platinum dark:border-platinum/20 rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-amethyst dark:text-grape mb-6">
              Selecciona un gesto para grabar
            </h2>

            {configError && (
              <p role="alert" className="text-red-500">
                No se pudo cargar la lista de señas. Recarga la página.
              </p>
            )}
            {!config && !configError && (
              <p className="text-main-dark dark:text-platinum/70">Cargando señas...</p>
            )}

            {groups.map((group) => (
              <section key={group.key} className="mb-8">
                <h3 className="text-lg font-semibold text-main-dark dark:text-platinum mb-3">{group.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <GestureButton
                      key={item.id}
                      gesture={toGesture(config, item, group.label)}
                      onSelect={handleGestureSelect}
                    />
                  ))}
                </div>
              </section>
            ))}

            {config && (
              <section>
                <h3 className="text-lg font-semibold text-main-dark dark:text-platinum mb-3">Ayuda al rechazo de movimientos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <GestureButton gesture={NEGATIVE_GESTURE} onSelect={handleGestureSelect} />
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Componente de captura */
          <div>
            <button
              onClick={handleBackToSelection}
              className="mb-4 px-4 py-2 bg-platinum dark:bg-main-dark hover:bg-wisteria/20 dark:hover:bg-amethyst/20 text-amethyst dark:text-grape rounded-lg flex items-center gap-2 transition-colors border border-platinum dark:border-platinum/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver a selección
            </button>

            <GestureCapture
              gesture={selectedGesture}
              onBack={handleBackToSelection}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-main-dark dark:text-platinum/70">
          <p>
            <strong>🔒 Privacidad y Seguridad:</strong> Los gestos grabados se almacenan remotamente y se utilizan
            exclusivamente para entrenar y mejorar nuestro modelo de reconocimiento de lenguaje de señas.
            <strong> No se capturan ni almacenan imágenes o videos de las personas.</strong> Solo se extraen y guardan
            coordenadas numéricas (keypoints) que representan la posición de las manos, rostro y cuerpo en el espacio 3D.
            Cada navegador genera un identificador aleatorio (no contiene tu nombre ni ningún dato personal) que se
            guarda junto a tus muestras solo para poder evaluar el modelo con personas distintas a las que lo entrenaron.
            Al contribuir, aceptas que estos datos técnicos sean utilizados únicamente para fines de investigación y
            mejora del modelo de reconocimiento de lenguaje de señas.
          </p>
        </div>
      </div>
    </div>
  );
}
