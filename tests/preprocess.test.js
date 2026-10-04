import { describe, expect, it } from 'vitest';
import fixture from './fixtures/preprocess_parity.json';
import {
  N_FEATURES,
  preprocessSequence,
  resampleSequence,
} from '../src/lib/preprocess.js';

const TOL = 1e-4;

function expectSameAsPython(out, expected) {
  expect(out).toHaveLength(expected.length);
  out.forEach((frame, i) => {
    expect(frame).toHaveLength(N_FEATURES);
    let worst = 0;
    for (let j = 0; j < N_FEATURES; j++) {
      worst = Math.max(worst, Math.abs(frame[j] - expected[i][j]));
    }
    expect(worst, `frame ${i}`).toBeLessThan(TOL);
  });
}

describe('preprocess.js coincide con preprocess.py', () => {
  for (const [name, c] of Object.entries(fixture.cases)) {
    const raw = () => c.raw.map((f) => Float32Array.from(f));

    it(`caso ${name} (con cara, modelo v7)`, () => {
      expectSameAsPython(preprocessSequence(raw()), c.features);
    });

    it(`caso ${name} (sin cara, use_face=false)`, () => {
      expectSameAsPython(preprocessSequence(raw(), { useFace: false }), c.features_noface);
    });
  }

  it('sin cara el bloque de cara queda en cero', () => {
    const c = fixture.cases.real_hola;
    const out = preprocessSequence(c.raw.map((f) => Float32Array.from(f)), { useFace: false });
    out.forEach((frame) => expect(frame.slice(159, 192).every((v) => v === 0)).toBe(true));
  });
});

describe('resampleSequence coincide con resample_sequence', () => {
  for (const [target, c] of Object.entries(fixture.resample)) {
    it(`a ${target} frames`, () => {
      const input = c.input.map((f) => Float32Array.from(f));
      const out = resampleSequence(input, Number(target));
      expect(out).toHaveLength(c.output.length);
      out.forEach((frame, i) => {
        frame.forEach((v, j) => expect(v).toBeCloseTo(c.output[i][j], 4));
      });
    });
  }
});
