'use client';

import { useState } from 'react';

export default function SampleConfirmModal({ 
  sample, 
  onUpload, 
  onDelete,
  isOpen 
}) {
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !sample) return null;

  const handleUpload = async () => {
    setIsUploading(true);
    await onUpload(sample);
    setIsUploading(false);
  };

  const handleDelete = () => {
    onDelete(sample);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border-2 border-gray-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">✅</span>
            ¡Muestra Capturada!
          </h2>
          <p className="text-blue-100 mt-2">
            Revisa los detalles y decide si deseas subir o eliminar esta muestra
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sample Info */}
          <div className="bg-gray-900 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {sample.gestureName}
                </h3>
                <p className="text-sm text-gray-400">
                  Gesto capturado
                </p>
              </div>
              <div className="text-5xl">
                {/* Emoji según el gesto */}
                {sample.gesture === 'hola' && '👋'}
                {sample.gesture === 'gracias' && '🙏'}
                {sample.gesture === 'adios' && '👋'}
                {sample.gesture === 'bien' && '👍'}
                {sample.gesture === 'mal' && '👎'}
                {!['hola', 'gracias', 'adios', 'bien', 'mal'].includes(sample.gesture) && '🤟'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Frames</div>
                <div className="text-2xl font-bold text-green-400">
                  {sample.totalFrames}
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Hora</div>
                <div className="text-lg font-semibold text-blue-400">
                  {formatDate(sample.timestamp)}
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Tamaño</div>
                <div className="text-lg font-semibold text-purple-400">
                  {(JSON.stringify(sample.keypoints).length / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>

          {/* Quality Indicator */}
          <div className={`rounded-lg p-4 border-2 ${
            sample.totalFrames >= 15 
              ? 'bg-green-900 bg-opacity-30 border-green-500' 
              : sample.totalFrames >= 10
              ? 'bg-yellow-900 bg-opacity-30 border-yellow-500'
              : 'bg-red-900 bg-opacity-30 border-red-500'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {sample.totalFrames >= 15 ? '🎯' : sample.totalFrames >= 10 ? '⚠️' : '❌'}
              </span>
              <div>
                <p className={`font-semibold ${
                  sample.totalFrames >= 15 
                    ? 'text-green-400' 
                    : sample.totalFrames >= 10
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {sample.totalFrames >= 15 
                    ? '¡Excelente calidad!' 
                    : sample.totalFrames >= 10
                    ? 'Calidad aceptable'
                    : 'Calidad baja'}
                </p>
                <p className="text-sm text-gray-400">
                  {sample.totalFrames >= 15 
                    ? 'Esta muestra tiene suficientes frames para entrenar bien el modelo.' 
                    : sample.totalFrames >= 10
                    ? 'La muestra es válida pero podrías intentar capturar más frames.'
                    : 'Se recomienda capturar al menos 10 frames para mejor precisión.'}
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              <strong>💡 Recomendación:</strong> Si el gesto se capturó correctamente y tiene suficientes frames, 
              súbelo para ayudar a mejorar el modelo. Si algo salió mal, elimínalo y vuelve a intentarlo.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-900 rounded-b-2xl flex gap-4">
          <button
            onClick={handleDelete}
            disabled={isUploading}
            className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 text-lg"
          >
            🗑️ Eliminar
          </button>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg"
          >
            {isUploading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Subiendo...
              </>
            ) : (
              <>
                📤 Subir al Modelo
              </>
            )}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="px-6 pb-4 text-center text-xs text-gray-500">
          Consejo: Presiona <kbd className="px-2 py-1 bg-gray-700 rounded">Delete</kbd> para eliminar 
          o <kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> para subir
        </div>
      </div>
    </div>
  );
}

