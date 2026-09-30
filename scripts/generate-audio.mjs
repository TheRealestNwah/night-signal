/**
 * Night Signal soundscape layers.
 * Original procedural synthesis: no recordings, samples, or external assets.
 * Run `npm run audio:generate` to reproduce the checked-in looping PCM WAVs.
 *
 * Every layer is rendered slightly past its loop length, then the overhang is
 * folded back onto the beginning, so decays and noise beds wrap seamlessly.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const sampleRate = 22050;
const twoPi = Math.PI * 2;
const output = new URL('../public/audio/', import.meta.url);
const midi = note => 440 * 2 ** ((note - 69) / 12);
const ease = value => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, value)))) / 2;

function randomSource(seed) {
  let state = seed >>> 0;
  const signed = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296 * 2 - 1;
  };
  signed.between = (low, high) => low + (signed() + 1) / 2 * (high - low);
  return signed;
}

function lowpass(cutoff) {
  const amount = 1 - Math.exp(-twoPi * cutoff / sampleRate);
  let value = 0;
  return input => (value += amount * (input - value));
}

/** Render `seconds` of loop plus `tail` seconds of overhang, then fold the overhang in. */
function render(seconds, tail, build) {
  const loop = Math.round(seconds * sampleRate);
  const mix = new Float64Array(loop + Math.round(tail * sampleRate));
  build(mix, { loop, seconds });
  for (let index = loop; index < mix.length; index++) mix[index - loop] += mix[index];
  return mix.slice(0, loop);
}

/** Add a finite sound. `voice(age)` must start and end at silence. */
function addEvent(mix, start, length, voice) {
  const first = Math.round(start * sampleRate);
  const count = Math.min(Math.round(length * sampleRate), mix.length - first);
  for (let index = 0; index < count; index++) mix[first + index] += voice(index / sampleRate);
}

/** Add continuous noise, equal-power crossfaded across the loop point. */
function addBed(mix, frame, random, shape) {
  const fade = Math.min(mix.length - frame.loop, 4 * sampleRate);
  for (let index = 0; index < frame.loop + fade; index++) {
    const window = index < fade ? Math.sin(Math.PI / 2 * index / fade)
      : index < frame.loop ? 1 : Math.cos(Math.PI / 2 * (index - frame.loop) / fade);
    mix[index] += shape(random(), index / sampleRate) * window;
  }
}

/** A slow swell that repeats exactly once per `cycles` within the loop. */
const drift = (frame, t, cycles, phase = 0) => Math.sin(twoPi * cycles * t / frame.seconds + phase);

function addPad(mix, start, notes, strength) {
  addEvent(mix, start, 19, age => {
    const envelope = ease(age / 4) * (1 - ease((age - 14) / 5));
    let value = 0;
    for (const [voice, note] of notes.entries()) {
      const frequency = midi(note);
      const phase = voice * 0.71;
      value += Math.sin(twoPi * frequency * age + phase)
        + Math.sin(twoPi * frequency * 1.0016 * age + phase)
        + Math.sin(twoPi * frequency * 2 * age + phase) * 0.10;
    }
    return value * envelope * 0.022 * strength;
  });
}

function addBell(mix, start, note, strength) {
  const frequency = midi(note);
  addEvent(mix, start, 9, age => strength * ease(age / 0.08) * Math.exp(-age / 2.2) * (1 - ease((age - 7) / 2))
    * (Math.sin(twoPi * frequency * age) * 0.07
      + Math.sin(twoPi * frequency * 2 * age) * 0.018
      + Math.sin(twoPi * frequency * 3 * age) * 0.006));
}

/** Electric-piano note: a sine body with a fading bell-like overtone and gentle tremolo. */
function addKeys(mix, start, note, length, strength) {
  const frequency = midi(note);
  addEvent(mix, start, length + 0.4, age => {
    const envelope = Math.min(1, age / 0.008) * Math.exp(-age / 1.7) * (1 - ease((age - length) / 0.4));
    return strength * envelope * (1 + 0.07 * Math.sin(twoPi * 4.3 * age)) * (Math.sin(twoPi * frequency * age)
      + Math.sin(twoPi * frequency * 2 * age) * 0.32 * Math.exp(-age / 0.5)
      + Math.sin(twoPi * frequency * 5 * age) * 0.10 * Math.exp(-age / 0.09));
  });
}

function addBass(mix, start, note, length, strength) {
  const frequency = midi(note);
  addEvent(mix, start, length + 0.2, age =>
    (Math.sin(twoPi * frequency * age) + Math.sin(twoPi * frequency * 2 * age) * 0.18) * strength
      * Math.min(1, age / 0.012) * Math.exp(-age / 0.8) * (1 - ease((age - length) / 0.2)));
}

function addNoiseSwell(mix, start, length, random, cutoff, strength, envelope) {
  const filter = lowpass(cutoff);
  const smooth = lowpass(cutoff);
  addEvent(mix, start, length, age => smooth(filter(random())) * envelope(age) * strength);
}

const layers = [
  {
    id: 'apartment-rain', seed: 104729, rms: 0.10,
    build(random) {
      return render(48, 10, (mix, frame) => {
        // Rain heard through glass: a muffled wash, never raw white noise.
        const body = lowpass(1500), bodySmooth = lowpass(2600), bodyFloor = lowpass(220), far = lowpass(380);
        addBed(mix, frame, random, (white, t) => {
          const band = bodySmooth(body(white));
          const swell = 1 + 0.12 * drift(frame, t, 2) + 0.06 * drift(frame, t, 5, 1.3);
          return ((band - bodyFloor(band)) * 0.11 + far(white) * 0.16) * swell;
        });
        // Individual drops ticking on the window.
        for (let count = Math.round(frame.seconds * 14); count > 0; count--) {
          const frequency = 1700 + 3400 * random.between(0, 1) ** 2;
          const decay = random.between(0.004, 0.012);
          const strength = 0.025 + 0.085 * random.between(0, 1) ** 3;
          addEvent(mix, random.between(0, frame.seconds), decay * 7, age =>
            Math.sin(twoPi * frequency * age) * Math.exp(-age / decay) * (1 - ease(age / (decay * 7))) * strength);
        }
        // Heavier drips from the sill, each with a small downward chirp.
        for (let count = Math.round(frame.seconds * 0.7); count > 0; count--) {
          const frequency = random.between(480, 1050);
          const decay = random.between(0.03, 0.06);
          const strength = random.between(0.05, 0.11);
          addEvent(mix, random.between(0, frame.seconds), decay * 6, age => {
            const phase = twoPi * frequency * (age + 0.4 * 0.012 * (1 - Math.exp(-age / 0.012)));
            return Math.sin(phase) * Math.min(1, age / 0.002) * Math.exp(-age / decay) * (1 - ease(age / (decay * 6))) * strength;
          });
        }
        // Two far-off rolls of thunder, more felt than heard.
        for (const start of [11, 33]) {
          addNoiseSwell(mix, start, 9, random, 95, 0.55, age => ease(age / 1.6) * Math.exp(-age / 2.6) * (1 - ease((age - 6) / 3)));
        }
      });
    },
  },
  {
    id: 'apartment-lofi', seed: 611953, rms: 0.13, warmth: 3200,
    build(random) {
      const beat = 60 / 70;
      const bars = 16;
      // 0-based beats within a bar; off-beat eighths are played late for swing.
      const at = (bar, position) => (bar * 4 + Math.floor(position) + (position % 1 ? 0.58 : 0)) * beat;
      const chords = [
        { keys: [50, 53, 57, 60, 64], bass: 38 }, // Dm9
        { keys: [53, 57, 59, 64], bass: 43 },     // G13
        { keys: [52, 55, 59, 62], bass: 36 },     // Cmaj9
        { keys: [55, 59, 60, 64], bass: 45 },     // Am9
      ];
      const motif = [
        [[1.5, 76], [2.5, 74], [3, 69]],
        [[0.5, 71], [2, 69]],
        [[1, 67], [1.5, 76], [3.5, 74]],
        [[0, 72]],
      ];
      return render(bars * 4 * beat, 4, (mix, frame) => {
        for (let bar = 0; bar < bars; bar++) {
          const chord = chords[bar % 4];
          const cycle = Math.floor(bar / 4);
          // Electric-piano chord, lightly strummed, with a softer answer.
          for (const [voice, note] of chord.keys.entries()) {
            addKeys(mix, at(bar, 0) + voice * 0.014, note, 3.1 * beat, 0.05);
            addKeys(mix, at(bar, 2.5) + voice * 0.01, note, 1.2 * beat, 0.026);
          }
          for (const [position, length, strength] of [[0, 1.5, 0.17], [2.5, 0.8, 0.11]]) addBass(mix, at(bar, position), chord.bass, length * beat, strength);
          // Soft kick, brushed snare, and barely-there hats.
          for (const position of bar % 4 === 3 ? [0, 2, 3.5] : [0, 2]) {
            addEvent(mix, at(bar, position), 0.6, age =>
              Math.sin(twoPi * (46 * age + 66 * 0.035 * (1 - Math.exp(-age / 0.035)))) * Math.exp(-age / 0.15) * (1 - ease(age / 0.6)) * 0.30);
          }
          for (const position of [1, 3]) {
            addNoiseSwell(mix, at(bar, position), 0.4, random, 2400, 0.20, age => Math.min(1, age / 0.003) * Math.exp(-age / 0.075) * (1 - ease(age / 0.4)));
            addEvent(mix, at(bar, position), 0.3, age => Math.sin(twoPi * 185 * age) * Math.exp(-age / 0.05) * (1 - ease(age / 0.3)) * 0.06);
          }
          for (let eighth = 0; eighth < 8; eighth++) {
            const floor = lowpass(4500);
            const strength = eighth % 2 ? 0.035 : 0.02;
            addEvent(mix, at(bar, eighth / 2), 0.12, age => {
              const white = random();
              return (white - floor(white)) * Math.min(1, age / 0.001) * Math.exp(-age / 0.02) * (1 - ease(age / 0.12)) * strength;
            });
          }
          // A sparse melody that rests every other phrase.
          const phrase = cycle === 1 ? (bar % 2 ? [] : motif[bar % 4].slice(0, 1)) : motif[bar % 4];
          for (const [position, note] of phrase) {
            const frequency = midi(cycle === 3 && bar % 4 === 3 ? note - 3 : note);
            addEvent(mix, at(bar, position), 2.6, age =>
              (Math.sin(twoPi * frequency * age) + Math.sin(twoPi * frequency * 2 * age) * 0.2 * Math.exp(-age / 0.3))
                * Math.min(1, age / 0.01) * Math.exp(-age / 0.85) * (1 - ease((age - 1.6) / 1)) * 0.06);
          }
        }
        // Record-player surface: faint hiss and scattered crackle.
        const hiss = lowpass(3000);
        addBed(mix, frame, random, white => hiss(white) * 0.006);
        for (let count = Math.round(frame.seconds * 5); count > 0; count--) {
          const strength = 0.012 + 0.05 * random.between(0, 1) ** 4;
          addEvent(mix, random.between(0, frame.seconds), 0.004, age => Math.exp(-age / 0.0004) * (1 - ease(age / 0.004)) * strength);
        }
      });
    },
  },
  {
    id: 'highway-road', seed: 130363, rms: 0.10,
    build(random) {
      return render(48, 8, (mix, frame) => {
        // Cabin rumble with a quieter band of tyre noise above it.
        const rumble = lowpass(150), rumbleSmooth = lowpass(150), tyre = lowpass(750), tyreFloor = lowpass(220);
        addBed(mix, frame, random, (white, t) => {
          const band = tyre(white);
          return rumbleSmooth(rumble(white)) * 1.5 * (1 + 0.10 * drift(frame, t, 3))
            + (band - tyreFloor(band)) * 0.10 * (1 + 0.15 * drift(frame, t, 4, 0.8));
        });
        // Engine drone: whole-number frequencies repeat exactly within the loop.
        addEvent(mix, 0, frame.seconds, age => (Math.sin(twoPi * 55 * age) * 0.030 + Math.sin(twoPi * 110 * age) * 0.011) * (1 + 0.2 * drift(frame, age, 2, 2)));
        // Expansion joints: a paired soft thump every six seconds.
        for (let start = 2; start < frame.seconds; start += 6) {
          for (const offset of [0, 0.17]) {
            addEvent(mix, start + offset, 0.5, age => Math.sin(twoPi * 68 * age) * Math.min(1, age / 0.004) * Math.exp(-age / 0.07) * (1 - ease(age / 0.5)) * 0.10);
          }
        }
        // Traffic passing on the far side.
        for (const start of [14, 37]) {
          addNoiseSwell(mix, start, 7, random, 900, 0.14, age => Math.exp(-(((age - 3.5) / 1.3) ** 2)) * ease(age / 1) * (1 - ease((age - 6) / 1)));
        }
      });
    },
  },
  {
    id: 'highway-synth', seed: 281557, rms: 0.12,
    build() {
      const chords = [[40, 47, 54, 59], [43, 50, 57, 62], [38, 45, 52, 57], [45, 52, 59, 64]];
      const phrase = [71, 66, 64, 62, 66, 69, 64, 66];
      return render(60, 20, mix => {
        for (const [index, chord] of chords.entries()) addPad(mix, index * 15, chord, 1.05);
        for (const [index, note] of phrase.entries()) addBell(mix, index * 7.5 + 1.5, note, 0.25);
        // A rounded low pulse, like lane markers going by.
        for (let start = 0; start < 60; start += 1.5) {
          addEvent(mix, start, 1.5, age => Math.sin(twoPi * midi(40) * age) * Math.sin(Math.PI * age / 1.5) ** 3 * 0.025);
        }
      });
    },
  },
  {
    id: 'arcade-hum', seed: 155921, rms: 0.08,
    build(random) {
      return render(48, 6, (mix, frame) => {
        // Ventilation and the electrical hum of machines left on overnight.
        const air = lowpass(520), airSmooth = lowpass(900), airFloor = lowpass(90);
        addBed(mix, frame, random, (white, t) => {
          const band = airSmooth(air(white));
          return (band - airFloor(band)) * 0.13 * (1 + 0.08 * drift(frame, t, 3));
        });
        addEvent(mix, 0, frame.seconds, age => Math.sin(twoPi * 60 * age) * 0.020 + Math.sin(twoPi * 120 * age) * 0.011 + Math.sin(twoPi * 180 * age) * 0.004);
        // A cabinet somewhere across the room runs its attract mode.
        for (let start = random.between(2, 5); start < frame.seconds - 1; start += random.between(4, 9)) {
          const root = 72 + Math.round(random.between(0, 7));
          const steps = 2 + Math.round(random.between(0, 2));
          for (let step = 0; step < steps; step++) {
            const frequency = midi(root + [0, 4, 7, 12][step]);
            addEvent(mix, start + step * 0.13, 0.5, age =>
              Math.sin(twoPi * frequency * age) * Math.min(1, age / 0.006) * Math.exp(-age / 0.11) * (1 - ease(age / 0.5)) * 0.016);
          }
        }
      });
    },
  },
  {
    id: 'arcade-chimes', seed: 373987, rms: 0.12,
    build() {
      const chords = [[48, 55, 62, 67], [45, 52, 59, 64], [41, 48, 55, 60], [43, 50, 57, 62]];
      // Quiet arcade-like chimes: no game audio or recognizable game melody.
      const notes = [79, 74, 76, 71, 74, 67, 76, 72, 79, 74, 69, 72, 76, 71, 74, 67];
      return render(60, 20, mix => {
        for (const [index, chord] of chords.entries()) addPad(mix, index * 15, chord, 0.7);
        for (const [index, note] of notes.entries()) {
          addBell(mix, index * 3.75 + 0.8, note, 0.55);
          addBell(mix, index * 3.75 + 1.18, note - 12, 0.15);
        }
      });
    },
  },
  {
    id: 'train-rails', seed: 192161, rms: 0.10,
    build(random) {
      return render(48, 6, (mix, frame) => {
        // Carriage rumble with a soft band of wheel noise, swaying slowly.
        const rumble = lowpass(120), rumbleSmooth = lowpass(120), wheel = lowpass(600), wheelFloor = lowpass(180);
        addBed(mix, frame, random, (white, t) => {
          const band = wheel(white);
          return rumbleSmooth(rumble(white)) * 1.4 * (1 + 0.12 * drift(frame, t, 4))
            + (band - wheelFloor(band)) * 0.08 * (1 + 0.2 * drift(frame, t, 6, 0.5));
        });
        // Wheels over rail joints: two bogies of two axles, once per carriage length.
        for (let start = 0.3; start < frame.seconds; start += 1.6) {
          for (const [offset, strength] of [[0, 0.09], [0.13, 0.07], [0.62, 0.08], [0.75, 0.06]]) {
            addEvent(mix, start + offset, 0.4, age => (Math.sin(twoPi * 92 * age) + Math.sin(twoPi * 184 * age) * 0.2)
              * Math.min(1, age / 0.003) * Math.exp(-age / 0.05) * (1 - ease(age / 0.4)) * strength);
            addNoiseSwell(mix, start + offset, 0.15, random, 1400, strength * 0.5, age => Math.min(1, age / 0.002) * Math.exp(-age / 0.02) * (1 - ease(age / 0.15)));
          }
        }
        // A horn, once, far down the line.
        addEvent(mix, 29, 5, age => (Math.sin(twoPi * midi(63) * age) + Math.sin(twoPi * midi(66) * age)
          + (Math.sin(twoPi * midi(63) * 2 * age) + Math.sin(twoPi * midi(66) * 2 * age)) * 0.25)
          * ease(age / 0.6) * (1 - ease((age - 3.4) / 1.4)) * 0.012);
      });
    },
  },
  {
    id: 'train-keys', seed: 502133, rms: 0.12, warmth: 2800,
    build() {
      const beat = 60 / 64;
      const bars = 16;
      const at = (bar, position) => (bar * 4 + position) * beat;
      const chords = [
        { keys: [57, 60, 64, 67], bass: 41 }, // Fmaj9
        { keys: [55, 59, 62, 64], bass: 40 }, // Em7
        { keys: [53, 57, 60, 64], bass: 38 }, // Dm9
        { keys: [53, 57, 59, 64], bass: 43 }, // G13
      ];
      const melody = [[[2, 72], [3, 71]], [[0, 67], [2.5, 69]], [[1, 72], [2, 74]], [[0.5, 71], [2, 67]]];
      return render(bars * 4 * beat, 5, mix => {
        for (let bar = 0; bar < bars; bar++) {
          const chord = chords[bar % 4];
          const cycle = Math.floor(bar / 4);
          // Slow, rolled Rhodes chords; every other pass answers on beat three.
          for (const [voice, note] of chord.keys.entries()) {
            addKeys(mix, at(bar, 0) + voice * 0.02, note, 3.4 * beat, 0.045);
            if (cycle % 2) addKeys(mix, at(bar, 2) + voice * 0.015, note, 1.6 * beat, 0.02);
          }
          addBass(mix, at(bar, 0), chord.bass, 2.5 * beat, 0.15);
          addBass(mix, at(bar, 3), chord.bass + 7, 0.8 * beat, 0.07);
          // The melody sits out the first pass.
          if (cycle) for (const [position, note] of melody[bar % 4]) addKeys(mix, at(bar, position), cycle === 3 && bar % 4 === 3 ? note - 2 : note, 1.5 * beat, 0.03);
        }
      });
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
for (const layer of layers) {
  const samples = layer.build(randomSource(layer.seed));
  if (layer.warmth) {
    // Roll off the top end; warm the filter on the loop's end so the seam stays smooth.
    const filter = lowpass(layer.warmth);
    for (let index = samples.length - 4096; index < samples.length; index++) filter(samples[index]);
    for (let index = 0; index < samples.length; index++) samples[index] = filter(samples[index]);
  }
  let peak = 0;
  let power = 0;
  for (const value of samples) {
    peak = Math.max(peak, Math.abs(value));
    power += value * value;
  }
  // Match loudness across layers, but never clip. Volume stays a listener preference.
  const gain = Math.min(layer.rms / Math.sqrt(power / samples.length), 0.89 / peak);
  const buffer = wav(samples, gain);
  await writeFile(new URL(`${layer.id}.wav`, output), buffer);
  console.log(`${layer.id}.wav: ${(samples.length / sampleRate).toFixed(2)}s loop, mono ${sampleRate}Hz/16-bit, ${buffer.length} bytes, peak ${(20 * Math.log10(peak * gain)).toFixed(1)} dBFS`);
}
