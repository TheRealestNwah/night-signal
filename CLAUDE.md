# Night Signal

A static site of calming illustrated scenes, each with looping ambience and music layers. There is no server, database, or account system; do not add one without discussion.

## Development

- Node 24.15+ within the Node 24 release line. `npm ci`, then `npm run dev` starts Vite at http://127.0.0.1:3000.
- `npm run check` runs typecheck, lint, unit tests, and the production build. `npm run test:e2e` runs Playwright (desktop and phone) against `vite preview` on port 4173; it needs `npx playwright install chromium` once.
- Layout: `src/scenes.ts` is the scene and layer catalog, `src/useSoundscape.ts` is Web Audio playback, `src/mix.ts` is level math and saved preferences, `src/Scene.tsx`, `src/OtherScenes.tsx`, and `src/*Art.tsx` (one file per newer scene) are artwork, `src/App.tsx` is the interface.
- Keep audio playback separate from scene rendering. A new scene is artwork plus a catalog entry and its layers; it should not change the player.
- Register new scenes in `SceneId` and `SCENES` in `src/scenes.ts`, dispatch their artwork in `src/Scene.tsx`, and add the scene palette, responsive layout, and motion rules in `src/styles.css`. Update the scene table in `README.md` and provenance in `docs/ASSETS.md`.
- Audio requires an explicit user gesture. No audio may be fetched or played before it. Volume, mute, and layer levels are local preferences.
- Every layer must loop seamlessly. `scripts/generate-audio.mjs` renders past the loop length and folds the overhang back; `tests/catalog.test.ts` checks the seam, headroom, and format. Run `npm run audio:generate` and commit the WAVs whenever the generator changes.
- Some ambience layers are processed third-party recordings, not generated: the generator must not produce them, and each needs a `credit` in `src/scenes.ts` (shown in the About dialog) plus its source, license, and modifications under "Licensed recordings" in `docs/ASSETS.md`. They still follow the mono 22,050 Hz 16-bit, seamless-loop, and headroom rules.
- Keep soundscapes calm: no raw white noise, harsh highs, or sudden loud events.
- Keep continuous scene animation restrained, efficient, and compatible with reduced motion. Verify desktop and mobile layouts in a real browser.
- Only add audio/artwork with clear provenance and permission for distribution. Update `docs/ASSETS.md` when assets change.
- Hosting currently assumes the root of a domain or subdomain: audio URLs and other app links are root-relative. Subdirectory deployment requires updating those URLs as well as Vite's base path. `wrangler.jsonc` and `.node-version` configure Cloudflare's Git-connected static-assets deploy (`npx wrangler deploy` publishes `dist/`); there is no deployment workflow in this repository.

## Repository workflow

- File a labeled issue before starting a work item that is more than a trivial change; separately discovered bugs get their own labeled issues. Typo, comment-only, and other changes small enough to describe fully in the PR title can go straight to a PR.
- Label every issue using the repository's existing label set. PRs don't need labels.
- One PR per work item; related items (about 3 max) may share one. Titles are short imperative summaries with the issue number in parentheses; PR bodies say `Closes #N`.
- Commit, push working branches, and open PRs as needed. Do not directly push to `main`, force-push, or perform destructive Git operations without explicit approval.
- CI must pass before merging. After opening a PR against `main`, enable auto-merge: `gh pr merge <n> --auto --squash --delete-branch`. Do not auto-merge a PR whose base isn't `main`.
- Keep repository topics accurate. Never publish a release or push a tag without explicit user permission.
