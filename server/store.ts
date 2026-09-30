import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { GuestNote, RoomState, SceneId, TrackId } from '../shared/protocol.ts';

export interface StoredRoom {
  state: RoomState;
  hostHash: string;
  lastSeenMs: number;
}

interface RoomRow {
  id: string;
  scene: SceneId;
  track_id: TrackId;
  playing: number;
  position: number;
  anchor_ms: number;
  revision: number;
  host_hash: string;
  last_seen_ms: number;
}

/** A single application instance owns the timeline and this SQLite database. */
export class RoomStore {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        host_hash TEXT NOT NULL,
        scene TEXT NOT NULL,
        track_id TEXT NOT NULL,
        playing INTEGER NOT NULL,
        position REAL NOT NULL,
        anchor_ms INTEGER NOT NULL,
        revision INTEGER NOT NULL,
        last_seen_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS notes_by_room ON notes(room_id, created_at);
      CREATE INDEX IF NOT EXISTS rooms_by_activity ON rooms(last_seen_ms);
    `);
  }

  get(id: string): StoredRoom | undefined {
    const row = this.db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as unknown as RoomRow | undefined;
    if (!row) return undefined;
    return {
      state: {
        id: row.id, scene: row.scene, trackId: row.track_id,
        playing: Boolean(row.playing), position: row.position,
        anchorMs: row.anchor_ms, revision: row.revision,
      },
      hostHash: row.host_hash,
      lastSeenMs: row.last_seen_ms,
    };
  }

  create(state: RoomState, hostHash: string, now: number): void {
    this.db.prepare(`
      INSERT INTO rooms (id, host_hash, scene, track_id, playing, position, anchor_ms, revision, last_seen_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(state.id, hostHash, state.scene, state.trackId, Number(state.playing), state.position, state.anchorMs, state.revision, now);
  }

  save(state: RoomState, now: number): void {
    this.db.prepare(`UPDATE rooms SET track_id = ?, playing = ?, position = ?, anchor_ms = ?, revision = ?, last_seen_ms = ? WHERE id = ?`)
      .run(state.trackId, Number(state.playing), state.position, state.anchorMs, state.revision, now, state.id);
  }

  touch(id: string, now: number): void {
    this.db.prepare('UPDATE rooms SET last_seen_ms = ? WHERE id = ?').run(now, id);
  }

  inactiveBefore(cutoff: number): string[] {
    return this.db.prepare('SELECT id FROM rooms WHERE last_seen_ms <= ?').all(cutoff).map(row => String(row.id));
  }

  count(): number {
    return Number(this.db.prepare('SELECT COUNT(*) AS count FROM rooms').get()?.count);
  }

  remove(id: string): void {
    this.db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  }

  notes(roomId: string): GuestNote[] {
    return this.db.prepare('SELECT id, name, body AS text, created_at AS createdAt FROM notes WHERE room_id = ? ORDER BY created_at, rowid')
      .all(roomId) as unknown as GuestNote[];
  }

  addNote(roomId: string, note: GuestNote, historyLimit: number): void {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO notes (id, room_id, name, body, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(note.id, roomId, note.name, note.text, note.createdAt);
      this.db.prepare(`DELETE FROM notes WHERE room_id = ? AND id NOT IN (
        SELECT id FROM notes WHERE room_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?
      )`).run(roomId, roomId, historyLimit);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  removeNote(roomId: string, id: string): boolean {
    return Number(this.db.prepare('DELETE FROM notes WHERE room_id = ? AND id = ?').run(roomId, id).changes) > 0;
  }

  close(): void { this.db.close(); }
}
