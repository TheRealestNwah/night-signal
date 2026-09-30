export type SceneId = 'apartment' | 'highway' | 'arcade' | 'train' | 'cabin' | 'lighthouse';
export type LayerKind = 'ambience' | 'music';
/** One seamless loop. A scene's layers play together and are mixed by the listener. */
/** A third-party recording a layer is made from; layers without one are original and generated. */
export interface Credit { title: string; by: string; url: string }
export interface Layer { id: string; kind: LayerKind; label: string; url: string; defaultLevel: number; credit?: Credit }
export interface SceneInfo {
  id: SceneId; name: string; soundscape: string; description: string; tag: string;
  layers: Layer[];
}

export const SCENES: SceneInfo[] = [
  {
    id: 'apartment', name: 'Rainy Apartment', soundscape: 'Windowlight', description: 'The city can wait.', tag: 'Rain on glass / lofi',
    layers: [
      { id: 'apartment-rain', kind: 'ambience', label: 'Rain on the window', url: '/audio/apartment-rain.wav', defaultLevel: 0.25,
        credit: { title: 'Thunderstorm 2', by: 'loswin23', url: 'https://pixabay.com/sound-effects/film-special-effects-thunderstorm-2-516370/' } },
      { id: 'apartment-lofi', kind: 'music', label: 'Lofi', url: '/audio/apartment-lofi.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'highway', name: 'Midnight Highway', soundscape: 'Last Exit', description: 'Follow the disappearing lines.', tag: 'Road hum / soft synth',
    layers: [
      { id: 'highway-road', kind: 'ambience', label: 'Road hum', url: '/audio/highway-road.wav', defaultLevel: 0.25,
        credit: { title: 'Inside Car (Driving)', by: 'Fabrizio84', url: 'https://pixabay.com/sound-effects/city-inside-car-driving-24677/' } },
      { id: 'highway-synth', kind: 'music', label: 'Soft synth', url: '/audio/highway-synth.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'arcade', name: 'Empty Arcade', soundscape: 'Afterimage', description: 'Stay a little past closing.', tag: 'Neon hum / gentle chimes',
    layers: [
      { id: 'arcade-hum', kind: 'ambience', label: 'Neon hum', url: '/audio/arcade-hum.wav', defaultLevel: 0.25 },
      { id: 'arcade-chimes', kind: 'music', label: 'Chimes', url: '/audio/arcade-chimes.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'train', name: 'Night Train', soundscape: 'Sleeper Car', description: 'Somewhere between stations.', tag: 'Rails / warm keys',
    layers: [
      { id: 'train-rails', kind: 'ambience', label: 'Rails', url: '/audio/train-rails.wav', defaultLevel: 0.25,
        credit: { title: 'railway -Train', by: 'IMGMIDI', url: 'https://pixabay.com/sound-effects/film-special-effects-railway-train-339502/' } },
      { id: 'train-keys', kind: 'music', label: 'Keys', url: '/audio/train-keys.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'cabin', name: 'Snowed-In Cabin', soundscape: 'Hearthside', description: 'Nowhere to be until spring.', tag: 'Fire and wind / felt piano',
    layers: [
      { id: 'cabin-fire', kind: 'ambience', label: 'Fire and wind', url: '/audio/cabin-fire.wav', defaultLevel: 0.25 },
      { id: 'cabin-piano', kind: 'music', label: 'Felt piano', url: '/audio/cabin-piano.wav', defaultLevel: 0.5 },
    ],
  },
  {
    id: 'lighthouse', name: 'Lighthouse Keeper', soundscape: 'Night Watch', description: 'Keep the light for a while.', tag: 'Waves / drone and bell',
    layers: [
      { id: 'lighthouse-waves', kind: 'ambience', label: 'Waves', url: '/audio/lighthouse-waves.wav', defaultLevel: 0.25 },
      { id: 'lighthouse-drone', kind: 'music', label: 'Drone and bell', url: '/audio/lighthouse-drone.wav', defaultLevel: 0.5 },
    ],
  },
];

export function sceneFor(id: string | null | undefined): SceneInfo {
  return SCENES.find(scene => scene.id === id) ?? SCENES[0];
}
