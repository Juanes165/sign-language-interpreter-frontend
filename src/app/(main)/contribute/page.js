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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando capturador de gestos...</p>
        </div>
      </div>
    )
  }
);

// Lista de gestos disponibles para contribuir (LISTA FIJA)
const AVAILABLE_GESTURES = [
  { id: 'sordo', label: 'Sordo', description: 'Persona sorda', emoji: '👂' },
  { id: 'hola', label: 'Hola', description: 'Saludo básico', emoji: '👋' },
  { id: 'como-estas', label: '¿Cómo estás?', description: 'Pregunta de cortesía', emoji: '🤔' },
  { id: 'bien', label: 'Bien', description: 'Respuesta positiva', emoji: '👍' },
  { id: 'mal', label: 'Mal', description: 'Respuesta negativa', emoji: '👎' },
  { id: 'mas-o-menos', label: 'Más o menos', description: 'Respuesta neutral', emoji: '🤷' },
  { id: 'buenos-dias', label: 'Buenos días', description: 'Saludo matutino', emoji: '☀️' },
  { id: 'buenas-tardes', label: 'Buenas tardes', description: 'Saludo vespertino', emoji: '🌤️' },
  { id: 'buenas-noches', label: 'Buenas noches', description: 'Saludo nocturno', emoji: '🌙' },
  { id: 'adios', label: 'Adiós', description: 'Despedida', emoji: '👋' },
  { id: 'por-favor', label: 'Por favor', description: 'Solicitud cortés', emoji: '🙏' },
  { id: 'con-gusto', label: 'Con gusto', description: 'Aceptación amable', emoji: '😊' },
  { id: 'bienvenido', label: 'Bienvenido', description: 'Recibimiento', emoji: '🤗' },
  { id: 'gracias', label: 'Gracias', description: 'Agradecimiento', emoji: '🙏' },
  { id: 'perdon', label: 'Perdón', description: 'Disculpa', emoji: '🙇' },
  { id: 'permiso', label: 'Permiso', description: 'Solicitud de paso', emoji: '🚶' },
  { id: 'lo-siento', label: 'Lo siento', description: 'Disculpa formal', emoji: '😔' },
  { id: 'feliz-cumpleanos', label: 'Feliz cumpleaños', description: 'Celebración', emoji: '🎂' },
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
      <div className="flex items-center justify-center min-h-screen ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 mt-5 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤝 Contribuir con Nuevos Gestos
          </h1>
          <p className="text-lg text-gray-600">
            Ayúdanos a mejorar el modelo grabando gestos en lenguaje de señas
          </p>
        </div>

        {showInstructions && !selectedGesture && (
          <div className="mb-8 space-y-4">
            {/* Estadísticas del usuario */}
            {userStats.totalContributions > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg shadow-md">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🎉</div>
                  <div>
                    <p className="text-lg font-semibold text-indigo-900">
                      ¡Gran trabajo!
                    </p>
                    <p className="text-sm text-indigo-700">
                      Has contribuido con <strong>{userStats.totalContributions}</strong> muestras 
                      en <strong>{userStats.totalGestures}</strong> gestos diferentes
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Instrucciones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                📋 Instrucciones
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Selecciona el gesto que deseas grabar de la lista</li>
                <li>Permite el acceso a tu cámara cuando se solicite</li>
                <li>Colócate frente a la cámara con buena iluminación</li>
                <li>Cuando veas &quot;Listo para capturar&quot;, realiza el gesto</li>
                <li>La grabación iniciará automáticamente al detectar tus manos</li>
                <li>Mantén el gesto hasta que termine la captura</li>
                <li>Puedes grabar múltiples muestras del mismo gesto</li>
              </ol>
              
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Consejo:</strong> Graba al menos 3-5 muestras de cada gesto 
                    desde diferentes ángulos para mejorar la precisión del modelo.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>📊 Objetivo:</strong> Grabemos todos los {AVAILABLE_GESTURES.length} gestos 
                    para tener un modelo completo y robusto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedGesture ? (
          /* Selección de gestos */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Selecciona un gesto para grabar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_GESTURES.map((gesture) => (
                <button
                  key={gesture.id}
                  onClick={() => handleGestureSelect(gesture)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{gesture.emoji}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600">
                          {gesture.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {gesture.description}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-indigo-600"
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
              className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 transition-colors"
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
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Los gestos grabados se almacenan remotamente y se utilizan para entrenar 
            y mejorar nuestro modelo de reconocimiento de lenguaje de señas.
            Al contribuir, aceptas que tus grabaciones sean revisadas por nuestro equipo tu imagen no sera usada con otros fines.
          </p>
        </div>
      </div>
    </div>
  );
}
