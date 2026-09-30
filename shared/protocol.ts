export type SceneId = 'apartment' | 'highway' | 'arcade';
export const SCENES: { id: SceneId; name: string; subtitle: string; description: string; tag: string }[] = [
  { id: 'apartment', name: 'Rainy Apartment', subtitle: 'RAIN ON THE WINDOWS. NOWHERE TO BE.', description: 'The city can wait.', tag: 'Rain / warm ambient' },
  { id: 'highway', name: 'Midnight Highway', subtitle: 'A LONG WAY HOME. ALL THE TIME IN THE WORLD.', description: 'Follow the disappearing lines.', tag: 'Night drive / soft synth' },
  { id: 'arcade', name: 'Empty Arcade', subtitle: 'ONE MORE LIFE. NO ONE KEEPING SCORE.', description: 'Stay a little past closing.', tag: 'After hours / gentle tones' },
];
export const TRACKS = [
  { id: 'windowlight', title: 'Windowlight', artist: 'Night Signal originals', url: '/audio/windowlight.wav', duration: 90, scene: 'apartment' },
  { id: 'last-exit', title: 'Last Exit', artist: 'Night Signal originals', url: '/audio/last-exit.wav', duration: 90, scene: 'highway' },
  { id: 'afterimage', title: 'Afterimage', artist: 'Night Signal originals', url: '/audio/afterimage.wav', duration: 90, scene: 'arcade' },
] as const;
export type TrackId = typeof TRACKS[number]['id'];
export interface RoomState {
  id: string;
  scene: SceneId;
  trackId: TrackId;
  playing: boolean;
  position: number;
  anchorMs: number;
  revision: number;
}
export interface GuestNote { id: string; name: string; text: string; createdAt: number }
export interface Snapshot {
  type: 'snapshot'; room: RoomState; notes: GuestNote[]; listeners: number;
  hostOnline: boolean; role: 'host' | 'listener'; serverTime: number;
}
export type ClientMessage =
  | { type: 'hello'; hostKey?: string }
  | { type: 'ping'; sentAt: number }
  | { type: 'control'; action: 'play' | 'pause' | 'seek' | 'track'; position?: number; trackId?: TrackId }
  | { type: 'note'; name: string; text: string }
  | { type: 'delete-note'; id: string }
  | { type: 'end' };
export type ServerMessage = Snapshot
  | { type: 'pong'; sentAt: number; serverTime: number }
  | { type: 'error'; message: string; code?: string }
  | { type: 'ended'; reason: string };
export function trackFor(id: string) { return TRACKS.find(track => track.id === id) ?? TRACKS[0]; }
export function positionAt(room: RoomState, serverTime: number) {
  return Math.max(0, Math.min(trackFor(room.trackId).duration, room.position + (room.playing ? Math.max(0, serverTime - room.anchorMs) / 1000 : 0)));
}
