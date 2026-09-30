import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer as createHttpServer, type IncomingMessage } from 'node:http';
import { resolve } from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { positionAt, SCENES, TRACKS, trackFor, type RoomState, type ServerMessage, type Snapshot } from '../shared/protocol.ts';
import { RoomStore, type StoredRoom } from './store.ts';

export const ROOM_IDLE_MS = 24 * 60 * 60 * 1000;
export const NOTE_HISTORY_LIMIT = 200;
const MAX_PARTICIPANTS = 40;
const MAX_CONNECTIONS = 500;
const MAX_CONNECTIONS_PER_IP = 30;
const MAX_ROOMS = 1000;
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const HOST_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

interface Participant {
  socket: WebSocket;
  roomId: string;
  ip: string;
  ready: boolean;
  host: boolean;
  alive: boolean;
  helloTimer: ReturnType<typeof setTimeout>;
}

interface Bucket { count: number; expiresAt: number }

/** Bounded in-memory rate limits; addresses are hashed and never persisted. */
class RateLimits {
  private buckets = new Map<string, Bucket>();
  allow(key: string, limit: number, windowMs: number, now: number): boolean {
    let bucket = this.buckets.get(key);
    if (bucket && bucket.expiresAt <= now) {
      this.buckets.delete(key);
      bucket = undefined;
    }
    if (!bucket) {
      if (this.buckets.size >= 10_000) this.sweep(now);
      if (this.buckets.size >= 10_000) return false;
      bucket = { count: 0, expiresAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket.count <= limit;
  }
  sweep(now: number): void {
    for (const [key, value] of this.buckets) if (value.expiresAt <= now) this.buckets.delete(key);
  }
}

export interface ServerOptions {
  dbPath?: string;
  now?: () => number;
  production?: boolean;
  /** Disable frontend middleware for API and WebSocket integration tests. */
  serveClient?: boolean;
  staticPath?: string;
}

function hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
function authorized(secret: unknown, expected: string): boolean {
  if (typeof secret !== 'string' || !HOST_KEY_PATTERN.test(secret)) return false;
  return timingSafeEqual(Buffer.from(hash(secret), 'hex'), Buffer.from(expected, 'hex'));
}

function sameOrigin(request: IncomingMessage): boolean {
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = request.headers.origin;
  if (!origin) return true; // Non-browser API clients and integration tests.
  try {
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host.toLowerCase() === request.headers.host?.toLowerCase();
  } catch { return false; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function containsControlCharacters(value: string): boolean {
  return [...value].some(character => {
    const code = character.charCodeAt(0);
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
  });
}

export async function createServer(options: ServerOptions = {}) {
  const now = options.now ?? Date.now;
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const store = new RoomStore(options.dbPath ?? process.env.DATABASE_PATH ?? 'data/night-signal.sqlite');
  const app = express();
  const server = createHttpServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false });
  const peers = new Set<Participant>();
  const limits = new RateLimits();
  const addressSalt = randomBytes(16).toString('hex');
  let closing = false;
  let vite: { close(): Promise<void> } | undefined;

  const ipOf = (request: IncomingMessage) => hash(addressSalt + (request.socket.remoteAddress ?? 'unknown'));
  const inRoom = (id: string) => [...peers].filter(peer => peer.ready && peer.roomId === id && peer.socket.readyState === WebSocket.OPEN);
  const send = (peer: Participant, message: ServerMessage) => {
    if (peer.socket.readyState !== WebSocket.OPEN) return;
    if (peer.socket.bufferedAmount > 256 * 1024) {
      peer.socket.close(1013, 'Connection is too slow. Reconnect to catch up.');
      return;
    }
    peer.socket.send(JSON.stringify(message));
  };
  const error = (peer: Participant, message: string, code = 'invalid-message') => send(peer, { type: 'error', message, code });

  function endRoom(id: string, reason: string): void {
    store.remove(id);
    for (const peer of peers) {
      if (peer.roomId !== id) continue;
      send(peer, { type: 'ended', reason });
      peer.socket.close(1000, 'Room ended');
    }
  }

  function getRoom(id: string): StoredRoom | undefined {
    const room = store.get(id);
    if (!room) return undefined;
    if (inRoom(id).length === 0 && now() - room.lastSeenMs >= ROOM_IDLE_MS) {
      endRoom(id, 'This room expired after 24 hours without listeners.');
      return undefined;
    }
    return room;
  }

  function settleCompletion(room: StoredRoom): boolean {
    if (room.state.playing && positionAt(room.state, now()) >= trackFor(room.state.trackId).duration) {
      room.state = { ...room.state, playing: false, position: trackFor(room.state.trackId).duration, anchorMs: now(), revision: room.state.revision + 1 };
      // Finishing an unattended track must not extend room lifetime.
      store.save(room.state, room.lastSeenMs);
      return true;
    }
    return false;
  }

  function broadcast(id: string): void {
    const room = getRoom(id);
    if (!room) return;
    settleCompletion(room);
    const participants = inRoom(id);
    const snapshot: Omit<Snapshot, 'role'> = {
      type: 'snapshot', room: room.state, notes: store.notes(id), listeners: participants.length,
      hostOnline: participants.some(peer => peer.host), serverTime: now(),
    };
    for (const peer of participants) send(peer, { ...snapshot, role: peer.host ? 'host' : 'listener' });
  }

  function sweepExpired(): void {
    const time = now();
    for (const id of store.inactiveBefore(time - ROOM_IDLE_MS)) {
      if (inRoom(id).length === 0) endRoom(id, 'This room expired after 24 hours without listeners.');
    }
    limits.sweep(time);
  }

  app.disable('x-powered-by');
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Content-Security-Policy', [
      "default-src 'self'", `script-src 'self'${production ? '' : " 'unsafe-inline'"}`,
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "media-src 'self' blob:",
      `connect-src 'self'${production ? '' : ' ws: wss:'}`, "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
    ].join('; '));
    next();
  });
  app.use('/api', (request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    if (!sameOrigin(request)) { response.status(403).json({ error: 'Cross-origin requests are not allowed.' }); return; }
    next();
  });
  app.use(express.json({ limit: '4kb', strict: true }));
  app.get('/api/health', (_request, response) => response.json({ ok: true }));
  app.post('/api/rooms', (request, response) => {
    if (!limits.allow(`create:${ipOf(request)}`, 10, 60 * 60 * 1000, now())) {
      response.setHeader('Retry-After', '3600');
      response.status(429).json({ error: 'Too many rooms created. Try again later.' });
      return;
    }
    if (!isRecord(request.body) || !SCENES.some(scene => scene.id === request.body.scene)) {
      response.status(400).json({ error: 'Choose a valid environment.' });
      return;
    }
    sweepExpired();
    if (store.count() >= MAX_ROOMS) { response.status(503).json({ error: 'Night Signal is full. Please try again later.' }); return; }
    const scene = SCENES.find(item => item.id === request.body.scene)!;
    const track = TRACKS.find(item => item.scene === scene.id)!;
    const roomId = randomBytes(12).toString('base64url');
    const hostKey = randomBytes(32).toString('base64url');
    store.create({ id: roomId, scene: scene.id, trackId: track.id, playing: false, position: 0, anchorMs: now(), revision: 0 }, hash(hostKey), now());
    response.status(201).json({ roomId, hostKey });
  });
  app.use('/api', (_request, response) => response.status(404).json({ error: 'Unknown API endpoint.' }));

  server.on('upgrade', (request, socket, head) => {
    const reject = (status: number, description: string) => {
      socket.end(`HTTP/1.1 ${status} ${description}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    };
    let url: URL;
    try { url = new URL(request.url ?? '/', 'http://localhost'); } catch { reject(400, 'Bad Request'); return; }
    // Vite owns upgrades to its own HMR path in development.
    if (url.pathname !== '/ws') {
      if (options.serveClient === false || production) reject(404, 'Not Found');
      return;
    }
    if (!sameOrigin(request)) { reject(403, 'Forbidden'); return; }
    const roomId = url.searchParams.get('room') ?? '';
    if (roomId.length > 64) { reject(400, 'Bad Request'); return; }
    const ip = ipOf(request);
    if (!limits.allow(`connect:${ip}`, 60, 60_000, now()) || peers.size >= MAX_CONNECTIONS || [...peers].filter(peer => peer.ip === ip).length >= MAX_CONNECTIONS_PER_IP || [...peers].filter(peer => peer.roomId === roomId).length >= MAX_PARTICIPANTS) {
      reject(429, 'Too Many Requests');
      return;
    }
    wss.handleUpgrade(request, socket, head, websocket => wss.emit('connection', websocket, roomId, ip));
  });

  function handleMessage(peer: Participant, value: unknown): void {
    if (!isRecord(value) || typeof value.type !== 'string') { error(peer, 'Send a valid message.'); return; }
    const room = getRoom(peer.roomId);
    if (!room) { send(peer, { type: 'ended', reason: 'This room is no longer available.' }); peer.socket.close(1000, 'Room unavailable'); return; }
    if (settleCompletion(room)) broadcast(peer.roomId);
    if (value.type === 'hello') {
      if (peer.ready) { error(peer, 'This connection has already joined.'); return; }
      if (value.hostKey !== undefined && !authorized(value.hostKey, room.hostHash)) {
        error(peer, 'The host key is invalid. Use the invitation link to join as a listener.', 'HOST_UNAUTHORIZED');
        peer.socket.close(1008, 'Invalid host credentials');
        return;
      }
      peer.host = value.hostKey !== undefined;
      peer.ready = true;
      clearTimeout(peer.helloTimer);
      store.touch(peer.roomId, now());
      broadcast(peer.roomId);
      return;
    }
    if (!peer.ready) { error(peer, 'Join the room before sending updates.', 'UNAUTHORIZED'); return; }
    if (value.type === 'ping') {
      if (typeof value.sentAt !== 'number' || !Number.isFinite(value.sentAt)) { error(peer, 'Invalid timestamp.'); return; }
      send(peer, { type: 'pong', sentAt: value.sentAt, serverTime: now() });
      return;
    }
    if (value.type === 'note') {
      if (typeof value.name !== 'string' || typeof value.text !== 'string') { error(peer, 'Enter a name and a note.'); return; }
      const name = value.name.trim();
      const text = value.text.trim();
      if (!name || name.length > 30 || !text || text.length > 280 || containsControlCharacters(name + text)) {
        error(peer, 'Use a name of 1–30 characters and a note of 1–280 characters.', 'note-invalid');
        return;
      }
      if (!limits.allow(`note:${peer.roomId}:${peer.ip}`, 5, 60_000, now())) { error(peer, 'Leave a little space between notes. Try again in a minute.', 'rate-limited'); return; }
      store.addNote(peer.roomId, { id: randomBytes(12).toString('base64url'), name, text, createdAt: now() }, NOTE_HISTORY_LIMIT);
      store.touch(peer.roomId, now());
      broadcast(peer.roomId);
      return;
    }
    if (value.type === 'control' || value.type === 'delete-note' || value.type === 'end') {
      if (!peer.host) { error(peer, 'Only the host can do that.', 'host-required'); return; }
    }
    if (value.type === 'delete-note') {
      if (typeof value.id !== 'string' || !ROOM_ID_PATTERN.test(value.id)) { error(peer, 'Choose a valid note.'); return; }
      store.removeNote(peer.roomId, value.id);
      broadcast(peer.roomId);
      return;
    }
    if (value.type === 'end') { endRoom(peer.roomId, 'The host has ended this room.'); return; }
    if (value.type !== 'control') { error(peer, 'Unknown message type.'); return; }
    const state: RoomState = { ...room.state, position: positionAt(room.state, now()), anchorMs: now(), revision: room.state.revision + 1 };
    if (value.action === 'play') {
      if (state.position >= trackFor(state.trackId).duration) state.position = 0;
      state.playing = true;
    } else if (value.action === 'pause') {
      state.playing = false;
    } else if (value.action === 'seek') {
      if (typeof value.position !== 'number' || !Number.isFinite(value.position) || value.position < 0 || value.position > trackFor(state.trackId).duration) { error(peer, 'Choose a valid playback position.'); return; }
      state.position = value.position;
      if (state.position === trackFor(state.trackId).duration) state.playing = false;
    } else if (value.action === 'track') {
      const track = TRACKS.find(item => item.id === value.trackId);
      if (!track) { error(peer, 'Choose an available track.'); return; }
      state.trackId = track.id;
      state.position = 0;
    } else { error(peer, 'Unknown playback action.'); return; }
    store.save(state, now());
    broadcast(peer.roomId);
  }

  wss.on('connection', (socket: WebSocket, roomId: string, ip: string) => {
    const peer: Participant = {
      socket, roomId, ip, ready: false, host: false, alive: true,
      helloTimer: setTimeout(() => socket.close(1008, 'Join timeout'), 10_000),
    };
    peers.add(peer);
    if (!ROOM_ID_PATTERN.test(roomId) || !getRoom(roomId)) {
      send(peer, { type: 'ended', reason: 'This room has ended or expired. Ask your host for a new invitation.' });
      socket.close(1000, 'Room unavailable');
    }
    socket.on('pong', () => { peer.alive = true; });
    socket.on('error', () => socket.terminate());
    socket.on('message', (raw, binary) => {
      if (!limits.allow(`message:${peer.ip}`, 180, 10_000, now())) { error(peer, 'Too many updates. Wait a moment.', 'rate-limited'); return; }
      if (binary) { error(peer, 'Only text messages are supported.'); return; }
      let value: unknown;
      try { value = JSON.parse(raw.toString()); } catch { error(peer, 'Invalid JSON.'); return; }
      try { handleMessage(peer, value); } catch (failure) {
        console.error('Room operation failed:', failure);
        error(peer, 'The room could not save that update. Please try again.', 'server-error');
      }
    });
    socket.on('close', () => {
      clearTimeout(peer.helloTimer);
      peers.delete(peer);
      if (closing || !peer.ready || !store.get(peer.roomId)) return;
      store.touch(peer.roomId, now());
      broadcast(peer.roomId);
    });
  });

  // Persist active presence so a process restart does not expire occupied rooms.
  const maintenance = setInterval(() => {
    if (closing) return;
    for (const id of new Set([...peers].filter(peer => peer.ready).map(peer => peer.roomId))) store.touch(id, now());
    for (const peer of peers) {
      if (!peer.alive) { peer.socket.terminate(); continue; }
      peer.alive = false;
      peer.socket.ping();
    }
    sweepExpired();
  }, 30_000);
  maintenance.unref();
  const completion = setInterval(() => {
    if (closing) return;
    for (const id of new Set([...peers].filter(peer => peer.ready).map(peer => peer.roomId))) {
      const before = store.get(id);
      if (before?.state.playing && positionAt(before.state, now()) >= trackFor(before.state.trackId).duration) broadcast(id);
    }
  }, 500);
  completion.unref();
  sweepExpired();

  if (options.serveClient !== false) {
    if (production) {
      const staticPath = resolve(options.staticPath ?? 'dist');
      app.use(express.static(staticPath, { index: false, maxAge: '1h' }));
      app.use((request, response, next) => {
        if (request.method !== 'GET' || !request.accepts('html') || /\.[a-z0-9]+$/i.test(request.path)) { next(); return; }
        response.setHeader('Cache-Control', 'no-cache');
        response.sendFile(resolve(staticPath, 'index.html'));
      });
    } else {
      const { createServer: createViteServer } = await import('vite');
      const devServer = await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
      vite = devServer;
      app.use(devServer.middlewares);
    }
  }
  app.use((_request, response) => response.status(404).json({ error: 'Not found.' }));
  app.use((failure: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const status = isRecord(failure) && typeof failure.status === 'number' ? failure.status : 500;
    if (status >= 500) console.error('HTTP request failed:', failure);
    response.status(status).json({ error: status === 413 ? 'Request is too large.' : status === 400 ? 'Invalid JSON request.' : 'The request could not be completed.' });
  });

  return {
    app, server, wss, sweepExpired,
    async listen(port = 0, hostname = '127.0.0.1'): Promise<string> {
      await new Promise<void>((resolveListen, reject) => {
        const onError = (failure: Error) => reject(failure);
        server.once('error', onError);
        server.listen(port, hostname, () => { server.off('error', onError); resolveListen(); });
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('HTTP server did not bind to a TCP address.');
      return `http://${hostname.includes(':') ? `[${hostname}]` : hostname}:${address.port}`;
    },
    async close(): Promise<void> {
      if (closing) return;
      closing = true;
      clearInterval(maintenance);
      clearInterval(completion);
      for (const peer of peers) {
        clearTimeout(peer.helloTimer);
        if (peer.ready) store.touch(peer.roomId, now());
        peer.socket.terminate();
      }
      await new Promise<void>(resolveClose => wss.close(() => resolveClose()));
      await vite?.close();
      await new Promise<void>((resolveClose, reject) => {
        if (!server.listening) { resolveClose(); return; }
        server.close(failure => failure ? reject(failure) : resolveClose());
        server.closeIdleConnections();
      });
      store.close();
    },
  };
}
