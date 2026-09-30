import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Eye, Headphones, Pause, Play, Radio, Signal, Volume2, VolumeX, X } from 'lucide-react';
import { SCENES, sceneFor, type SceneId } from './scenes';
import { Scene } from './Scene';
import { useSoundscape } from './useSoundscape';

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
    const hash = () => setSceneId(initialScene());
    window.addEventListener('keydown', escape);
    window.addEventListener('hashchange', hash);
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('hashchange', hash); };
  }, []);
  useEffect(() => { document.title = `${scene.name} · Night Signal`; }, [scene.name]);

  function chooseScene(id: SceneId) {
    setSceneId(id);
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
  }

  return <div className={`app theme-${scene.id} ${hidden ? 'interface-hidden' : ''} ${motionPaused || !pageVisible ? 'motion-paused' : ''}`}>
    <a className="skip-link" href="#main">Skip to the scene</a>
    <header className="site-header interface">
      <a href="/" className="brand" aria-label="Night Signal home"><span className="brand-symbol"><i/><i/><i/><i/></span><span>night signal<span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#environments">The scenes</a><button onClick={() => setAbout(true)}>About the signal</button></nav>
      <div className="header-right"><span className="header-caption"><span className="status-dot"/> A LITTLE QUIET FOR THE LATE HOURS</span></div>
    </header>

    <main id="main">
      <section className="listening-room" aria-label={scene.name}>
        <div className="scene-canvas"><Scene scene={scene.id}/></div>
        <div className="scene-shade"/>
        <div className="scene-grain"/>
        <div className="room-copy interface">
          <div className="eyebrow"><span className="small-line"/> {playing ? 'SETTLE IN. STAY AS LONG AS YOU LIKE.' : 'TUNE OUT. SETTLE IN.'}</div>
          <h1>{scene.name.split(' ').slice(0, -1).join(' ')}<br/><em>{scene.name.split(' ').at(-1)}</em></h1>
          <p className="scene-description">{scene.lines[0]}<br/>{scene.lines[1]}</p>
          <button className="primary-button" onClick={listen} disabled={sound.status === 'loading'}>{listenLabel}{playing ? <Pause size={16}/> : <Headphones size={17}/>}</button>
          <p className="fine-print">Loops quietly until you stop it. Nothing to sign up for.</p>
        </div>
        <div className="scene-meta interface"><span className="scene-coordinate">{scene.coordinate}</span><div className="scene-actions"><button onClick={() => setMotionPaused(!motionPaused)} aria-label={motionPaused ? 'Resume scene motion' : 'Pause scene motion'} title={motionPaused ? 'Resume scene motion' : 'Pause scene motion'}>{motionPaused ? <Play size={13}/> : <Pause size={13}/>}<span>{motionPaused ? 'Motion off' : 'Motion on'}</span></button><button onClick={() => setHidden(true)}><Eye size={14}/><span>Hide interface</span></button></div></div>
      </section>

      <section className="player interface" aria-label="Soundscape player">
        <div className="track-art"><Radio size={23}/><span/></div>
        <div className="track-info"><span className="micro-label" role="status">{playing ? 'NOW PLAYING' : sound.status === 'loading' ? 'TUNING IN' : sound.status === 'paused' ? 'PAUSED' : 'THE SOUND OF THIS SCENE'}</span><strong>{scene.soundscape}</strong><span>Night Signal originals <span className="track-dot">·</span> {scene.tag}</span></div>
        <div className="transport">
          {started ? <button className="play-button" aria-label={playing ? 'Pause soundscape' : 'Play soundscape'} onClick={sound.toggle} disabled={sound.status === 'loading'}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button>
            : <button className="listen-button" onClick={sound.start}><Headphones size={17}/>{listenLabel}</button>}
        </div>
        <div className="mixer" role="group" aria-label="Soundscape mix">{scene.layers.map(layer => <label className="mixer-layer" key={layer.id}><span>{layer.label}</span><input type="range" min="0" max="1" step="0.01" value={sound.levels[layer.id] ?? layer.defaultLevel} onChange={event => sound.setLevel(layer.id, Number(event.target.value))}/></label>)}</div>
        <div className="local-volume"><button className="icon-button" onClick={() => sound.setMuted(!sound.muted)} aria-label={sound.muted ? 'Unmute' : 'Mute'}>{sound.muted || sound.volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><input aria-label="Overall volume" type="range" min="0" max="1" step="0.01" value={sound.muted ? 0 : sound.volume} onChange={event => { sound.setMuted(false); sound.setVolume(Number(event.target.value)); }}/></div>
      </section>
      {sound.error && <div className="error-banner interface" role="alert">{sound.error}</div>}

      <section id="environments" className="environments interface" aria-labelledby="environments-heading">
        <div className="section-heading"><div><span className="eyebrow">THREE PLACES. ONE LONG NIGHT.</span><h2 id="environments-heading">Find your kind of quiet.</h2></div><p>A change of scenery, without going anywhere.<ArrowDown size={15}/></p></div>
        <div className="environment-grid">{SCENES.map((item, index) => <button key={item.id} className={`environment-card ${scene.id === item.id ? 'selected' : ''}`} onClick={() => chooseScene(item.id)} aria-pressed={scene.id === item.id}>
          <div className="environment-image"><Scene scene={item.id} miniature/><span className="room-number">0{index + 1}</span>{scene.id === item.id && <span className="selected-label"><span className="status-dot"/>YOU ARE HERE</span>}</div>
          <div className="environment-caption"><div><h3>{item.name}</h3><p>{item.description}</p></div><ArrowUpRight size={18}/></div><div className="environment-tag">{item.tag}</div>
        </button>)}</div>
      </section>
    </main>
    <footer className="site-footer interface"><span className="footer-mark"><Signal size={14}/> Somewhere, it is still raining.</span><span>NO FEED. NO RUSH. JUST HERE.</span><button onClick={() => setAbout(true)}>Made for the in-between hours <ArrowUpRight size={12}/></button></footer>
    {hidden && <button className="restore-interface" onClick={() => setHidden(false)}><Eye size={16}/> Show interface <kbd>Esc</kbd></button>}

    {about && <Dialog title="A little quiet for the late hours." onClose={() => setAbout(false)}><p>Night Signal is a place to put the day down. Pick a scene, press <strong>Start listening</strong>, and let it run while you read, work, or drift off.</p><div className="about-rule"/><p>Every scene has two layers: the sound of the place itself, and a little music behind it. Set each one where you like it, or turn one all the way down. Your mix is remembered on this device.</p><p className="subtle">The soundscapes are original, procedurally composed loops and the scenes are original illustrations. No accounts, no tracking, nothing to upload. Reduced-motion preferences are respected, and you can pause all scene motion.</p><a className="text-link" href="https://github.com/TheRealestNwah/night-signal" target="_blank" rel="noreferrer">Source, credits & documentation <ArrowUpRight size={14}/></a></Dialog>}
  </div>;
}
