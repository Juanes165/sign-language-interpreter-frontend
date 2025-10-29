'use client';

export default function SamplesList({ 
  samples, 
  onClearUploaded 
}) {
  const uploadedSamples = samples.filter(s => s.uploaded);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (uploadedSamples.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-400 text-lg">
          Sin historial todavía
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Las muestras que subas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del historial */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg p-4 border-2 border-green-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1 text-white">
              ✅ Historial de Muestras Subidas
            </h3>
            <p className="text-sm text-green-200">
              Total subidas: <span className="text-green-300 font-semibold text-lg">{uploadedSamples.length}</span>
            </p>
          </div>
          
          <button
            onClick={onClearUploaded}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            🧹 Limpiar historial
          </button>
        </div>
      </div>

      {/* Lista de muestras subidas */}
      <div className="space-y-3">
        {uploadedSamples.map((sample, index) => (
          <div
            key={sample.id}
            className="bg-green-900 bg-opacity-10 rounded-lg p-4 border-2 border-green-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Número de muestra */}
                <div className="flex items-center justify-center w-12 h-12 bg-green-700 rounded-full font-bold text-white">
                  {index + 1}
                </div>

                {/* Información de la muestra */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-xl text-white">
                      {sample.gestureName}
                    </h4>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                      ✓ Subido
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>
                      📊 <strong>{sample.totalFrames}</strong> frames
                    </span>
                    <span>
                      🕐 {formatDate(sample.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(JSON.stringify(sample.keypoints).length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador de éxito */}
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            </div>

            {/* Información expandida (opcional) */}
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
                Ver detalles técnicos
              </summary>
              <div className="mt-2 p-3 bg-gray-900 bg-opacity-70 rounded text-xs space-y-1 text-gray-300">
                <div><strong>ID:</strong> {sample.id}</div>
                <div><strong>Gesto ID:</strong> {sample.gesture}</div>
                <div><strong>Fecha completa:</strong> {sample.metadata.date}</div>
                <div><strong>Keypoints shape:</strong> {sample.totalFrames} frames × 1662 valores</div>
                <div className="truncate">
                  <strong>Browser:</strong> {sample.metadata.browser}
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Mensaje de éxito */}
      <div className="bg-green-900 bg-opacity-20 border border-green-600 rounded-lg p-4">
        <p className="text-sm text-green-200">
          <strong>🎉 ¡Excelente trabajo!</strong> Estas muestras han sido subidas correctamente 
          y serán utilizadas para mejorar el modelo de reconocimiento de lenguaje de señas.
        </p>
      </div>
    </div>
  );
}

