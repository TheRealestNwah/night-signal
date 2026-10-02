import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Eye, Headphones, Pause, Play, Radio, Volume2, VolumeX, X } from 'lucide-react';
import { SCENES, sceneFor, type SceneId } from './scenes';
import { Scene } from './Scene';
import { useSoundscape } from './useSoundscape';

const credits = SCENES.flatMap(scene => scene.layers.flatMap(layer => layer.credit ? [{ scene: scene.name, label: layer.label, credit: layer.credit }] : []));

function initialScene(): SceneId { return sceneFor(location.hash.slice(1)).id; }

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-inner"><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div>
  </dialog>;
}

export default function App() {
  const [sceneId, setSceneId] = useState<SceneId>(initialScene);
  const [about, setAbout] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const scene = sceneFor(sceneId);
  const sound = useSoundscape(scene);
  const started = sound.status !== 'idle' && sound.status !== 'error';
  const playing = sound.status === 'playing';
  const listenLabel = sound.status === 'error' ? 'Retry audio' : sound.status === 'loading' ? 'Tuning in…' : playing ? 'Pause' : sound.status === 'paused' ? 'Resume' : 'Start listening';
  const listen = started ? sound.toggle : sound.start;

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setHidden(false); };
    // Section anchors such as #main and #environments also change the hash. Only scene ids switch scenes;
    // after the browser has scrolled to a section, restore the previous URL so it still names the scene.
    const hash = (event: HashChangeEvent) => {
      const id = location.hash.slice(1);
      if (SCENES.some(scene => scene.id === id)) setSceneId(id as SceneId);
      else if (id) history.replaceState(null, '', new URL(event.oldURL).hash || location.pathname);
    };
    window.addEventListener('keydown', escape);
    window.addEventListener('hashchange', hash);
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('hashchange', hash); };
  }, []);
  useEffect(() => { document.title = `${scene.name} · Night Signal`; }, [scene.name]);
  // Tint the mobile browser bar to match the scene's palette.
  useEffect(() => {
    const background = getComputedStyle(document.querySelector('.app')!).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
  }, [scene.id]);

  function chooseScene(id: SceneId) {
    setSceneId(id);
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
  }

  return <div className={`app theme-${scene.id} ${hidden ? 'interface-hidden' : ''} ${motionPaused || !pageVisible ? 'motion-paused' : ''}`}>
    <a className="skip-link" href="#main">Skip to the scene</a>
    <header className="site-header interface">
      <a href="/" className="brand" aria-label="Night Signal home"><span className="brand-symbol"><i/><i/><i/><i/></span><span>night signal<span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#environments">The scenes</a><button onClick={() => setAbout(true)}>About</button></nav>
    </header>

    <main id="main">
      <section className="listening-room" aria-label={scene.name}>
        <div className="scene-canvas" key={scene.id}><Scene scene={scene.id}/></div>
        <div className="scene-glow"/>
        <div className="scene-shade"/>
        <div className="scene-grain"/>
        <div className="room-copy interface">
          <h1>{scene.name.split(' ').slice(0, -1).join(' ')} <em>{scene.name.split(' ').at(-1)}</em></h1>
          <button className="primary-button" onClick={listen} disabled={sound.status === 'loading'}>{listenLabel}{playing ? <Pause size={16}/> : <Headphones size={17}/>}</button>
        </div>
        <div className="room-dock interface">
          <div className="scene-actions"><button onClick={() => setMotionPaused(!motionPaused)} aria-label={motionPaused ? 'Resume scene motion' : 'Pause scene motion'} title={motionPaused ? 'Resume scene motion' : 'Pause scene motion'}>{motionPaused ? <Play size={13}/> : <Pause size={13}/>}<span>{motionPaused ? 'Motion off' : 'Motion on'}</span></button><button onClick={() => setHidden(true)}><Eye size={14}/><span>Hide interface</span></button></div>
          <section className="player" aria-label="Soundscape player">
            <div className="track-art"><Radio size={23}/></div>
            <div className="track-info"><span className="micro-label" role="status">{playing ? 'Now playing' : sound.status === 'loading' ? 'Tuning in' : sound.status === 'paused' ? 'Paused' : ''}</span><strong>{scene.soundscape}</strong><span>{scene.tag}</span></div>
            <div className="transport">
              {started ? <button className="play-button" aria-label={playing ? 'Pause soundscape' : 'Play soundscape'} onClick={sound.toggle} disabled={sound.status === 'loading'}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button>
                : <button className="listen-button" onClick={sound.start}><Headphones size={17}/>{listenLabel}</button>}
            </div>
            <div className="mixer" role="group" aria-label="Soundscape mix">{scene.layers.map(layer => <label className="mixer-layer" key={layer.id}><span>{layer.label}</span><input type="range" min="0" max="1" step="0.01" value={sound.levels[layer.id] ?? layer.defaultLevel} onChange={event => sound.setLevel(layer.id, Number(event.target.value))}/></label>)}</div>
            <div className="local-volume"><button className="icon-button" onClick={() => sound.setMuted(!sound.muted)} aria-label={sound.muted ? 'Unmute' : 'Mute'}>{sound.muted || sound.volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><input aria-label="Overall volume" type="range" min="0" max="1" step="0.01" value={sound.muted ? 0 : sound.volume} onChange={event => { sound.setMuted(false); sound.setVolume(Number(event.target.value)); }}/></div>
          </section>
          {sound.error && <div className="error-banner" role="alert">{sound.error}</div>}
        </div>
      </section>

      <section id="environments" className="environments interface" aria-label="Scenes">
        <div className="environment-grid">{SCENES.map((item, index) => <button key={item.id} className={`environment-card theme-${item.id} ${scene.id === item.id ? 'selected' : ''}`} onClick={() => chooseScene(item.id)} aria-pressed={scene.id === item.id}>
          <div className="environment-image"><Scene scene={item.id} miniature/><span className="room-number">0{index + 1}</span>{scene.id === item.id && <span className="selected-label"><span className="status-dot"/>You are here</span>}</div>
          <div className="environment-caption"><div><h3>{item.name}</h3><p>{item.description}</p></div><ArrowUpRight size={18}/></div><div className="environment-tag">{item.tag}</div>
        </button>)}</div>
      </section>
    </main>
    {hidden && <button className="restore-interface" onClick={() => setHidden(false)}><Eye size={16}/> Show interface <kbd>Esc</kbd></button>}

    {about && <Dialog title="A little quiet for the late hours." onClose={() => setAbout(false)}><p>Night Signal is a place to put the day down. Pick a scene, press <strong>Start listening</strong>, and let it run while you read, work, or drift off.</p><div className="about-rule"/><p>Every scene has two layers: the sound of the place itself, and a little music behind it. Set each one where you like it, or turn one all the way down. Your mix is remembered on this device.</p><p className="subtle">The music and most of the ambience are original, procedurally composed loops, and the scenes are original illustrations. A few ambience layers are recordings used under the Pixabay Content License:</p><ul className="credits">{credits.map(({ scene: name, label, credit }) => <li key={credit.url}>{name}, {label.toLowerCase()}: <a href={credit.url} target="_blank" rel="noreferrer">“{credit.title}”</a> by {credit.by}</li>)}</ul><p className="subtle">No accounts, no tracking, nothing to upload. Reduced-motion preferences are respected, and you can pause all scene motion.</p><a className="text-link" href="https://github.com/TheRealestNwah/night-signal" target="_blank" rel="noreferrer">Source, credits & documentation <ArrowUpRight size={14}/></a></Dialog>}
  </div>;
}
