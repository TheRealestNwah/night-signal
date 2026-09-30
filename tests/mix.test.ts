import { describe, expect, it } from 'vitest';
import { clampLevel, defaultLevels, gainFor, parseLevels } from '../src/mix';
import { SCENES } from '../src/scenes';

describe('mixer levels', () => {
  it('clamps levels into range and rejects non-numbers', () => {
    expect(clampLevel(0.4, 1)).toBe(0.4);
    expect(clampLevel(-2, 1)).toBe(0);
    expect(clampLevel(7, 0)).toBe(1);
    expect(clampLevel(Number.NaN, 0.5)).toBe(0.5);
    expect(clampLevel('0.3', 0.5)).toBe(0.5);
  });
  it('maps slider position to gain with a gentle curve', () => {
    expect(gainFor(0)).toBe(0);
    expect(gainFor(1)).toBe(1);
    expect(gainFor(0.5)).toBe(0.25);
    expect(gainFor(3)).toBe(1);
  });
});

describe('saved mixes', () => {
  it('starts from the catalog defaults', () => {
    expect(parseLevels(null)).toEqual(defaultLevels());
    for (const layer of SCENES.flatMap(scene => scene.layers)) expect(layer.defaultLevel).toBe(layer.kind === 'ambience' ? 0.25 : 0.5);
  });
  it('restores saved levels and ignores unknown layers and bad values', () => {
    const levels = parseLevels(JSON.stringify({ 'apartment-rain': 0.2, 'apartment-lofi': 'loud', 'retired-layer': 1 }));
    expect(levels['apartment-rain']).toBe(0.2);
    expect(levels['apartment-lofi']).toBe(defaultLevels()['apartment-lofi']);
    expect(levels).not.toHaveProperty('retired-layer');
  });
  it('survives corrupt storage', () => {
    expect(parseLevels('{not json')).toEqual(defaultLevels());
    expect(parseLevels('null')).toEqual(defaultLevels());
  });
});
