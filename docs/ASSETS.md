# Asset and source register

Night Signal's checked-in ambient audio and scene artwork were created for this project. No commercial music, third-party recordings, downloaded artwork, external font files, or streaming service audio are included.

## Synthetic demo soundscapes

These are procedural demonstration soundscapes, created by the coding assistant for Night Signal. They are synthesized from sine waves and seeded noise. They do not contain sampled recordings or licensed third-party music. No third-party asset permission or attribution is required for their incorporated material. They are included for use and redistribution as part of Night Signal; this register does not assert exclusive copyright in AI-assisted output.

| File | Display title | Intended environment | Source |
| --- | --- | --- | --- |
| `public/audio/windowlight.wav` | Windowlight | Rainy Apartment | Original rain texture and soft synthesized chords |
| `public/audio/last-exit.wav` | Last Exit | Midnight Highway | Original low road texture, sine pads, and a gentle pulse |
| `public/audio/afterimage.wav` | Afterimage | Empty Arcade | Original synthesized chimes and pads; no game samples |

All three files are finite 90-second mono PCM WAVs at 22,050 Hz and 16-bit depth. They fade in and out and do not automatically loop. Windowlight uses a much quieter filtered rain bed with no direct white-noise layer, and a maximum sample peak of approximately -11.1 dBFS. The other tracks peak at approximately -4.7 dBFS. The host can replay them after completion. They are identified as synthetic demo audio in the application and README.

The reproducible source is [`scripts/generate-audio.mjs`](../scripts/generate-audio.mjs). Run `npm run audio:generate` to recreate all three files without a network connection or sample library. The generator uses fixed random seeds and contains the synthesis, arrangements, fades, and WAV encoder.

## Artwork and typography

The Rainy Apartment, Midnight Highway, and Empty Arcade illustrations and animations are original SVG/CSS artwork authored by the coding assistant for this project. There are no incorporated third-party image assets. Typography uses system fonts installed on the visitor's device; no fonts are downloaded or redistributed.

Interface icons come from the `lucide-react` package under the ISC license, with some Feather-derived icons under the MIT license. Both notices are included below and in the installed dependency's `LICENSE` file. The artwork attribution above does not describe these library icons as original project artwork.

## Replacing the audio or artwork

The audio catalog lives in `shared/protocol.ts`. To replace a track, place the permitted audio file in `public/audio/`, update its URL and actual duration in the catalog, and add its provenance and permitted uses to this register. Keep every catalog ID unique. Do not rely on a provider's playback permission as permission to redistribute a downloaded file.

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
