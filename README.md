# Night Signal

A little quiet for the late hours. Pick a calming illustrated scene, press **Start listening**, and let it loop while you read, work, or drift off.

Each scene pairs an ASMR-style ambience with a music layer, and you set the balance yourself:

| Scene | Ambience | Music |
| --- | --- | --- |
| Rainy Apartment | Rain on the window | Lofi |
| Midnight Highway | Road hum | Soft synth |
| Empty Arcade | Neon hum | Chimes |
| Night Train | Rails | Keys |
| Snowed-In Cabin | Fire and wind | Felt piano |
| Lighthouse Keeper | Waves | Drone and bell |

Night Signal is a static site: React and Vite, with the Web Audio API for playback. It has no server, accounts, database, tracking, paid APIs, or streaming services.

Most audio is **original and procedurally synthesized** by a script in this repository. The Night Train ambience is a licensed Pixabay recording; it and any other recordings are listed in the asset register and are not covered by the MIT license. Scene artwork is original SVG/CSS, with system fonts and Lucide interface icons. See the [asset and source register](docs/ASSETS.md) for provenance and replacement instructions.

> **Built with AI.** Night Signal's code, tests and documentation were written by
> Claude, an AI model from Anthropic, directed and tested by the maintainer.
> See [AI disclosure](#ai-disclosure).

## Run locally

Use Node.js **24.15 or newer within the Node 24 release line** and npm. CI pins Node 24.20.0.

```sh
npm ci
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000). Nothing is downloaded or played until you press Start listening, because browsers restrict automatic playback. The layer sliders, overall volume, and mute are remembered in your browser's local storage. A scene can be linked directly, for example `/#highway`.

## Build and host

```sh
npm run build
```

The `dist/` folder is the whole site. Upload it to any static host (GitHub Pages, Netlify, Cloudflare Pages, or a plain web server). `npm run preview` serves the built site at [127.0.0.1:4173](http://127.0.0.1:4173) for a final look. No hosting destination has been configured by this repository.

## Layout

- `src/scenes.ts` is the catalog: each scene's text and its audio layers.
- `src/useSoundscape.ts` loads a scene's layers, loops them, and crossfades between scenes.
- `src/mix.ts` holds the level math and saved preferences.
- `src/Scene.tsx`, `src/OtherScenes.tsx`, and one `src/*Art.tsx` file per newer scene draw the scenes; `src/App.tsx` is the interface.
- `public/audio/` contains the looping layers; `scripts/generate-audio.mjs` reproduces them without external samples or dependencies.

Adding a scene means adding its artwork, its layers in the generator, and one catalog entry. The player does not change.

## Checks and tests

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs TypeScript checking, ESLint, unit tests, and the production build. The unit tests also inspect every audio file for format, headroom, and a click-free loop seam. The browser suite uses Playwright at desktop and phone sizes against the production build. CI runs both commands for every pull request and each push to `main`; browser failure artifacts are retained for seven days.

To regenerate the included audio:

```sh
npm run audio:generate
```

The generator uses fixed random seeds, so the output is identical on every run.

## AI disclosure

Night Signal was built with [Claude Code](https://claude.com/claude-code), Anthropic's
AI coding assistant. Claude wrote the code, tests and documentation. The
maintainer ([@TheRealestNwah](https://github.com/TheRealestNwah)) decided what
it should do, tested it, and made the release decisions. Commits written with
Claude carry a `Co-Authored-By: Claude` trailer, so the git history shows which
changes were AI-written.

## Support

Everything on my GitHub is free of charge and open source. If you find it
useful and want to leave a tip or buy me a coffee, you can do that at
[ko-fi.com/morrowheat23](https://ko-fi.com/morrowheat23). It's appreciated,
never expected.

## License

MIT — see [LICENSE](LICENSE). Licensed third-party recordings in `public/audio/` keep their own licenses; see [docs/ASSETS.md](docs/ASSETS.md#licensed-recordings).
