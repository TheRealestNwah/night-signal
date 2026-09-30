# Asset and source register

Night Signal's checked-in audio and scene artwork were created for this project. No commercial music, third-party recordings, downloaded artwork, external font files, or streaming service audio are included.

## Synthetic soundscape layers

These are procedural soundscape layers, created by the coding assistant for Night Signal. They are synthesized from sine waves and seeded, filtered noise. They do not contain sampled recordings or licensed third-party music. No third-party asset permission or attribution is required for their incorporated material. They are included for use and redistribution as part of Night Signal; this register does not assert exclusive copyright in AI-assisted output.

| File | Scene | Layer | Loop | Source |
| --- | --- | --- | --- | --- |
| `public/audio/apartment-rain.wav` | Rainy Apartment | Rain on the window | 48.00 s | Low-passed rain wash, short droplet ticks, sill drips, two distant thunder swells |
| `public/audio/apartment-lofi.wav` | Rainy Apartment | Lofi | 54.86 s | Original 16-bar piece at 70 BPM: electric-piano chords, sine bass, soft drums, sparse melody, faint record crackle |
| `public/audio/highway-road.wav` | Midnight Highway | Road hum | 48.00 s | Low cabin rumble, tyre noise, engine drone, expansion-joint thumps, two passing swells |
| `public/audio/highway-synth.wav` | Midnight Highway | Soft synth | 60.00 s | Original sine pads, a rounded low pulse, and a slow bell phrase |
| `public/audio/arcade-hum.wav` | Empty Arcade | Machine hum | 48.00 s | Ventilation noise, mains hum, and quiet distant attract-mode blips |
| `public/audio/arcade-chimes.wav` | Empty Arcade | Chimes | 60.00 s | Original synthesized chimes and pads; no game samples or game melodies |

All six files are mono PCM WAVs at 22,050 Hz and 16-bit depth, about 14 MB in total. Each is a seamless loop: the generator renders past the loop length and folds the overhang back onto the start, so decays and noise beds wrap without a click. Layers are loudness-matched by RMS with peaks kept below -1 dBFS. The rain and other noise beds are low-pass filtered; no layer contains raw white noise.

The reproducible source is [`scripts/generate-audio.mjs`](../scripts/generate-audio.mjs). Run `npm run audio:generate` to recreate all six files without a network connection or sample library. The generator uses fixed random seeds and contains the synthesis, arrangements, loop folding, and WAV encoder.

## Artwork and typography

The Rainy Apartment, Midnight Highway, and Empty Arcade illustrations and animations are original SVG/CSS artwork authored by the coding assistant for this project. There are no incorporated third-party image assets. Typography uses system fonts installed on the visitor's device; no fonts are downloaded or redistributed.

Interface icons come from the `lucide-react` package under the ISC license, with some Feather-derived icons under the MIT license. Both notices are included below and in the installed dependency's `LICENSE` file. The artwork attribution above does not describe these library icons as original project artwork.

## Replacing the audio or artwork

The scene catalog lives in `src/scenes.ts`. To replace a layer, place the permitted audio file in `public/audio/`, update its URL in the catalog, and add its provenance and permitted uses to this register. A replacement must loop cleanly from its last sample to its first. Keep every layer ID unique. Do not rely on a provider's playback permission as permission to redistribute a downloaded file.

For any future third-party asset, record its creator, original source URL, exact license or written permission, required attribution, modifications, and redistribution restrictions before committing the file. Preserve a copy of permission where appropriate. Do not add proprietary game imagery or music without authorization.

## Icon license notices

### Lucide: ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### Feather-derived icons: The MIT License (MIT)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
