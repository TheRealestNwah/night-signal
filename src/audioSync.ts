/** Ignore tiny differences, gently correct ordinary drift, and seek on larger jumps. */
export function audioCorrection(current: number, target: number, playing: boolean, force = false) {
  const safeTarget = Math.max(0, Number.isFinite(target) ? target : 0);
  const drift = safeTarget - (Number.isFinite(current) ? current : 0);
  if (force || Math.abs(drift) > 1 || (!playing && Math.abs(drift) > 0.04)) {
    return { seekTo: safeTarget, playbackRate: 1 };
  }
  return {
    seekTo: null,
    playbackRate: playing && Math.abs(drift) > 0.15 ? 1 + Math.max(-0.03, Math.min(0.03, drift * 0.08)) : 1,
  };
}
