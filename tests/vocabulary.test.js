import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getContributorId } from '../src/lib/contributor.js';
import {
  displayText,
  fallbackLabel,
  groupByCategory,
  plainLabel,
  vocabularySize,
} from '../src/lib/vocabulary.js';

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, '../public/models/model_config.json'), 'utf-8'));

describe('vocabulario', () => {
  it('toda clase del modelo (salvo la de rechazo) tiene texto y categoria', () => {
    const words = config.classes.filter((c) => c !== config.negative_class);
    expect(Object.keys(config.vocabulary).sort()).toEqual([...words].sort());
    for (const id of words) {
      expect(config.vocabulary[id].display.trim()).not.toBe('');
      expect(Object.keys(config.categories)).toContain(config.vocabulary[id].category);
    }
    expect(vocabularySize(config)).toBe(words.length);
  });

  it('displayText usa el vocabulario y cae a un texto legible', () => {
    expect(displayText(config, 'como-estas')).toBe('¿Cómo estás?');
    expect(plainLabel(config, 'como-estas')).toBe('Cómo estás');
    expect(displayText(config, 'seña-nueva')).toBe('Seña nueva');
    expect(displayText(undefined, 'buenos-dias')).toBe('Buenos dias');
    expect(fallbackLabel('mas-o-menos')).toBe('Mas o menos');
  });

  it('agrupa por categoria, en orden, sin categorias vacias y sin perder señas', () => {
    const groups = groupByCategory(config);
    expect(groups.map((g) => g.key)).toEqual(Object.keys(config.categories).filter((k) =>
      Object.values(config.vocabulary).some((v) => v.category === k)));
    expect(groups.flatMap((g) => g.items).length).toBe(vocabularySize(config));
    for (const g of groups) {
      const labels = g.items.map((i) => i.label);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'es')));
    }
  });

  it('una categoria desconocida no hace desaparecer sus señas', () => {
    const odd = { categories: { a: 'A' }, vocabulary: { x: { display: 'X', category: 'a' }, y: { display: 'Y', category: 'zzz' } } };
    expect(groupByCategory(odd).map((g) => g.key)).toEqual(['a', 'zzz']);
  });
});

describe('contributorId', () => {
  const memory = () => {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  };

  it('crea un id y lo reutiliza', () => {
    const store = memory();
    const first = getContributorId(store);
    expect(first.length).toBeGreaterThan(8);
    expect(getContributorId(store)).toBe(first);
  });

  it('funciona aunque el almacenamiento falle', () => {
    const broken = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(getContributorId(broken).length).toBeGreaterThan(8);
  });
});
