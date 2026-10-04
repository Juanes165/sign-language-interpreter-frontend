import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { beforeAll, describe, expect, it } from 'vitest';
import fixture from './fixtures/model_parity.json';

const dir = resolve(import.meta.dirname, '../public/models');
const readJson = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf-8'));

let model;
let config;

beforeAll(async () => {
  await tf.setBackend('cpu');
  const manifest = readJson('model.json');
  const bin = readFileSync(resolve(dir, 'weights.bin'));
  const weightData = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  model = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: manifest.modelTopology,
      weightSpecs: manifest.weightsManifest[0].weights,
      weightData,
    }),
  );
  config = readJson('model_config.json');
}, 60000);

describe('modelo v7 exportado', () => {
  it('config coherente con words.json y la entrada del modelo', () => {
    const words = readJson('words.json').word_ids;
    expect(config.classes.filter((c) => c !== config.negative_class)).toEqual(words);
    expect(model.inputs[0].shape).toEqual([null, config.frames, config.features]);
    expect(model.outputs[0].shape[1]).toBe(config.classes.length);
    expect(config.threshold).toBeGreaterThan(0.5);
    expect(config.threshold).toBeLessThan(1);
  });

  it('TF.js reproduce las probabilidades de Keras', () => {
    const x = tf.tensor3d(fixture.inputs);
    const out = model.predict(x);
    const probs = out.arraySync();
    x.dispose();
    out.dispose();

    probs.forEach((row, i) => {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 4);
      let worst = 0;
      row.forEach((p, j) => {
        worst = Math.max(worst, Math.abs(p - fixture.probs[i][j]));
      });
      expect(worst, `muestra ${i}`).toBeLessThan(2e-3);
      expect(row.indexOf(Math.max(...row))).toBe(fixture.probs[i].indexOf(Math.max(...fixture.probs[i])));
    });
  });
});
