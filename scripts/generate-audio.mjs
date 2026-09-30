/**
 * Night Signal synthetic demo soundscapes.
 * Original procedural synthesis: no recordings, samples, or external assets.
 * Run `npm run audio:generate` to reproduce the checked-in 90-second PCM WAVs.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const sampleRate = 22050;
const duration = 90;
const frames = sampleRate * duration;
const twoPi = Math.PI * 2;
const output = new URL('../public/audio/', import.meta.url);
const midi = note => 440 * 2 ** ((note - 69) / 12);
const ease = value => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, value)))) / 2;

function randomSource(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296 * 2 - 1;
  };
}

function pad(t, progression, strength = 1) {
  let value = 0;
  for (let index = Math.max(0, Math.floor(t / 15) - 1); index <= Math.floor(t / 15); index++) {
    const age = t - index * 15;
    const envelope = ease(age / 4) * (1 - ease((age - 14) / 5));
    if (envelope <= 0) continue;
    for (const [voice, note] of progression[index % progression.length].entries()) {
      const frequency = midi(note);
      const phase = voice * 0.71;
      const softSine = Math.sin(twoPi * frequency * t + phase);
      const detuned = Math.sin(twoPi * frequency * 1.0016 * t + phase);
      const overtone = Math.sin(twoPi * frequency * 2 * t + phase) * 0.10;
      value += (softSine + detuned + overtone) * envelope * 0.022 * strength;
    }
  }
  return value;
}

function bell(t, note, start, strength = 1) {
  const age = t - start;
  if (age < 0 || age > 9) return 0;
  const frequency = midi(note);
  const envelope = ease(age / 0.08) * Math.exp(-age / 2.2) * (1 - ease((age - 7) / 2));
  return strength * envelope * (Math.sin(twoPi * frequency * age) * 0.07
    + Math.sin(twoPi * frequency * 2 * age) * 0.018
    + Math.sin(twoPi * frequency * 3 * age) * 0.006);
}

const soundscapes = [
  {
    id: 'windowlight', seed: 104729, peakLevel: 0.28,
    chords: [[45, 52, 59, 64], [41, 48, 55, 60], [48, 55, 62, 67], [43, 50, 57, 62]],
    sample(t, _white, low, slow) {
      // The window muffles the rain: no direct white-noise hiss, and the
      // filtered texture sits well behind the slowly overlapping soft tones.
      const rain = low * 0.02 * (0.95 + 0.05 * Math.sin(t * 0.22));
      return rain + slow * 0.015 + pad(t, this.chords, 0.85);
    },
  },
  {
    id: 'last-exit', seed: 130363,
    chords: [[40, 47, 54, 59], [43, 50, 57, 62], [38, 45, 52, 57], [45, 52, 59, 64]],
    sample(t, white, low, slow) {
      // A low road texture with a rounded pulse and distant sine melody.
      const motion = (0.5 + 0.5 * Math.sin(twoPi * t / 1.5)) ** 3;
      const pulse = Math.sin(twoPi * midi(40) * t) * motion * 0.025;
      const phrase = [71, 66, 64, 62, 66, 69];
      const beat = Math.floor(t / 7.5);
      let melody = 0;
      for (let index = Math.max(0, beat - 1); index <= beat; index++) {
        melody += bell(t, phrase[index % phrase.length], index * 7.5 + 1.5, 0.25);
      }
      return pad(t, this.chords, 1.05) + pulse + melody + slow * 0.15 + low * 0.08 + white * 0.005;
    },
  },
  {
    id: 'afterimage', seed: 155921,
    chords: [[48, 55, 62, 67], [45, 52, 59, 64], [41, 48, 55, 60], [43, 50, 57, 62]],
    sample(t, white, low, slow) {
      // Quiet arcade-like chimes: no game audio or recognizable game melody.
      const notes = [79, 74, 76, 71, 74, 67, 76, 72, 79, 74, 69, 72];
      const event = Math.floor(t / 3.75);
      let chimes = 0;
      for (let index = Math.max(0, event - 3); index <= event; index++) {
        chimes += bell(t, notes[index % notes.length], index * 3.75 + 0.8, 0.55);
        chimes += bell(t, notes[index % notes.length] - 12, index * 3.75 + 1.18, 0.15);
      }
      return pad(t, this.chords, 0.7) + chimes + slow * 0.045 + low * 0.018 + white * 0.002;
    },
  },
];

function wav(samples, gain) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let index = 0; index < samples.length; index++) {
    buffer.writeInt16LE(Math.round(samples[index] * gain * 32767), 44 + index * 2);
  }
  return buffer;
}

await mkdir(output, { recursive: true });
for (const soundscape of soundscapes) {
  const random = randomSource(soundscape.seed);
  const samples = new Float64Array(frames);
  let low = 0;
  let slow = 0;
  let peak = 0;
  for (let index = 0; index < frames; index++) {
    const t = index / sampleRate;
    const white = random();
    low += (white - low) * 0.12;
    slow += (white - slow) * 0.009;
    const fade = ease(t / 2.5) * ease((duration - 1 / sampleRate - t) / 4);
    const value = soundscape.sample(t, white, low, slow) * fade;
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  // Consistent headroom; never clip. Playback volume remains a local preference.
  const peakLevel = soundscape.peakLevel ?? 0.58;
  const gain = peakLevel / Math.max(peak, 0.0001);
  const buffer = wav(samples, gain);
  await writeFile(new URL(`${soundscape.id}.wav`, output), buffer);
  console.log(`${soundscape.id}.wav: ${duration}s, mono ${sampleRate}Hz/16-bit, ${buffer.length} bytes, peak ${(20 * Math.log10(peakLevel)).toFixed(1)} dBFS`);
}
