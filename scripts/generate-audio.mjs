/**
 * Night Signal soundscape layers.
 * Original procedural synthesis: no recordings, samples, or external assets.
 * Run `npm run audio:generate` to reproduce the checked-in looping PCM WAVs.
 * Layers made from licensed recordings (see docs/ASSETS.md) are not generated here.
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

/** Felt piano note: a soft hammer and quickly darkening overtones. */
function addFelt(mix, start, note, length, strength) {
  const frequency = midi(note);
  addEvent(mix, start, length + 0.6, age => strength * Math.min(1, age / 0.012) * Math.exp(-age / 2.2) * (1 - ease((age - length) / 0.6))
    * (Math.sin(twoPi * frequency * age) * 0.7 + Math.sin(twoPi * frequency * 1.0012 * age) * 0.3
      + Math.sin(twoPi * frequency * 2 * age) * 0.35 * Math.exp(-age / 0.8)
      + Math.sin(twoPi * frequency * 3 * age) * 0.12 * Math.exp(-age / 0.4)));
}

/** Two-pole band-pass whose centre can move every sample: tuned, ringing or whistling noise. */
function resonator(q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (input, frequency) => {
    const w = twoPi * frequency / sampleRate;
    const alpha = Math.sin(w) / (2 * q);
    const y = (alpha * input - alpha * x2 + 2 * Math.cos(w) * y1 - (1 - alpha) * y2) / (1 + alpha);
    x2 = x1; x1 = input; y2 = y1; y1 = y;
    return y;
  };
}

function addNoiseSwell(mix, start, length, random, cutoff, strength, envelope) {
  const filter = lowpass(cutoff);
  const smooth = lowpass(cutoff);
  addEvent(mix, start, length, age => smooth(filter(random())) * envelope(age) * strength);
}

const layers = [
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
    build() {
      // Neon signs: the buzz of gas tubes on mains power, 120 Hz and its harmonics. Whole cycles per loop keep the seam clean.
      const flickers = [[7.4, 0.08], [7.6, 0.12], [22.9, 0.1], [36.2, 0.07], [36.35, 0.1], [36.6, 0.06]];
      return render(48, 2, (mix, frame) => {
        addEvent(mix, 0, frame.seconds, age => {
          // One sign stutters now and then, dipping for a moment.
          let dip = 1;
          for (const [at, length] of flickers) dip *= 1 - 0.7 * Math.exp(-(((age - at - length / 2) / (length / 2)) ** 4));
          let near = 0, far = 0;
          for (let harmonic = 1; harmonic <= 12; harmonic++) {
            near += Math.sin(twoPi * 120 * harmonic * age + harmonic * 0.9) / harmonic ** 1.3;
            far += Math.sin(twoPi * 120 * harmonic * age + harmonic * 2.3) / harmonic ** 1.9;
          }
          const transformer = Math.sin(twoPi * 60 * age) + Math.sin(twoPi * 180 * age) * 0.4 + Math.sin(twoPi * 300 * age) * 0.15;
          return near * 0.02 * dip * (1 + 0.08 * drift(frame, age, 3)) + far * 0.014 * (1 + 0.1 * drift(frame, age, 5, 1.7)) + transformer * 0.008;
        });
        // The faint tick of the tube catching again after each flicker.
        for (const [at, length] of flickers) {
          addEvent(mix, at + length, 0.05, age => Math.sin(twoPi * 1400 * age) * Math.min(1, age / 0.0008) * Math.exp(-age / 0.006) * (1 - ease(age / 0.05)) * 0.02);
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
  {
    id: 'cabin-fire', seed: 725293, rms: 0.10,
    build(random) {
      return render(48, 6, (mix, frame) => {
        // The fire breathing low, with a faint hiss of flame.
        const roar = lowpass(260), roarSmooth = lowpass(260), hiss = resonator(1.2);
        addBed(mix, frame, random, (white, t) => roarSmooth(roar(white)) * 0.25 * (1 + 0.3 * drift(frame, t, 7))
          + hiss(white, 1800) * 0.008);
        // Wind whistling through a gap in the logs: a narrow, slowly gliding tone rather than a roar.
        const whistle = resonator(14);
        addBed(mix, frame, random, (white, t) => {
          const gust = Math.max(0, 0.4 + 0.6 * drift(frame, t, 3, 0.4) + 0.3 * drift(frame, t, 5, 2.1));
          return whistle(white, 520 + 90 * drift(frame, t, 2, 1) + 40 * drift(frame, t, 7)) * 0.5 * gust * gust;
        });
        // Crackle: many soft ticks, a few louder, never sharp clicks.
        for (let count = Math.round(frame.seconds * 14); count > 0; count--) {
          const frequency = random.between(1000, 3200);
          const decay = random.between(0.001, 0.004);
          const strength = 0.015 + 0.06 * random.between(0, 1) ** 4;
          addEvent(mix, random.between(0, frame.seconds), decay * 8, age =>
            Math.sin(twoPi * frequency * age) * Math.min(1, age / 0.0007) * Math.exp(-age / decay) * (1 - ease(age / (decay * 8))) * strength);
        }
        // Pops from knots in the wood.
        for (let count = Math.round(frame.seconds * 0.6); count > 0; count--) {
          const frequency = random.between(500, 1100);
          const start = random.between(0, frame.seconds);
          addEvent(mix, start, 0.1, age =>
            Math.sin(twoPi * frequency * age) * Math.min(1, age / 0.002) * Math.exp(-age / 0.015) * (1 - ease(age / 0.1)) * 0.06);
          addNoiseSwell(mix, start, 0.08, random, 2500, 0.05, age => Math.min(1, age / 0.001) * Math.exp(-age / 0.01) * (1 - ease(age / 0.08)));
        }
        // Logs settling, twice.
        for (const start of [17, 38]) {
          addNoiseSwell(mix, start, 2, random, 150, 0.3, age => ease(age / 0.05) * Math.exp(-age / 0.3) * (1 - ease((age - 1.4) / 0.6)));
        }
      });
    },
  },
  {
    id: 'cabin-piano', seed: 810419, rms: 0.12, warmth: 2200,
    build() {
      const beat = 1;
      const bars = 16;
      const at = (bar, position) => (bar * 4 + position) * beat;
      const chords = [
        { notes: [50, 57, 61, 64, 66], bass: 38 }, // Dmaj9
        { notes: [54, 57, 61, 62, 66], bass: 35 }, // Bm9
        { notes: [47, 50, 54, 57, 59], bass: 43 }, // Gmaj9
        { notes: [52, 57, 59, 61, 64], bass: 45 }, // A6sus2
      ];
      const melody = [[[0, 74], [2, 73]], [[0, 71], [3, 69]], [[0, 71], [2, 74]], [[0, 73]]];
      return render(bars * 4 * beat, 6, mix => {
        for (let bar = 0; bar < bars; bar++) {
          const chord = chords[bar % 4];
          const cycle = Math.floor(bar / 4);
          addFelt(mix, at(bar, 0), chord.bass, 3.5, 0.10);
          // A slow arpeggio up and back down the chord.
          for (const [eighth, voice] of [0, 1, 2, 3, 4, 3, 2, 1].entries()) {
            addFelt(mix, at(bar, eighth / 2), chord.notes[voice], 1.4, eighth % 2 ? 0.022 : 0.03);
          }
          if (cycle === 1 || cycle === 2) for (const [position, note] of melody[bar % 4]) addFelt(mix, at(bar, position), note, 1.8, 0.05);
        }
      });
    },
  },
  {
    id: 'lighthouse-waves', seed: 911237, rms: 0.10, warmth: 4500,
    build(random) {
      return render(48, 10, (mix, frame) => {
        // A low sea swell and a little wind, kept in the background.
        const swell = lowpass(120), swellSmooth = lowpass(120), wind = resonator(0.5);
        addBed(mix, frame, random, (white, t) => swellSmooth(swell(white)) * 0.3 * (1 + 0.3 * drift(frame, t, 6)) + wind(white, 350) * 0.02);
        // Six waves, one every eight seconds.
        for (let wave = 0; wave < 6; wave++) {
          const start = wave * 8 + random.between(-0.4, 0.4);
          const size = random.between(0.8, 1.1);
          // The wash brightens as the wave breaks, then darkens as it drains away.
          const wash = resonator(0.7);
          addEvent(mix, start, 8, age => {
            const centre = age < 2.2 ? 400 + 700 * ease(age / 2.2) : 1100 - 600 * ease((age - 2.2) / 5);
            return wash(random(), centre) * ease(age / 2.2) * (1 - ease((age - 2.2) / 5.8)) * 0.25 * size;
          });
          // Foam fizz: tiny bubbles popping, thinning out as the water drains.
          for (let count = Math.round(180 * size); count > 0; count--) {
            const at = 2 + 5 * random.between(0, 1) ** 1.6;
            const frequency = random.between(1000, 2600);
            const decay = random.between(0.002, 0.006);
            const strength = (0.006 + 0.014 * random.between(0, 1) ** 2) * (1 - (at - 2) / 6);
            addEvent(mix, start + at, decay * 6, age =>
              Math.sin(twoPi * frequency * (age + 20 * age * age)) * Math.min(1, age / 0.0008) * Math.exp(-age / decay) * (1 - ease(age / (decay * 6))) * strength);
          }
          // Pebbles rolling back down the beach behind it.
          for (let count = Math.round(60 * size); count > 0; count--) {
            const at = random.between(3.5, 7);
            const frequency = random.between(700, 1600);
            const decay = random.between(0.001, 0.003);
            const strength = random.between(0.01, 0.03);
            addEvent(mix, start + at, decay * 6, age =>
              Math.sin(twoPi * frequency * age) * Math.min(1, age / 0.0005) * Math.exp(-age / decay) * (1 - ease(age / (decay * 6))) * strength);
          }
        }
      });
    },
  },
  {
    id: 'lighthouse-drone', seed: 663161, rms: 0.12,
    build() {
      // Whole cycles per loop, so the drone lines up with itself at the seam.
      const loopHz = note => Math.round(midi(note) * 60) / 60;
      const chords = [[50, 52, 57, 62], [50, 57, 60, 64], [50, 55, 59, 62], [50, 55, 60, 62]];
      const bells = [74, 69, 72, 67, 74, 76, 72, 69];
      return render(60, 20, (mix, frame) => {
        addEvent(mix, 0, frame.seconds, age => (Math.sin(twoPi * loopHz(38) * age) * 0.030 * (1 + 0.25 * drift(frame, age, 2))
          + Math.sin(twoPi * loopHz(45) * age) * 0.016 * (1 + 0.3 * drift(frame, age, 3, 1.1))
          + Math.sin(twoPi * loopHz(50) * age) * 0.010 * (1 + 0.3 * drift(frame, age, 5, 2.3))));
        for (const [index, chord] of chords.entries()) addPad(mix, index * 15, chord, 0.8);
        for (const [index, note] of bells.entries()) addBell(mix, index * 7.5 + 3, note, 0.3);
        // A buoy bell further out.
        for (const start of [12, 42]) addBell(mix, start, 57, 0.28);
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
