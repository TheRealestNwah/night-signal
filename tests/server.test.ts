import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { WebSocket } from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createServer, NOTE_HISTORY_LIMIT, ROOM_IDLE_MS } from '../server/app.ts';
import { positionAt, type ServerMessage, type Snapshot } from '../shared/protocol.ts';

type Application = Awaited<ReturnType<typeof createServer>>;
const applications: Application[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(applications.splice(0).map(application => application.close()));
  for (const directory of temporaryDirectories.splice(0)) {
    const absolute = resolve(directory);
    if (!absolute.startsWith(resolve(tmpdir()) + sep) || !basename(absolute).startsWith('night-signal-test-')) throw new Error('Unexpected temporary directory.');
    rmSync(absolute, { recursive: true, force: true });
  }
});

async function start(options: Parameters<typeof createServer>[0] = {}) {
  const application = await createServer({ dbPath: ':memory:', serveClient: false, ...options });
  applications.push(application);
  const url = await application.listen();
  return { application, url };
}

async function room(url: string, scene = 'apartment') {
  const response = await fetch(`${url}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene }),
  });
  expect(response.status).toBe(201);
  return await response.json() as { roomId: string; hostKey: string };
}

function socketPeer(url: string, roomId: string, origin?: string) {
  const socket = new WebSocket(`${url.replace('http:', 'ws:')}/ws?room=${roomId}`, origin ? { origin } : undefined);
  const queued: ServerMessage[] = [];
  const waiting: { predicate: (message: ServerMessage) => boolean; resolve: (message: ServerMessage) => void; timer: ReturnType<typeof setTimeout> }[] = [];
  socket.on('message', raw => {
    const message = JSON.parse(raw.toString()) as ServerMessage;
    const index = waiting.findIndex(waiter => waiter.predicate(message));
    if (index >= 0) {
      const [waiter] = waiting.splice(index, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    } else queued.push(message);
  });
  const open = new Promise<void>((resolveOpen, reject) => {
    socket.once('open', resolveOpen);
    socket.once('error', reject);
  });
  const next = (predicate: (message: ServerMessage) => boolean): Promise<ServerMessage> => {
    const index = queued.findIndex(predicate);
    if (index >= 0) return Promise.resolve(queued.splice(index, 1)[0]);
    return new Promise((resolveNext, reject) => {
      const waiter = {
        predicate, resolve: resolveNext,
        timer: setTimeout(() => {
          const waitingIndex = waiting.indexOf(waiter);
          if (waitingIndex >= 0) waiting.splice(waitingIndex, 1);
          reject(new Error(`Timed out waiting for websocket message. Queue: ${JSON.stringify(queued)}`));
        }, 4000),
      };
      waiting.push(waiter);
    });
  };
  return {
    socket, open, next,
    send(message: unknown) { socket.send(JSON.stringify(message)); },
    snapshot(predicate: (snapshot: Snapshot) => boolean = () => true) {
      return next(message => message.type === 'snapshot' && predicate(message)) as Promise<Snapshot>;
    },
    async close() {
      if (socket.readyState === WebSocket.CLOSED) return;
      await new Promise<void>(resolveClose => { socket.once('close', () => resolveClose()); socket.close(); });
    },
  };
}

async function joinRoom(url: string, roomId: string, hostKey?: string) {
  const peer = socketPeer(url, roomId);
  await peer.open;
  peer.send({ type: 'hello', ...(hostKey ? { hostKey } : {}) });
  const initial = await peer.snapshot();
  return { ...peer, initial };
}

describe('room API and authoritative synchronization', () => {
  it('creates validated rooms with isolated credentials, security headers, and creation limits', async () => {
    const { url } = await start();
    const health = await fetch(`${url}/api/health`);
    expect(await health.json()).toEqual({ ok: true });
    expect(health.headers.get('x-content-type-options')).toBe('nosniff');
    expect(health.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    const invalid = await fetch(`${url}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"scene":"unknown"}' });
    expect(invalid.status).toBe(400);
    const created = await room(url);
    expect(created.roomId).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(created.hostKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    for (let index = 0; index < 8; index++) await room(url);
    const limited = await fetch(`${url}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"scene":"apartment"}' });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('3600');
  });

  it('keeps two sockets on one timestamped timeline through late join, pause, seek, and track changes', async () => {
    let time = 100_000;
    const { url } = await start({ now: () => time });
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    expect(host.initial.role).toBe('host');
    expect(JSON.stringify(host.initial)).not.toContain(created.hostKey);
    host.send({ type: 'control', action: 'play' });
    const playing = await host.snapshot(snapshot => snapshot.room.revision === 1);
    expect(playing.room).toMatchObject({ playing: true, anchorMs: time, position: 0 });
    time += 17_500;
    const listener = await joinRoom(url, created.roomId);
    expect(listener.initial.role).toBe('listener');
    expect(listener.initial.listeners).toBe(2);
    expect(positionAt(listener.initial.room, listener.initial.serverTime)).toBe(17.5);
    host.send({ type: 'control', action: 'pause' });
    const [hostPaused, listenerPaused] = await Promise.all([
      host.snapshot(snapshot => snapshot.room.revision === 2), listener.snapshot(snapshot => snapshot.room.revision === 2),
    ]);
    expect(hostPaused.room).toEqual(listenerPaused.room);
    expect(hostPaused.room).toMatchObject({ playing: false, position: 17.5 });
    time += 10_000;
    host.send({ type: 'control', action: 'seek', position: 42 });
    expect((await listener.snapshot(snapshot => snapshot.room.revision === 3)).room.position).toBe(42);
    host.send({ type: 'control', action: 'track', trackId: 'last-exit' });
    expect((await listener.snapshot(snapshot => snapshot.room.revision === 4)).room).toMatchObject({ trackId: 'last-exit', position: 0, playing: false });
    listener.send({ type: 'ping', sentAt: 12345 });
    expect(await listener.next(message => message.type === 'pong')).toEqual({ type: 'pong', sentAt: 12345, serverTime: time });
  });

  it('rejects forged host commands and invalid keys, while allowing authorized moderation and room ending', async () => {
    const { url } = await start();
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    const listener = await joinRoom(url, created.roomId);
    listener.send({ type: 'note', name: 'Visitor', text: 'The rain sounds good.' });
    const withNote = await host.snapshot(snapshot => snapshot.notes.length === 1);
    for (const command of [
      { type: 'control', action: 'play', hostKey: created.hostKey },
      { type: 'delete-note', id: withNote.notes[0].id },
      { type: 'end' },
    ]) {
      listener.send(command);
      expect(await listener.next(message => message.type === 'error')).toMatchObject({ code: 'host-required' });
    }
    const invalid = socketPeer(url, created.roomId);
    await invalid.open;
    invalid.send({ type: 'hello', hostKey: 'a'.repeat(43) });
    expect(await invalid.next(message => message.type === 'error')).toMatchObject({ code: 'HOST_UNAUTHORIZED' });
    const stillOpen = await joinRoom(url, created.roomId);
    expect(stillOpen.initial.room.revision).toBe(0);
    expect(stillOpen.initial.notes).toHaveLength(1);
    host.send({ type: 'delete-note', id: withNote.notes[0].id });
    expect((await listener.snapshot(snapshot => snapshot.notes.length === 0 && snapshot.listeners >= 2)).notes).toEqual([]);
    host.send({ type: 'end' });
    expect(await listener.next(message => message.type === 'ended')).toMatchObject({ reason: 'The host has ended this room.' });
    const ended = socketPeer(url, created.roomId);
    await ended.open;
    expect(await ended.next(message => message.type === 'ended')).toHaveProperty('reason');
  });

  it('preserves the timeline during host disconnect and restores the host without transferring privileges', async () => {
    let time = 1_000_000;
    const { url } = await start({ now: () => time });
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    const listener = await joinRoom(url, created.roomId);
    host.send({ type: 'control', action: 'play' });
    await listener.snapshot(snapshot => snapshot.room.playing);
    await host.close();
    const away = await listener.snapshot(snapshot => !snapshot.hostOnline);
    expect(away.role).toBe('listener');
    expect(away.room.playing).toBe(true);
    time += 12_000;
    const returned = await joinRoom(url, created.roomId, created.hostKey);
    expect(returned.initial.role).toBe('host');
    expect(positionAt(returned.initial.room, time)).toBe(12);
    expect(returned.initial.room.revision).toBe(1);
  });

  it('persists guestbook content and playback across a process restart without exposing the host key', async () => {
    let time = 2_000_000;
    const directory = mkdtempSync(join(tmpdir(), 'night-signal-test-'));
    temporaryDirectories.push(directory);
    const options = { dbPath: join(directory, 'rooms.sqlite'), now: () => time };
    const first = await start(options);
    const created = await room(first.url);
    const host = await joinRoom(first.url, created.roomId, created.hostKey);
    host.send({ type: 'note', name: '  Night owl  ', text: '<script>alert("hello")</script>', createdAt: 0 });
    const original = await host.snapshot(snapshot => snapshot.notes.length === 1);
    expect(original.notes[0]).toMatchObject({ name: 'Night owl', text: '<script>alert("hello")</script>', createdAt: time });
    host.send({ type: 'control', action: 'seek', position: 22 });
    await host.snapshot(snapshot => snapshot.room.revision === 1);
    host.send({ type: 'control', action: 'play' });
    await host.snapshot(snapshot => snapshot.room.revision === 2);
    await first.application.close();
    time += 5_000;
    const second = await start(options);
    const listener = await joinRoom(second.url, created.roomId);
    expect(listener.initial.notes).toEqual(original.notes);
    expect(positionAt(listener.initial.room, time)).toBe(27);
    expect(JSON.stringify(listener.initial)).not.toContain(created.hostKey);
    const restoredHost = await joinRoom(second.url, created.roomId, created.hostKey);
    expect(restoredHost.initial.role).toBe('host');
  });

  it('enforces guestbook lengths, rate limits, and a bounded history', async () => {
    let time = 3_000_000;
    const { url } = await start({ now: () => time });
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    for (const note of [
      { name: 'a'.repeat(31), text: 'hello' }, { name: 'Night owl', text: 'a'.repeat(281) },
      { name: ' ', text: 'hello' }, { name: 'Night owl', text: ' ' },
    ]) {
      host.send({ type: 'note', ...note });
      expect(await host.next(message => message.type === 'error')).toMatchObject({ code: 'note-invalid' });
    }
    for (let index = 0; index < 5; index++) {
      host.send({ type: 'note', name: 'Night owl', text: `Original ${index}` });
      await host.snapshot(snapshot => snapshot.notes.length === index + 1);
    }
    host.send({ type: 'note', name: 'Night owl', text: 'Too soon' });
    expect(await host.next(message => message.type === 'error')).toMatchObject({ code: 'rate-limited' });
    for (let index = 0; index < NOTE_HISTORY_LIMIT; index++) {
      time += 60_001;
      host.send({ type: 'note', name: 'Night owl', text: `Note ${index}` });
      const latest = await host.snapshot(snapshot => snapshot.notes.at(-1)?.text === `Note ${index}`);
      expect(latest.notes.length).toBeLessThanOrEqual(NOTE_HISTORY_LIMIT);
      if (index === NOTE_HISTORY_LIMIT - 1) {
        expect(latest.notes).toHaveLength(NOTE_HISTORY_LIMIT);
        expect(latest.notes[0].text).toBe('Note 0');
      }
    }
  });

  it('expires unoccupied rooms on access while keeping connected rooms alive', async () => {
    let time = 4_000_000;
    const { application, url } = await start({ now: () => time });
    const vacant = await room(url);
    const occupied = await room(url);
    const host = await joinRoom(url, occupied.roomId, occupied.hostKey);
    time += ROOM_IDLE_MS + 1;
    const expired = socketPeer(url, vacant.roomId);
    await expired.open;
    expect(await expired.next(message => message.type === 'ended')).toHaveProperty('reason');
    const visitor = await joinRoom(url, occupied.roomId);
    expect(visitor.initial.room.id).toBe(occupied.roomId);
    await host.close();
    await visitor.close();
    time += ROOM_IDLE_MS - 1;
    application.sweepExpired();
    const beforeDeadline = await joinRoom(url, occupied.roomId);
    expect(beforeDeadline.initial.role).toBe('listener');
    await beforeDeadline.close();
    time += ROOM_IDLE_MS;
    application.sweepExpired();
    const afterDeadline = socketPeer(url, occupied.roomId);
    await afterDeadline.open;
    expect(await afterDeadline.next(message => message.type === 'ended')).toHaveProperty('reason');
  });

  it('pauses completed tracks and restarts playback from zero on replay', async () => {
    let time = 5_000_000;
    const { url } = await start({ now: () => time });
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    host.send({ type: 'control', action: 'play' });
    await host.snapshot(snapshot => snapshot.room.revision === 1);
    time += 91_000;
    const completed = await host.snapshot(snapshot => snapshot.room.revision === 2);
    expect(completed.room).toMatchObject({ playing: false, position: 90 });
    host.send({ type: 'control', action: 'play' });
    const replay = await host.snapshot(snapshot => snapshot.room.revision === 3);
    expect(replay.room).toMatchObject({ playing: true, position: 0, anchorMs: time });
    // A clock ping arriving before the completion timer must still notify peers.
    time += 91_000;
    host.send({ type: 'ping', sentAt: time });
    expect((await host.snapshot(snapshot => snapshot.room.revision === 4)).room.playing).toBe(false);
    expect(await host.next(message => message.type === 'pong')).toMatchObject({ serverTime: time });
  });

  it('rejects cross-origin room creation and websocket handshakes', async () => {
    const { url } = await start();
    const rejected = await fetch(`${url}/api/rooms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example' }, body: '{"scene":"apartment"}',
    });
    expect(rejected.status).toBe(403);
    const created = await room(url);
    const peer = socketPeer(url, created.roomId, 'https://other.example');
    await expect(peer.open).rejects.toThrow('403');
  });

  it('rejects invalid playback inputs and unknown preference messages without mutating shared state', async () => {
    const { url } = await start();
    const created = await room(url);
    const host = await joinRoom(url, created.roomId, created.hostKey);
    for (const command of [
      { type: 'control', action: 'seek', position: -1 },
      { type: 'control', action: 'seek', position: 91 },
      { type: 'control', action: 'track', trackId: 'untrusted-source' },
      { type: 'volume', volume: 0.2 },
    ]) {
      host.send(command);
      expect(await host.next(message => message.type === 'error')).toHaveProperty('code', 'invalid-message');
    }
    const listener = await joinRoom(url, created.roomId);
    expect(listener.initial.room).toMatchObject({ position: 0, revision: 0, playing: false });
    expect(listener.initial.room).not.toHaveProperty('volume');
  });
});
