'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

// Lista de gestos disponibles para contribuir (LISTA FIJA) - 14 gestos
const AVAILABLE_GESTURES = [
  { id: 'mal', label: 'Mal', description: 'Respuesta negativa', emoji: '👎' },
  { id: 'hola', label: 'Hola', description: 'Saludo básico', emoji: '👋' },
  { id: 'lo-siento', label: 'Lo siento', description: 'Disculpa formal', emoji: '😔' },
  { id: 'sordo', label: 'Sordo', description: 'Persona sorda', emoji: '👂' },
  { id: 'mas-o-menos', label: 'Más o menos', description: 'Respuesta neutral', emoji: '🤷' },
  { id: 'bien', label: 'Bien', description: 'Respuesta positiva', emoji: '👍' },
  { id: 'buenas-tardes', label: 'Buenas tardes', description: 'Saludo vespertino', emoji: '🌤️' },
  { id: 'adios', label: 'Adiós', description: 'Despedida', emoji: '👋' },
  { id: 'feliz-cumpleanos', label: 'Feliz cumpleaños', description: 'Celebración', emoji: '🎂' },
  { id: 'gracias', label: 'Gracias', description: 'Agradecimiento', emoji: '🙏' },
  { id: 'buenas-noches', label: 'Buenas noches', description: 'Saludo nocturno', emoji: '🌙' },
  { id: 'como-estas', label: '¿Cómo estás?', description: 'Pregunta de cortesía', emoji: '🤔' },
  { id: 'permiso', label: 'Permiso', description: 'Solicitud de paso', emoji: '🚶' },
  { id: 'buenos-dias', label: 'Buenos días', description: 'Saludo matutino', emoji: '☀️' },
];

export default function ContributePage() {
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [userStats, setUserStats] = useState({
    totalContributions: 0,
    totalGestures: 0
  });

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
                
                <div className="p-4 bg-amethyst/20 dark:bg-grape/20 border-l-4 border-amethyst dark:border-grape rounded">
                  <p className="text-sm text-main-dark dark:text-platinum/70">
                    <strong className="text-amethyst dark:text-grape">📊 Objetivo:</strong> Grabemos todos los {AVAILABLE_GESTURES.length} gestos 
                    para tener un modelo completo y robusto.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_GESTURES.map((gesture) => (
                <button
                  key={gesture.id}
                  onClick={() => handleGestureSelect(gesture)}
                  className="p-4 border-2 border-platinum dark:border-platinum/20 rounded-lg hover:border-amethyst dark:hover:border-grape hover:bg-wisteria/20 dark:hover:bg-amethyst/20 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{gesture.emoji}</span>
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
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
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
            Estas coordenadas son completamente anónimas y no contienen información personal identificable. 
            Al contribuir, aceptas que estos datos técnicos sean utilizados únicamente para fines de investigación y 
            mejora del modelo de reconocimiento de lenguaje de señas.
          </p>
        </div>
      </div>
    </div>
  );
}
