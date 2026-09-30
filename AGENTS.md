# Night Signal

A static site of calming illustrated scenes, each with looping ambience and music layers. There is no server, database, or account system; do not add one without discussion.

## Development

- Node 24.15+ within the Node 24 release line. `npm ci`, then `npm run dev` starts Vite at http://127.0.0.1:3000.
- `npm run check` runs typecheck, lint, unit tests, and the production build. `npm run test:e2e` runs Playwright (desktop and phone) against `vite preview` on port 4173; it needs `npx playwright install chromium` once.
- Layout: `src/scenes.ts` is the scene and layer catalog, `src/useSoundscape.ts` is Web Audio playback, `src/mix.ts` is level math and saved preferences, `src/Scene.tsx`, `src/OtherScenes.tsx`, and `src/*Art.tsx` (one file per newer scene) are artwork, `src/App.tsx` is the interface.
- Keep audio playback separate from scene rendering. A new scene is artwork plus a catalog entry and its layers; it should not change the player.
- Audio requires an explicit user gesture. No audio may be fetched or played before it. Volume, mute, and layer levels are local preferences.
- Every layer must loop seamlessly. `scripts/generate-audio.mjs` renders past the loop length and folds the overhang back; `tests/catalog.test.ts` checks the seam, headroom, and format. Run `npm run audio:generate` and commit the WAVs whenever the generator changes.
- Keep soundscapes calm: no raw white noise, harsh highs, or sudden loud events.
- Keep continuous scene animation restrained, efficient, and compatible with reduced motion. Verify desktop and mobile layouts in a real browser.
- Only add audio/artwork with clear provenance and permission for distribution. Update `docs/ASSETS.md` when assets change.

## Repository workflow

- File a labeled issue before every new work item; separately discovered bugs get their own labeled issues.
- One PR per issue/work item. Label every PR using the repository's existing label set.
- Commit, push working branches, and open PRs as needed. Do not directly push to `main`, force-push, or perform destructive Git operations without explicit approval.
- CI must pass before merging. Merge passing PRs to `main`, then delete merged branches.
- Keep repository topics accurate. Never publish a release or push a tag without explicit user permission.
