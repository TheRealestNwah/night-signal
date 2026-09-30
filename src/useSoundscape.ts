import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneInfo } from './scenes';
import { clampLevel, gainFor, readLevels, readMuted, readVolume, savePreferences, type Levels } from './mix';

export type SoundStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
const CROSSFADE_SECONDS = 1.2;
interface Voice { source: AudioBufferSourceNode; gain: GainNode }

/** Move a gain smoothly from wherever it currently is, even mid-fade. */
function glide(param: AudioParam, target: number, now: number, timeConstant: number) {
  const current = param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(current, now);
  param.setTargetAtTime(target, now, timeConstant);
}

/** No audio context or audio download exists until start() is called by a gesture. */
export function useSoundscape(scene: SceneInfo) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const transportRef = useRef<GainNode | null>(null);
  const buffersRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const voicesRef = useRef(new Map<string, Voice>());
  const generationRef = useRef(0);
  const pausedRef = useRef(false);
  const suspendTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sceneRef = useRef(scene);
  const [status, setStatus] = useState<SoundStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Levels>(readLevels);
  const [volume, updateVolume] = useState(readVolume);
  const [muted, setMuted] = useState(readMuted);
  const levelsRef = useRef(levels);

  const load = useCallback((context: AudioContext, url: string) => {
    let pending = buffersRef.current.get(url);
    if (!pending) {
      pending = fetch(url).then(response => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data));
      // A failed download must not be cached, or Retry audio could never succeed.
      pending.catch(() => buffersRef.current.delete(url));
      buffersRef.current.set(url, pending);
    }
    return pending;
  }, []);

  const release = useCallback((context: AudioContext) => {
    const now = context.currentTime;
    for (const voice of voicesRef.current.values()) {
      glide(voice.gain.gain, 0, now, CROSSFADE_SECONDS / 4);
      voice.source.stop(now + CROSSFADE_SECONDS * 1.5);
    }
    voicesRef.current = new Map();
  }, []);

  const playScene = useCallback(async (target: SceneInfo) => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;
    const generation = ++generationRef.current;
    setStatus('loading');
    setError(null);
    let buffers: AudioBuffer[];
    try {
      buffers = await Promise.all(target.layers.map(layer => load(context, layer.url)));
    } catch {
      if (generation !== generationRef.current || contextRef.current !== context) return;
      release(context);
      setError('This soundscape could not be loaded. Check your connection and choose Retry audio.');
      setStatus('error');
      return;
    }
    // A newer scene choice supersedes this one while it was downloading.
    if (generation !== generationRef.current || contextRef.current !== context) return;
    release(context);
    const now = context.currentTime;
    target.layers.forEach((layer, index) => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffers[index];
      source.loop = true;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gainFor(levelsRef.current[layer.id] ?? layer.defaultLevel), now + CROSSFADE_SECONDS);
      source.connect(gain).connect(master);
      source.start(now);
      voicesRef.current.set(layer.id, { source, gain });
    });
    setStatus(pausedRef.current ? 'paused' : 'playing');
  }, [load, release]);

  const start = useCallback(() => {
    let context = contextRef.current;
    if (!context) {
      try { context = new AudioContext(); } catch {
        setError('This browser could not start audio.');
        setStatus('error');
        return;
      }
      const master = context.createGain();
      const transport = context.createGain();
      master.gain.value = muted ? 0 : gainFor(volume);
      master.connect(transport).connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
      transportRef.current = transport;
    }
    clearTimeout(suspendTimerRef.current);
    pausedRef.current = false;
    // resume() is invoked synchronously during the user gesture.
    void context.resume();
    glide(transportRef.current!.gain, 1, context.currentTime, 0.1);
    void playScene(sceneRef.current);
  }, [muted, volume, playScene]);

  const toggle = useCallback(() => {
    const context = contextRef.current;
    const transport = transportRef.current;
    if (!context || !transport) return;
    clearTimeout(suspendTimerRef.current);
    if (pausedRef.current) {
      pausedRef.current = false;
      void context.resume();
      glide(transport.gain, 1, context.currentTime, 0.1);
      setStatus(current => current === 'paused' ? 'playing' : current);
    } else {
      pausedRef.current = true;
      glide(transport.gain, 0, context.currentTime, 0.08);
      // Let the fade finish before the clock stops.
      suspendTimerRef.current = setTimeout(() => { void context.suspend(); }, 450);
      setStatus(current => current === 'playing' ? 'paused' : current);
    }
  }, []);

  const setLevel = useCallback((id: string, value: number) => {
    const level = clampLevel(value, 0);
    levelsRef.current = { ...levelsRef.current, [id]: level };
    setLevels(levelsRef.current);
    const voice = voicesRef.current.get(id);
    if (voice && contextRef.current) glide(voice.gain.gain, gainFor(level), contextRef.current.currentTime, 0.03);
  }, []);

  const setVolume = useCallback((value: number) => updateVolume(current => clampLevel(value, current)), []);

  useEffect(() => {
    sceneRef.current = scene;
    if (contextRef.current) void playScene(scene);
  }, [scene, playScene]);

  useEffect(() => {
    const context = contextRef.current;
    if (context && masterRef.current) glide(masterRef.current.gain, muted ? 0 : gainFor(volume), context.currentTime, 0.03);
    savePreferences(levels, volume, muted);
  }, [levels, volume, muted]);

  useEffect(() => () => {
    generationRef.current++;
    clearTimeout(suspendTimerRef.current);
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close();
  }, []);

  return { start, toggle, status, error, levels, setLevel, volume, setVolume, muted, setMuted };
}
