# Night Signal

## Development

- Node 24.15+ within the Node 24 release line. `npm ci`, then `npm run dev` starts the single-port application at http://127.0.0.1:3000.
- `npm run check` runs typecheck, lint, unit/integration tests, and the production build. `npm run test:e2e` runs independent browser contexts against a separate production test server.
- Keep room state, host authorization, and timeline calculations separate from scene rendering. New scenes should not change the WebSocket protocol.
- Audio requires an explicit user gesture. Volume and mute belong to each listener; only authenticated hosts may change shared playback, delete notes, or end rooms.
- Never put host credentials in invitation links, query strings, logs, or screenshots. Store only host credential hashes on the server.
- Render guestbook content as plain text. Preserve drafts during connection failures. Retain server-side limits and bounded history.
- Keep continuous scene animation restrained, efficient, and compatible with reduced motion. Verify desktop and mobile layouts in a real browser.
- Only add audio/artwork with clear provenance and permission for distribution. Update `docs/ASSETS.md` when assets change.
- The application supports one process and a local SQLite database. Do not assume that adding replicas is safe.

## Repository workflow

- File a labeled issue before every new work item; separately discovered bugs get their own labeled issues.
- One PR per issue/work item. Label every PR using the repository's existing label set.
- Commit, push working branches, and open PRs as needed. Do not directly push to `main`, force-push, or perform destructive Git operations without explicit approval.
- CI must pass before merging. Merge passing PRs to `main`, then delete merged branches.
- Keep repository topics accurate. Never publish a release or push a tag without explicit user permission.
