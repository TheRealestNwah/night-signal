import { SCENES } from './scenes';

export type Levels = Record<string, number>;
const LEVELS_KEY = 'night-signal:levels';
const VOLUME_KEY = 'night-signal:volume';
const MUTE_KEY = 'night-signal:muted';
export const DEFAULT_VOLUME = 0.85;

export function clampLevel(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

/** Sliders are linear; squaring makes the quiet end of the range usable. */
export function gainFor(level: number): number {
  const clamped = clampLevel(level, 0);
  return clamped * clamped;
}

export function defaultLevels(): Levels {
  return Object.fromEntries(SCENES.flatMap(scene => scene.layers.map(layer => [layer.id, layer.defaultLevel])));
}

/** Saved levels only apply to layers that still exist; anything else keeps its default. */
export function parseLevels(saved: string | null): Levels {
  const levels = defaultLevels();
  if (!saved) return levels;
  let parsed: unknown;
  try { parsed = JSON.parse(saved); } catch { return levels; }
  if (!parsed || typeof parsed !== 'object') return levels;
  for (const id of Object.keys(levels)) levels[id] = clampLevel((parsed as Record<string, unknown>)[id], levels[id]);
  return levels;
}

export function readLevels(): Levels {
  try { return parseLevels(localStorage.getItem(LEVELS_KEY)); } catch { return defaultLevels(); }
}
export function readVolume(): number {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved === null ? DEFAULT_VOLUME : clampLevel(Number(saved), DEFAULT_VOLUME);
  } catch { return DEFAULT_VOLUME; }
}
export function readMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
}
export function savePreferences(levels: Levels, volume: number, muted: boolean): void {
  try {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
    localStorage.setItem(VOLUME_KEY, String(volume));
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch { /* Private browsing may disable storage; the mixer still works. */ }
}
