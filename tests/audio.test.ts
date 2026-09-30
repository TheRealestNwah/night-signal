import { describe, expect, it } from 'vitest';
import { audioCorrection } from '../src/audioSync';
import { positionAt, type RoomState } from '../shared/protocol';

const room: RoomState = { id: 'test-room', scene: 'apartment', trackId: 'windowlight', playing: true, position: 12, anchorMs: 10000, revision: 1 };

describe('authoritative playback position', () => {
  it('places a late listener at the current shared position', () => {
    expect(positionAt(room, 24500)).toBe(26.5);
  });
  it('preserves paused positions and clamps completion and early clocks', () => {
    expect(positionAt({ ...room, playing: false }, 90000)).toBe(12);
    expect(positionAt(room, 999999)).toBe(90);
    expect(positionAt(room, 9000)).toBe(12);
  });
});

describe('local audio drift correction', () => {
  it('leaves imperceptible drift alone', () => {
    expect(audioCorrection(20, 20.1, true)).toEqual({ seekTo: null, playbackRate: 1 });
  });
  it('gently speeds up a lagging listener and slows down an early listener', () => {
    const behind = audioCorrection(20, 20.5, true);
    const ahead = audioCorrection(20.5, 20, true);
    expect(behind.seekTo).toBeNull();
    expect(behind.playbackRate).toBe(1.03);
    expect(ahead.seekTo).toBeNull();
    expect(ahead.playbackRate).toBe(0.97);
  });
  it('hard seeks beyond one second so a reconnect promptly catches up', () => {
    expect(audioCorrection(20, 35, true)).toEqual({ seekTo: 35, playbackRate: 1 });
    expect(audioCorrection(35, 20, true)).toEqual({ seekTo: 20, playbackRate: 1 });
    expect(audioCorrection(20, 21, true).seekTo).toBeNull();
  });
  it('aligns a paused listener exactly without changing playback speed', () => {
    expect(audioCorrection(20, 20.4, false)).toEqual({ seekTo: 20.4, playbackRate: 1 });
  });
  it('applies explicit seeks and newly received controls immediately', () => {
    expect(audioCorrection(20, 20.3, true, true)).toEqual({ seekTo: 20.3, playbackRate: 1 });
  });
  it('bounds invalid target positions', () => {
    expect(audioCorrection(20, -3, true).seekTo).toBe(0);
    expect(audioCorrection(20, Number.NaN, true).seekTo).toBe(0);
  });
});
