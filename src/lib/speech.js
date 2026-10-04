/**
 * Texto a voz con la Web Speech API del navegador (sin servicios externos ni credenciales).
 */

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

const PREFERRED_LANGS = ['es-CO', 'es-419', 'es-MX', 'es-US', 'es-ES'];

/** Elige la mejor voz en espanol, prefiriendo la variante colombiana/latinoamericana. */
export function pickSpanishVoice(voices) {
  const norm = (v) => v.lang.replace('_', '-');
  for (const lang of PREFERRED_LANGS) {
    const found = voices.find((v) => norm(v) === lang);
    if (found) return found;
  }
  return voices.find((v) => norm(v).toLowerCase().startsWith('es')) ?? null;
}

/**
 * Lee `text` en voz alta, cancelando lo que estuviera sonando.
 * @returns {boolean} true si se pidio hablar
 */
export function speak(text, { rate = 0.95 } = {}) {
  if (!isSpeechSupported() || !text) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[¿¡]/g, ''));
  utterance.lang = 'es-CO';
  utterance.rate = rate;
  const voice = pickSpanishVoice(synth.getVoices());
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  synth.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
