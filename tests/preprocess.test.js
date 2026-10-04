import { describe, expect, it } from 'vitest';
import fixture from './fixtures/preprocess_parity.json';
import {
  N_FEATURES,
  preprocessSequence,
  resampleSequence,
} from '../src/lib/preprocess.js';

const TOL = 1e-4;

describe('preprocess.js coincide con preprocess.py', () => {
  for (const [name, c] of Object.entries(fixture.cases)) {
    it(`caso ${name}`, () => {
      const raw = c.raw.map((f) => Float32Array.from(f));
      const out = preprocessSequence(raw);
      expect(out).toHaveLength(c.features.length);
      out.forEach((frame, i) => {
        expect(frame).toHaveLength(N_FEATURES);
        let worst = 0;
        for (let j = 0; j < N_FEATURES; j++) {
          worst = Math.max(worst, Math.abs(frame[j] - c.features[i][j]));
        }
        expect(worst, `frame ${i}`).toBeLessThan(TOL);
      });
    });
  }
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
