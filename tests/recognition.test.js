import { describe, expect, it } from 'vitest';
import {
  averageProbabilities,
  decidePrediction,
  isDuplicate,
  sentenceToText,
} from '../src/lib/recognition.js';
import { pickSpanishVoice } from '../src/lib/speech.js';

const labels = ['hola', 'gracias', 'adios', 'sin-sena'];
const cfg = { threshold: 0.8, margin: 0.2 };

describe('decidePrediction', () => {
  it('acepta cuando hay confianza y margen', () => {
    const r = decidePrediction([0.9, 0.05, 0.03, 0.02], labels, cfg);
    expect(r).toMatchObject({ accepted: true, reason: 'ok', label: 'hola' });
  });

  it('rechaza confianza baja', () => {
    expect(decidePrediction([0.6, 0.2, 0.1, 0.1], labels, cfg).reason).toBe('low_confidence');
  });

  it('rechaza ambiguas aunque superen el umbral', () => {
    const r = decidePrediction([0.45, 0.41, 0.1, 0.04], labels, { threshold: 0.4, margin: 0.2 });
    expect(r.reason).toBe('ambiguous');
    expect(r.accepted).toBe(false);
  });

  it('rechaza la clase sin-sena', () => {
    const r = decidePrediction([0.02, 0.03, 0.05, 0.9], labels, cfg);
    expect(r).toMatchObject({ accepted: false, reason: 'no_sign' });
  });

  it('el indice ganador funciona con cualquier orden', () => {
    expect(decidePrediction([0.01, 0.01, 0.97, 0.01], labels, cfg).label).toBe('adios');
  });
});

describe('utilidades', () => {
  it('promedia probabilidades', () => {
    const out = averageProbabilities([Float32Array.from([1, 0]), Float32Array.from([0, 1])]);
    expect(Array.from(out)).toEqual([0.5, 0.5]);
  });

  it('detecta duplicados dentro del cooldown', () => {
    const last = { wordId: 'hola', timestamp: 1000 };
    expect(isDuplicate(last, 'hola', 2000, 1500)).toBe(true);
    expect(isDuplicate(last, 'hola', 2600, 1500)).toBe(false);
    expect(isDuplicate(last, 'gracias', 1100, 1500)).toBe(false);
  });

  it('arma la frase en orden de lectura', () => {
    expect(sentenceToText(['Hola', ' ', 'Cómo estás'])).toBe('Hola Cómo estás');
  });
});

describe('pickSpanishVoice', () => {
  const v = (lang) => ({ lang, name: lang });
  it('prefiere es-CO y cae a otras variantes', () => {
    expect(pickSpanishVoice([v('en-US'), v('es-ES'), v('es-CO')]).lang).toBe('es-CO');
    expect(pickSpanishVoice([v('en-US'), v('es-ES'), v('es_MX')]).lang).toBe('es_MX');
    expect(pickSpanishVoice([v('en-US'), v('es-AR')]).lang).toBe('es-AR');
    expect(pickSpanishVoice([v('en-US')])).toBeNull();
  });
});
