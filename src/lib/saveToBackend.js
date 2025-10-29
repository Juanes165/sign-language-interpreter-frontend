/**
 * Envía muestras capturadas directamente a Google Drive
 */

/**
 * Sube una muestra a Google Drive a través de la API de Next.js
 * @param {Object} sample - Muestra con keypoints
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function uploadToDrive(sample) {
  try {
    const response = await fetch('/api/gestures/upload-to-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sample),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || `Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Muestra subida a Drive:', result.filename);
    return result;
  } catch (error) {
    console.error('❌ Error subiendo a Drive:', error);
    throw error;
  }
}

/**
 * Guarda una muestra en el backend local (fallback)
 * @param {Object} sample - Muestra con keypoints
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function saveToBackend(sample) {
  try {
    const response = await fetch('/api/gestures/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sample),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Muestra guardada en backend:', result);
    return result;
  } catch (error) {
    console.error('❌ Error enviando al backend:', error);
    throw error;
  }
}

/**
 * Guarda múltiples muestras en el backend
 * @param {Array<Object>} samples - Array de muestras
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function saveBatchToBackend(samples) {
  try {
    const response = await fetch('/api/gestures/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ samples }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ ${samples.length} muestras guardadas en backend`);
    return result;
  } catch (error) {
    console.error('❌ Error enviando batch al backend:', error);
    throw error;
  }
}

/**
 * Guarda en localStorage como fallback y envía al backend
 * @param {Object} sample - Muestra con keypoints
 * @param {boolean} useBackend - Si true, envía al backend en lugar de localStorage
 */
export async function saveSampleSmart(sample, useBackend = false) {
  if (useBackend) {
    // Opción 1: Guardar directo en backend (sin localStorage)
    try {
      return await saveToBackend(sample);
    } catch (error) {
      console.warn('⚠️ Backend no disponible, guardando en localStorage...');
      // Fallback a localStorage si el backend falla
    }
  }

  // Opción 2: Guardar en localStorage (default)
  const storageKey = `gesture_${sample.gesture}_${sample.timestamp}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(sample));
    console.log(`✅ Muestra guardada localmente: ${storageKey}`);
    return { success: true, storageKey };
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('❌ localStorage lleno');
      throw new Error('Espacio de almacenamiento lleno. Activa el envío al backend.');
    }
    throw err;
  }
}
