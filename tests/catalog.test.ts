import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCENES, sceneFor } from '../src/scenes';

const layers = SCENES.flatMap(scene => scene.layers);

function readWav(url: string) {
  const file = readFileSync(new URL(`../public${url}`, import.meta.url));
  const samples = new Int16Array(file.buffer, file.byteOffset + 44, (file.length - 44) / 2);
  return { file, samples, sampleRate: file.readUInt32LE(24) };
}

describe('scene catalog', () => {
  it('gives every scene an ambience layer and a music layer', () => {
    for (const scene of SCENES) {
      expect(scene.layers.map(layer => layer.kind).sort()).toEqual(['ambience', 'music']);
    }
  });
  it('uses unique layer ids and sensible default levels', () => {
    expect(new Set(layers.map(layer => layer.id)).size).toBe(layers.length);
    for (const layer of layers) {
      expect(layer.defaultLevel).toBeGreaterThan(0);
      expect(layer.defaultLevel).toBeLessThanOrEqual(1);
    }
  });
  it('credits exactly the layers the generator does not make', () => {
    const generator = readFileSync(new URL('../scripts/generate-audio.mjs', import.meta.url), 'utf8');
    for (const layer of layers) {
      expect(Boolean(layer.credit), layer.id).toBe(!generator.includes(`id: '${layer.id}'`));
      if (layer.credit) expect(layer.credit.url).toMatch(/^https:\/\//);
    }
  });
  it('falls back to the apartment for unknown scene ids', () => {
    expect(sceneFor('arcade').id).toBe('arcade');
    expect(sceneFor('nowhere').id).toBe('apartment');
    expect(sceneFor(null).id).toBe('apartment');
  });
});

describe.each(layers)('$id audio', layer => {
  const { file, samples, sampleRate } = readWav(layer.url);

  it('is a mono 16-bit PCM WAV of a usable loop length', () => {
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    expect(file.readUInt16LE(20)).toBe(1);
    expect(file.readUInt16LE(22)).toBe(1);
    expect(file.readUInt16LE(34)).toBe(16);
    expect(file.readUInt32LE(40)).toBe(samples.length * 2);
    expect(samples.length / sampleRate).toBeGreaterThanOrEqual(45);
  });
  it('leaves headroom and is not silent', () => {
    let peak = 0;
    let power = 0;
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample));
      power += sample * sample;
    }
    expect(peak / 32768).toBeLessThanOrEqual(0.9);
    expect(Math.sqrt(power / samples.length) / 32768).toBeGreaterThan(0.02);
  });
  it('loops without a click at the seam', () => {
    let largestStep = 0;
    for (let index = 1; index < samples.length; index++) {
      largestStep = Math.max(largestStep, Math.abs(samples[index] - samples[index - 1]));
    }
    // Wrapping from the last sample to the first is no sharper than the audio itself.
    expect(Math.abs(samples[0] - samples[samples.length - 1])).toBeLessThanOrEqual(largestStep);
  });
});
