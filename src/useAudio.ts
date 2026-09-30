import { useCallback, useEffect, useRef, useState } from 'react';
import { positionAt, trackFor, type RoomState, type TrackId } from '../shared/protocol';
import { audioCorrection } from './audioSync';

export type AudioStatus = 'disabled' | 'loading' | 'playing' | 'paused' | 'error';
const VOLUME_KEY = 'night-signal:volume';
const MUTE_KEY = 'night-signal:muted';

function readVolume() {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    const value = saved === null ? 0.65 : Number(saved);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.65;
  } catch { return 0.65; }
}
function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
}

/** No audio element or audio download exists until enable() is called by a gesture. */
export function useAudio(room: RoomState | null, serverNow: () => number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef(room);
  const serverNowRef = useRef(serverNow);
  const enabledRef = useRef(false);
  const failedRef = useRef(false);
  const trackRef = useRef<TrackId | null>(null);
  const revisionRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const pendingPlayRef = useRef<Promise<void> | null>(null);
  const syncRef = useRef<((force?: boolean) => void) | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<AudioStatus>('disabled');
  const [error, setError] = useState<string | null>(null);
  const [volume, updateVolume] = useState(readVolume);
  const [muted, setMuted] = useState(readMuted);
  const [currentTime, setCurrentTime] = useState(0);

  const fail = useCallback((message: string) => {
    failedRef.current = true;
    setError(message);
    setStatus('error');
  }, []);

  const tryPlay = useCallback((audio: HTMLAudioElement) => {
    if (pendingPlayRef.current || failedRef.current) return;
    const generation = generationRef.current;
    let promise: Promise<void>;
    try { promise = audio.play(); } catch {
      fail('Audio could not start. Choose Retry audio to try again.');
      return;
    }
    pendingPlayRef.current = promise;
    void promise.then(() => {
      if (audio !== audioRef.current || generation !== generationRef.current) return;
      if (!roomRef.current?.playing) { audio.pause(); setStatus('paused'); }
      else { setStatus('playing'); setError(null); }
    }).catch((reason: unknown) => {
      if (audio !== audioRef.current || generation !== generationRef.current) return;
      // A new source or a remote pause can interrupt a pending play normally.
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      fail(reason instanceof DOMException && reason.name === 'NotAllowedError'
        ? 'Your browser needs another tap to start audio. Choose Retry audio.'
        : 'This audio could not play. Check your connection and choose Retry audio.');
    }).finally(() => {
      if (pendingPlayRef.current === promise) pendingPlayRef.current = null;
    });
  }, [fail]);

  const synchronize = useCallback((force = false) => {
    const shared = roomRef.current;
    const audio = audioRef.current;
    if (!shared) {
      audio?.pause();
      setCurrentTime(0);
      if (enabledRef.current) setStatus('paused');
      return;
    }
    const target = positionAt(shared, serverNowRef.current());
    if (!audio || !enabledRef.current) { setCurrentTime(target); return; }
    if (failedRef.current) return;
    const track = trackFor(shared.trackId);
    const changedTrack = trackRef.current !== shared.trackId;
    if (changedTrack) {
      generationRef.current++;
      pendingPlayRef.current = null;
      audio.pause();
      trackRef.current = shared.trackId;
      revisionRef.current = null;
      audio.src = track.url;
      audio.load();
      setStatus('loading');
    }
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      const correction = audioCorrection(audio.currentTime, target, shared.playing,
        force || changedTrack || revisionRef.current !== shared.revision);
      if (correction.seekTo !== null) {
        try { audio.currentTime = Math.min(correction.seekTo, Number.isFinite(audio.duration) ? audio.duration : track.duration); }
        catch { /* Metadata can be invalidated by a simultaneous source change. */ }
      }
      audio.playbackRate = correction.playbackRate;
      revisionRef.current = shared.revision;
    }
    if (!shared.playing || target >= track.duration) {
      audio.pause();
      audio.playbackRate = 1;
      setStatus('paused');
    } else if (audio.paused) {
      setStatus('loading');
      tryPlay(audio);
    }
    setCurrentTime(audio.readyState >= HTMLMediaElement.HAVE_METADATA ? audio.currentTime : target);
  }, [tryPlay]);

  const enable = useCallback(async () => {
    enabledRef.current = true;
    setEnabled(true);
    setError(null);
    const hadFailure = failedRef.current;
    failedRef.current = false;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
      audio.preload = 'auto';
      audio.volume = volume;
      audio.muted = muted;
      audio.onloadedmetadata = () => syncRef.current?.(true);
      audio.oncanplay = () => syncRef.current?.();
      audio.onplaying = () => { if (!failedRef.current) setStatus('playing'); };
      audio.onwaiting = () => { if (!failedRef.current) setStatus('loading'); };
      audio.onended = () => { setStatus('paused'); setCurrentTime(audio!.duration); };
      audio.onerror = () => fail('The audio file could not be loaded. Check your connection and choose Retry audio.');
    } else if (hadFailure || audio.error) {
      generationRef.current++;
      pendingPlayRef.current = null;
      audio.load();
    }
    // play() is invoked synchronously during this user gesture when the room is playing.
    synchronize(true);
  }, [volume, muted, fail, synchronize]);

  const setVolume = useCallback((value: number) => {
    if (Number.isFinite(value)) updateVolume(Math.max(0, Math.min(1, value)));
  }, []);

  useEffect(() => {
    roomRef.current = room;
    serverNowRef.current = serverNow;
    syncRef.current = synchronize;
    synchronize();
  }, [room, serverNow, synchronize]);

  useEffect(() => {
    const interval = setInterval(() => synchronize(), 300);
    function visible() { if (document.visibilityState === 'visible') synchronize(true); }
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [synchronize]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch { /* Private browsing may disable storage. */ }
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try { localStorage.setItem(MUTE_KEY, String(muted)); } catch { /* Keep local controls usable without storage. */ }
  }, [muted]);

  useEffect(() => () => {
    generationRef.current++;
    const audio = audioRef.current;
    audioRef.current = null;
    pendingPlayRef.current = null;
    if (!audio) return;
    audio.onloadedmetadata = null;
    audio.oncanplay = null;
    audio.onplaying = null;
    audio.onwaiting = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, []);

  return { enable, enabled, status, error, volume, setVolume, muted, setMuted, currentTime, audioRef };
}
