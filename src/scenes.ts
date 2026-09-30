export type SceneId = 'apartment' | 'highway' | 'arcade';
export type LayerKind = 'ambience' | 'music';
/** One seamless loop. A scene's layers play together and are mixed by the listener. */
export interface Layer { id: string; kind: LayerKind; label: string; url: string; defaultLevel: number }
export interface SceneInfo {
  id: SceneId; name: string; soundscape: string; description: string; tag: string;
  layers: Layer[];
}

export const SCENES: SceneInfo[] = [
  {
    id: 'apartment', name: 'Rainy Apartment', soundscape: 'Windowlight', description: 'The city can wait.', tag: 'Rain on glass / lofi',
    layers: [
      { id: 'apartment-rain', kind: 'ambience', label: 'Rain on the window', url: '/audio/apartment-rain.wav', defaultLevel: 0.25 },
      { id: 'apartment-lofi', kind: 'music', label: 'Lofi', url: '/audio/apartment-lofi.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'highway', name: 'Midnight Highway', soundscape: 'Last Exit', description: 'Follow the disappearing lines.', tag: 'Road hum / soft synth',
    layers: [
      { id: 'highway-road', kind: 'ambience', label: 'Road hum', url: '/audio/highway-road.wav', defaultLevel: 0.25 },
      { id: 'highway-synth', kind: 'music', label: 'Soft synth', url: '/audio/highway-synth.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'arcade', name: 'Empty Arcade', soundscape: 'Afterimage', description: 'Stay a little past closing.', tag: 'Machine hum / gentle chimes',
    layers: [
      { id: 'arcade-hum', kind: 'ambience', label: 'Machine hum', url: '/audio/arcade-hum.wav', defaultLevel: 0.25 },
      { id: 'arcade-chimes', kind: 'music', label: 'Chimes', url: '/audio/arcade-chimes.wav', defaultLevel: 0.5 },
    ],
  },
];

export function sceneFor(id: string | null | undefined): SceneInfo {
  return SCENES.find(scene => scene.id === id) ?? SCENES[0];
}
