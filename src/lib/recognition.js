/**
 * Logica pura de decision sobre las probabilidades del modelo (sin React ni TF.js),
 * para poder probarla sin camara.
 */

/** Promedia las probabilidades de varias pasadas (p. ej. distintos offsets de remuestreo). */
export function averageProbabilities(list) {
  const n = list[0].length;
  const out = new Float32Array(n);
  for (const p of list) for (let i = 0; i < n; i++) out[i] += p[i] / list.length;
  return out;
}

/**
 * Decide si aceptar una prediccion.
 * Rechaza si: la clase ganadora es 'sin-sena', la confianza es menor al umbral, o la
 * diferencia con la segunda clase es menor al margen (la prediccion es ambigua).
 *
 * @returns {{accepted:boolean, reason:'ok'|'no_sign'|'low_confidence'|'ambiguous',
 *            index:number, label:string, confidence:number, margin:number}}
 */
export function decidePrediction(probs, labels, { threshold, margin, negativeClass = 'sin-sena' }) {
  let best = 0;
  let second = -1;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[best]) {
      second = best;
      best = i;
    } else if (second < 0 || probs[i] > probs[second]) {
      second = i;
    }
  }
  const confidence = probs[best];
  const gap = second >= 0 ? confidence - probs[second] : confidence;
  const label = labels[best];
  const base = { index: best, label, confidence, margin: gap };

  if (label === negativeClass) return { ...base, accepted: false, reason: 'no_sign' };
  if (confidence < threshold) return { ...base, accepted: false, reason: 'low_confidence' };
  if (gap < margin) return { ...base, accepted: false, reason: 'ambiguous' };
  return { ...base, accepted: true, reason: 'ok' };
}

export const REJECTION_MESSAGES = {
  no_sign: 'No reconocí una seña. Inténtalo de nuevo.',
  low_confidence: 'No estoy seguro de la seña. Repítela con calma.',
  ambiguous: 'La seña se parece a otra. Repítela con claridad.',
};

/** Evita repetir la misma palabra dos veces seguidas dentro de la ventana de cooldown. */
export function isDuplicate(last, wordId, now, cooldownMs) {
  return last.wordId === wordId && now - last.timestamp <= cooldownMs;
}

/** Une las palabras en orden de lectura (la mas antigua primero). */
export function sentenceToText(words) {
  return words.join(' ').replace(/\s+/g, ' ').trim();
}
