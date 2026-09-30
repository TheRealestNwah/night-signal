# Asset and source register

Night Signal's scene artwork and most of its audio were created for this project. The exceptions are the licensed recordings listed under [Licensed recordings](#licensed-recordings). No commercial music, downloaded artwork, external font files, or streaming service audio are included.

## Synthetic soundscape layers

These are procedural soundscape layers, created by the coding assistant for Night Signal. They are synthesized from sine waves and seeded, filtered noise. They do not contain sampled recordings or licensed third-party music. No third-party asset permission or attribution is required for their incorporated material. They are included for use and redistribution as part of Night Signal; this register does not assert exclusive copyright in AI-assisted output.

| File | Scene | Layer | Loop | Source |
| --- | --- | --- | --- | --- |
| `public/audio/apartment-rain.wav` | Rainy Apartment | Rain on the window | 48.00 s | Rain only: a dense spray of tiny impacts, bigger drops on the glass, sill drips |
| `public/audio/apartment-lofi.wav` | Rainy Apartment | Lofi | 54.86 s | Original 16-bar piece at 70 BPM: electric-piano chords, sine bass, soft drums, sparse melody, faint record crackle |
| `public/audio/highway-road.wav` | Midnight Highway | Road hum | 48.00 s | Engine note with slow pitch drift, paired expansion-joint thumps, two cars passing the other way, over low road noise |
| `public/audio/highway-synth.wav` | Midnight Highway | Soft synth | 60.00 s | Original sine pads, a rounded low pulse, and a slow bell phrase |
| `public/audio/arcade-hum.wav` | Empty Arcade | Neon hum | 48.00 s | Neon-sign buzz at 120 Hz and harmonics from two signs, a transformer hum, one sign occasionally flickering |
| `public/audio/arcade-chimes.wav` | Empty Arcade | Chimes | 60.00 s | Original synthesized chimes and pads; no game samples or game melodies |
| `public/audio/train-keys.wav` | Night Train | Keys | 60.00 s | Original 16-bar piece at 64 BPM: electric-piano chords, sine bass, sparse melody |
| `public/audio/cabin-fire.wav` | Snowed-In Cabin | Fire and wind | 48.00 s | Soft crackle and knot pops, wind whistling through a gap in the logs, two logs settling, over a low fire bed |
| `public/audio/cabin-piano.wav` | Snowed-In Cabin | Felt piano | 64.00 s | Original 16-bar piece at 60 BPM: soft-hammered piano arpeggios, low bass notes, a sparse melody |
| `public/audio/lighthouse-waves.wav` | Lighthouse Keeper | Waves | 48.00 s | Six waves: a wash that brightens and drains, foam fizz of tiny bubbles, pebbles rolling back, over a low swell |
| `public/audio/lighthouse-drone.wav` | Lighthouse Keeper | Drone and bell | 60.00 s | Original sine drone locked to the loop, slow pads, a sparse bell phrase, and a distant buoy bell |

All audio files, synthetic and recorded, are mono PCM WAVs at 22,050 Hz and 16-bit depth, about 2–3.2 MB each. Each is a seamless loop: the generator renders past the loop length and folds the overhang back onto the start, so decays and noise beds wrap without a click. Layers are loudness-matched by RMS with peaks kept below -1 dBFS. Ambience layers are built mostly from individual synthesized events (drops, clatter, crackle, bubbles), with any noise bed band-limited and kept in the background; no layer contains raw white noise.

The reproducible source is [`scripts/generate-audio.mjs`](../scripts/generate-audio.mjs). Run `npm run audio:generate` to recreate every synthetic file without a network connection or sample library. The generator uses fixed random seeds and contains the synthesis, arrangements, loop folding, and WAV encoder.

## Licensed recordings

These layers are processed from third-party recordings. They are **not** covered by the repository's MIT license; each stays under its own license. Do not redistribute these files on their own, outside Night Signal. `npm run audio:generate` does not touch them.

| File | Scene | Layer | Loop | Source | License |
| --- | --- | --- | --- | --- | --- |
| `public/audio/train-rails.wav` | Night Train | Rails | 72.17 s | ["railway -Train"](https://pixabay.com/sound-effects/film-special-effects-railway-train-339502/) by IMGMIDI, Pixabay sound effect 339502 | [Pixabay Content License](https://pixabay.com/service/license-summary/) |

The Pixabay Content License allows free use and modification without attribution, but not selling or distributing the content on a standalone basis. Credit is given here anyway.

Modifications to the railway recording: decoded from the downloaded MP3, downmixed to mono and resampled to 22,050 Hz; its slow crescendo levelled with a smoothed 4-second RMS envelope; spliced into two passes (the whole recording, then again from 13.29 s) with a 1.5-second equal-power crossfade placed where the clatter rhythm lines up; the end crossfaded over the start for a seamless loop; loudness-matched to the other ambience layers (RMS 0.10, peaks below -1 dBFS).

## Artwork and typography

The Rainy Apartment, Midnight Highway, Empty Arcade, Night Train, Snowed-In Cabin, and Lighthouse Keeper illustrations and animations are original SVG/CSS artwork authored by the coding assistant for this project. There are no incorporated third-party image assets. Typography uses system fonts installed on the visitor's device; no fonts are downloaded or redistributed.

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
