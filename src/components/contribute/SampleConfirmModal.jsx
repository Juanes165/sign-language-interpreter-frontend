'use client';

import { useState } from 'react';
import { MODEL_CONFIG, evaluateQuality } from '@/config/modelConfig';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-dark/75 dark:bg-main-dark/75 backdrop-blur-sm">
      <div className="bg-main-light dark:bg-main-dark rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border-2 border-amethyst dark:border-grape">
        {/* Header */}
        <div className="bg-gradient-to-r from-amethyst to-wisteria dark:from-grape dark:to-amethyst rounded-t-2xl p-6">
          <h2 className="text-2xl font-bold text-main-light flex items-center gap-3">
            <span className="text-3xl">✅</span>
            ¡Muestra Capturada!
          </h2>
          <p className="text-main-light/90 mt-2">
            Revisa los detalles y decide si deseas subir o eliminar esta muestra
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sample Info */}
          <div className="bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-amethyst dark:text-grape mb-1">
                  {sample.gestureName}
                </h3>
                <p className="text-sm text-platinum dark:text-platinum/70">
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
              <div className="bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded-lg p-3 text-center">
                <div className="text-sm text-platinum dark:text-platinum/70 mb-1">Frames</div>
                <div className="text-2xl font-bold text-wisteria dark:text-amethyst">
                  {sample.totalFrames}
                </div>
              </div>
              
              <div className="bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded-lg p-3 text-center">
                <div className="text-sm text-platinum dark:text-platinum/70 mb-1">Hora</div>
                <div className="text-lg font-semibold text-amethyst dark:text-grape">
                  {formatDate(sample.timestamp)}
                </div>
              </div>
              
              <div className="bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded-lg p-3 text-center">
                <div className="text-sm text-platinum dark:text-platinum/70 mb-1">Tamaño</div>
                <div className="text-lg font-semibold text-wisteria dark:text-amethyst">
                  {(JSON.stringify(sample.keypoints).length / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>

          {/* Quality Indicator */}
          {(() => {
            const quality = evaluateQuality(sample.totalFrames);
            const colorClasses = {
              green: 'bg-wisteria/20 dark:bg-amethyst/20 border-wisteria dark:border-amethyst text-wisteria dark:text-amethyst',
              blue: 'bg-amethyst/20 dark:bg-grape/20 border-amethyst dark:border-grape text-amethyst dark:text-grape',
              yellow: 'bg-wisteria/20 dark:bg-amethyst/20 border-wisteria dark:border-amethyst text-amethyst dark:text-grape',
              red: 'bg-wisteria/20 dark:bg-amethyst/20 border-wisteria dark:border-amethyst text-amethyst dark:text-grape'
            };
            const icons = {
              excellent: '🏆',
              optimal: '🎯',
              good: '✅',
              acceptable: '⚠️',
              poor: '❌'
            };
            
            return (
              <div className={`rounded-lg p-4 border-2 ${colorClasses[quality.color]}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icons[quality.level]}</span>
                  <div>
                    <p className={`font-semibold ${colorClasses[quality.color].split(' ').pop()}`}>
                      {quality.label}
                    </p>
                    <p className="text-sm text-platinum dark:text-platinum/70">
                      {quality.message}
                    </p>
                    <p className="text-xs text-platinum dark:text-platinum/50 mt-1">
                      Modelo usa: {MODEL_CONFIG.MODEL_FRAMES} frames | Tu captura: {sample.totalFrames} frames
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Help Text */}
          <div className="bg-wisteria/20 dark:bg-amethyst/20 border border-wisteria dark:border-amethyst rounded-lg p-4">
            <p className="text-sm text-platinum dark:text-platinum/70">
              <strong className="text-amethyst dark:text-grape">💡 Recomendación:</strong> Para mejor precisión, intenta capturar entre {MODEL_CONFIG.RECOMMENDED_MIN_FRAMES}-{MODEL_CONFIG.EXCELLENT_FRAMES} frames. 
              El modelo se entrena con {MODEL_CONFIG.MODEL_FRAMES} frames por muestra.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-main-dark dark:bg-main-light/5 rounded-b-2xl flex gap-4">
          <button
            onClick={handleDelete}
            disabled={isUploading}
            className="flex-1 px-6 py-4 bg-wisteria dark:bg-amethyst hover:bg-amethyst dark:hover:bg-grape disabled:bg-platinum dark:disabled:bg-main-dark disabled:cursor-not-allowed text-main-light font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 text-lg"
          >
            🗑️ Eliminar
          </button>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 px-6 py-4 bg-amethyst dark:bg-grape hover:bg-wisteria dark:hover:bg-amethyst disabled:bg-platinum dark:disabled:bg-main-dark disabled:cursor-not-allowed text-main-light font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg"
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
        <div className="px-6 pb-4 text-center text-xs text-platinum dark:text-platinum/50">
          Consejo: Presiona <kbd className="px-2 py-1 bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded text-amethyst dark:text-grape">Delete</kbd> para eliminar 
          o <kbd className="px-2 py-1 bg-main-dark dark:bg-main-light/5 border border-platinum dark:border-platinum/20 rounded text-amethyst dark:text-grape">Enter</kbd> para subir
        </div>
      </div>
    </div>
  );
}

