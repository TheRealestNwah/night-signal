# Night Signal

A small place to listen together after dark. Choose a rainy apartment, a midnight highway, or an empty arcade; invite a friend, enable audio, and leave a note in the room's guestbook.

Night Signal is one deployable TypeScript application: React/Vite for the interface, an Express/WebSocket server for rooms, and SQLite for persistence. It needs no accounts, paid APIs, streaming services, or external database.

The included audio consists of three **original synthetic demo soundscapes**, 90 seconds each. These are procedural ambient pieces, not third-party licensed music. Scene artwork is original SVG/CSS, with system fonts and Lucide interface icons. See the [asset and source register](docs/ASSETS.md) for provenance and replacement instructions.

## Run locally

Use Node.js **24.15 or newer within the Node 24 release line** and npm. Node's built-in SQLite API is used. CI and Docker pin Node 24.20.0.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The backend and Vite development middleware share port 3000, including WebSockets. Create a room, click the listening control to enable sound, and copy its invitation link into another browser profile or a private window to try a second listener.

Each browser must explicitly enable audio because browsers restrict automatic playback. Listener volume and mute are local preferences. The host controls the shared track, play/pause state, seeking, guestbook deletion, and room ending. Tracks stop at 90 seconds and can be replayed; they do not automatically loop.

## Rooms and host access

A new room has a random invitation URL and a separate random host credential. The creator's browser retains the host credential locally. The host recovery link carries the credential in its URL fragment; keep this private, like a password. The ordinary invitation link omits it and grants listener access only. URL fragments are not sent with ordinary HTTP requests, but anyone you give the full host link to can control the room. Avoid sharing screenshots that reveal it.

Hosts can reconnect using their browser or their private recovery link. Disconnecting does not hand host privileges to another listener. Shared playback continues from the authoritative timestamp while the host is away. Losing both the stored credential and recovery link means losing host access; there is no account-based recovery.

A room expires after **24 hours without any connected participants**. A connected room remains available. Ending a room removes it and its guestbook immediately. Messages persist across refreshes and server restarts until the room ends or expires; history is bounded to the newest **200 notes**. Notes are plain text with chosen display names and timestamps. They are not private messages, and display names are not verified identities.

Display names contain 1–30 characters and notes contain 1–280 characters after trimming, counted as JavaScript UTF-16 code units (some emoji count as two). Each room and IP combination may post five notes per minute. The server also limits room creation, connection attempts, connected clients, and socket traffic; these limits are deliberately modest for a small single-instance deployment.

## Configuration

Set environment variables in the process or deployment platform. A `.env` file is not automatically loaded.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP and WebSocket port |
| `HOST` | `127.0.0.1` | Bind address; use `0.0.0.0` in a container or for LAN access |
| `DATABASE_PATH` | `data/night-signal.sqlite` | SQLite file; parent directory must be writable |
| `NODE_ENV` | development | Set to `production` to serve the built frontend |

## Production

```sh
npm ci
npm run build
NODE_ENV=production npm start
```

The final command above uses POSIX shell syntax. In PowerShell:

```powershell
$env:NODE_ENV = 'production'
npm start
```

Keep the full locked dependency installation: `npm start` currently runs the TypeScript server through `tsx`. An installation with `npm ci --omit=dev` will omit that runtime. Serve the application behind an HTTPS reverse proxy when exposing it to the internet. The proxy must preserve the original `Host` header and forward WebSocket upgrades on `/ws` to the same application instance; browser origins are validated against the incoming host. There is no `PUBLIC_ORIGIN` override. IP rate limits use the direct connection address, so users behind one reverse proxy share that proxy's limits. Do not enable proxy trust or forwarded-IP handling without restricting which proxy can supply it.

Persist the SQLite file and its `-wal`/`-shm` sidecars on local storage. For backups, stop the process before copying the data directory, or use SQLite's online backup facilities.

For Docker:

```sh
docker compose up --build -d
```

The image uses a pinned Node version, runs as the unprivileged `node` user, and stores SQLite in a named volume at `/app/data`. Open [localhost:3000](http://localhost:3000). `docker compose down` keeps the volume; adding `--volumes` deletes persisted room data. No hosting destination has been configured by this repository.

## Architecture

- `shared/protocol.ts` holds the scene and audio catalogs, room types, and shared playback-position calculation.
- `server/` manages room creation, hashed host credentials, WebSocket events, expiration, input validation, and SQLite persistence.
- `src/` renders the scenes, accessible controls, local audio playback, connection state, and guestbook.
- `public/audio/` contains the finite demo tracks; `scripts/generate-audio.mjs` reproduces them without external samples or dependencies.

The server broadcasts authoritative playback state and timestamps after changes. Clients estimate server time, derive the shared position, and correct audio drift locally. The system sends state changes and timing probes rather than continuously broadcasting playback positions. Scene rendering is separate from the room protocol and audio synchronization.

Run **one application instance** with its local SQLite storage. Active connections and rate-limit counters are held in memory; multiple independent instances behind a load balancer are unsupported. Process restarts disconnect clients temporarily; clients reconnect and recover the persisted room state. This first version does not provide host transfer, accounts, public room discovery, uploads, playlists, voice chat, or streaming-service integration.

## Checks and tests

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs TypeScript checking, ESLint, unit/integration tests, and the production build. The browser suite uses Playwright and isolated browser contexts to exercise the room experience. CI runs both commands for every pull request and each push to `main`; browser failure artifacts are retained for seven days. A separate CI job builds the production container and checks startup, frontend/audio delivery, database writes on a named volume, and the non-root runtime user. Merges require passing CI under the repository workflow.

The synchronization target is approximately one second under ordinary conditions after audio is enabled and loaded. Network interruption, device sleep, browser background throttling, unavailable audio, and blocked playback can delay convergence. Connection and audio errors are surfaced in the interface. The target is an acceptance criterion, not a guarantee across all devices or networks.

To regenerate the included audio:

```sh
npm run audio:generate
```

No release, hosted deployment, or production load certification is implied by the local preview.
