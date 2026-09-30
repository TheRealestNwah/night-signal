import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronRight, Copy, Eye, Headphones, Link, MessageSquare, Pause, Play, Radio, RefreshCw, Signal, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { SCENES, TRACKS, positionAt, trackFor, type SceneId } from '../shared/protocol';
import { Scene } from './Scene';
import { useRoom } from './useRoom';
import { useAudio } from './useAudio';

type Modal = 'about' | 'share' | 'guestbook' | 'end' | null;
const storageKey = (id: string) => `night-signal:host:${id}`;
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
function initialRoom() { return /^\/room\/([a-zA-Z0-9_-]+)\/?$/.exec(location.pathname)?.[1] ?? null; }
function initialHostKey() {
  const id = initialRoom();
  if (!id) return undefined;
  const key = new URLSearchParams(location.hash.slice(1)).get('host');
  if (key) {
    try { localStorage.setItem(storageKey(id), key); } catch { /* Session still works without storage. */ }
    history.replaceState(null, '', location.pathname);
    return key;
  }
  try { return localStorage.getItem(storageKey(id)) ?? undefined; } catch { return undefined; }
}

function Dialog({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`dialog ${className}`} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-inner"><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div>
  </dialog>;
}

export default function App() {
  const [roomId, setRoomId] = useState(initialRoom);
  const [hostKey, setHostKey] = useState(initialHostKey);
  const [selectedScene, setSelectedScene] = useState<SceneId>('apartment');
  const [modal, setModal] = useState<Modal>(null);
  const [hidden, setHidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [displayName, setDisplayName] = useState(() => { try { return localStorage.getItem('night-signal:name') ?? ''; } catch { return ''; } });
  const [draft, setDraft] = useState('');
  const [pendingNote, setPendingNote] = useState<{ text: string; since: number } | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const room = useRoom(roomId, hostKey);
  const audio = useAudio(room.snapshot?.room ?? null, room.serverNow);
  const state = room.snapshot?.room ?? null;
  const scene = state?.scene ?? selectedScene;
  const sceneInfo = SCENES.find(item => item.id === scene)!;
  const currentTrack = state ? trackFor(state.trackId) : TRACKS.find(track => track.scene === scene)!;
  const isHost = room.snapshot?.role === 'host';
  const connected = room.connection === 'connected';
  const notes = room.snapshot?.notes ?? [];
  const progress = state ? positionAt(state, room.serverNow()) : 0;
  const invitation = roomId ? `${location.origin}/room/${roomId}` : '';
  const terminal = roomId && (room.connection === 'ended' || room.error?.toLowerCase().includes('host key'));

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setHidden(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  useEffect(() => {
    if (pendingNote && notes.some(note => note.text === pendingNote.text && note.createdAt >= pendingNote.since - 5000 && note.name === displayName.trim())) {
      setDraft(''); setPendingNote(null);
    }
    if (pendingNote && room.error) setPendingNote(null);
  }, [notes, pendingNote, room.error, displayName]);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(''), 2500); return () => clearTimeout(timer); }, [copied]);
  useEffect(() => { document.title = roomId ? `${sceneInfo.name} · Night Signal` : 'Night Signal — A little company for the late hours'; }, [sceneInfo.name, roomId]);

  async function createRoom() {
    setCreating(true); setCreateError(null);
    try {
      const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: selectedScene }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The room could not be opened. Try again in a moment.');
      try { localStorage.setItem(storageKey(data.roomId), data.hostKey); } catch { /* Recovery link remains available this session. */ }
      history.pushState(null, '', `/room/${data.roomId}`);
      setHostKey(data.hostKey); setRoomId(data.roomId);
    } catch (error) { setCreateError(error instanceof Error ? error.message : 'Could not reach Night Signal. Please try again.'); }
    finally { setCreating(false); }
  }
  async function beginListening() {
    await audio.enable();
    if (isHost && !state?.playing) room.send({ type: 'control', action: 'play' });
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); } catch { setCopied('Select and copy the link below.'); }
  }
  function postNote(event: FormEvent) {
    event.preventDefault(); room.clearError();
    if (room.send({ type: 'note', name: displayName.trim(), text: draft.trim() })) {
      try { localStorage.setItem('night-signal:name', displayName.trim()); } catch { /* Optional preference. */ }
      setPendingNote({ text: draft.trim(), since: room.serverNow() });
    }
  }
  function seek(value: number) { room.send({ type: 'control', action: 'seek', position: value }); setScrub(null); }

  return <div className={`app theme-${scene} ${hidden ? 'interface-hidden' : ''} ${motionPaused || !pageVisible ? 'motion-paused' : ''}`}>
    <a className="skip-link" href="#main">Skip to listening room</a>
    <header className="site-header interface">
      <a href="/" className="brand" aria-label="Night Signal home"><span className="brand-symbol"><i/><i/><i/><i/></span><span>night signal<span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#environments">The rooms</a><button onClick={() => setModal('about')}>About the signal</button></nav>
      <div className="header-right">{roomId ? <button className="invite-button" onClick={() => setModal('share')} disabled={!connected}><Link size={14}/> Invite a friend <ArrowUpRight size={14}/></button> : <span className="header-caption"><span className="status-dot"/> A LITTLE COMPANY FOR THE LATE HOURS</span>}</div>
    </header>

    <main id="main">
      <section className="listening-room" aria-label={sceneInfo.name}>
        <div className="scene-canvas"><Scene scene={scene}/></div>
        <div className="scene-shade"/>
        <div className="scene-grain"/>
        <div className="room-copy interface">
          <div className="eyebrow"><span className="small-line"/> {roomId ? (isHost ? 'YOUR ROOM · MAKE YOURSELF AT HOME' : 'COME ON IN · THE DOOR IS OPEN') : 'TUNE OUT. SETTLE IN.'}</div>
          <h1>{sceneInfo.name.split(' ').slice(0, -1).join(' ')}<br/><em>{sceneInfo.name.split(' ').at(-1)}</em></h1>
          <p className="scene-description">{scene === 'apartment' ? <>Rain on the windows.<br/>A little warmth on your frequency.</> : scene === 'highway' ? <>Nothing ahead but the open road.<br/>Let the night take the long way home.</> : <>The last game has ended.<br/>Some things stay on after closing.</>}</p>
          {!roomId ? <><button className="primary-button open-room" onClick={createRoom} disabled={creating}>{creating ? 'Opening your room…' : 'Open a listening room'}<ArrowUpRight size={18}/></button><p className="fine-print">Just you, or a few good friends. No account needed.</p>{createError && <p className="inline-error" role="alert">{createError}</p>}</> : terminal ? <div className="room-ended" role="status"><p>{room.error || 'This room has closed. There is always another quiet corner.'}</p><a className="primary-button" href="/">Find a new room <ArrowUpRight size={16}/></a></div> : <div className="room-presence"><span className={`status-dot ${connected ? '' : 'disconnected'}`}/><span>{connected ? `${room.snapshot?.listeners ?? 1} ${(room.snapshot?.listeners ?? 1) === 1 ? 'person' : 'people'} in this little corner` : room.connection === 'connecting' ? 'Opening the door…' : 'Finding the signal again…'}</span>{isHost && <span className="host-badge">HOST</span>}</div>}
        </div>
        <div className="scene-meta interface"><span className="scene-coordinate">{scene === 'apartment' ? '40°43′ N  /  A WINDOW SOMEWHERE' : scene === 'highway' ? 'MILE 023  /  HEADING HOME' : 'INSERT COIN  /  STAY A WHILE'}</span><div className="scene-actions"><button onClick={() => setMotionPaused(!motionPaused)} aria-label={motionPaused ? 'Resume scene motion' : 'Pause scene motion'} title={motionPaused ? 'Resume scene motion' : 'Pause scene motion'}>{motionPaused ? <Play size={13}/> : <Pause size={13}/>}<span>{motionPaused ? 'Motion off' : 'Motion on'}</span></button><button onClick={() => setHidden(true)}><Eye size={14}/><span>Hide interface</span></button></div></div>
      </section>

      <section className="player interface" aria-label="Audio player">
        <div className="track-art"><Radio size={23}/><span/></div>
        <div className="track-info"><span className="micro-label">{roomId ? (state?.playing ? 'ON THE FREQUENCY' : 'READY WHEN YOU ARE') : 'THE SOUND OF THIS ROOM'}</span><strong>{currentTrack.title}</strong><span>Night Signal originals <span className="track-dot">·</span> {scene === 'apartment' ? 'Rain & ambient' : scene === 'highway' ? 'Soft synth' : 'Gentle tones'}</span></div>
        <div className="transport">
          {!roomId ? <div className="preview-hint"><Headphones size={17}/><span>Your quiet starts here.</span></div> : !audio.enabled || audio.status === 'error' ? <button className="listen-button" onClick={beginListening} disabled={!connected || !!terminal}><Headphones size={17}/>{audio.status === 'error' ? 'Retry audio' : 'Start listening'}</button> : <>
            {isHost ? <button className="play-button" aria-label={state?.playing ? 'Pause shared playback' : 'Play shared playback'} onClick={() => room.send({ type: 'control', action: state?.playing ? 'pause' : 'play' })} disabled={!connected}>{state?.playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button> : <div className={`listening-wave ${state?.playing ? 'active' : ''}`} aria-label={state?.playing ? 'Playing with the room' : 'Host has paused playback'}><i/><i/><i/><i/><i/></div>}
            <div className="timeline"><div className="time-labels"><span>{formatTime(scrub ?? progress)}</span><span>{formatTime(currentTrack.duration)}</span></div><input aria-label="Shared playback position" type="range" min="0" max={currentTrack.duration} step="0.1" value={scrub ?? progress} disabled={!isHost || !connected} onChange={event => setScrub(Number(event.target.value))} onPointerUp={event => seek(Number(event.currentTarget.value))} onKeyUp={event => { if (['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key)) seek(Number(event.currentTarget.value)); }}/></div>
          </>}
        </div>
        <div className="local-volume"><button className="icon-button" onClick={() => audio.setMuted(!audio.muted)} aria-label={audio.muted ? 'Unmute your audio' : 'Mute your audio'}>{audio.muted || audio.volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><input aria-label="Your volume" title="Only changes your volume" type="range" min="0" max="1" step="0.01" value={audio.muted ? 0 : audio.volume} onChange={event => { audio.setMuted(false); audio.setVolume(Number(event.target.value)); }}/></div>
        <button className="guestbook-button" onClick={() => setModal('guestbook')} disabled={!roomId || !!terminal}><MessageSquare size={17}/><span>Guestbook</span>{notes.length > 0 && <span className="note-count">{notes.length}</span>}<ChevronRight size={14}/></button>
      </section>
      {roomId && <div className="connection-strip interface" role="status"><span><span className={`status-dot ${connected ? '' : 'disconnected'}`}/>{connected ? (audio.enabled ? (audio.status === 'loading' ? 'Audio is loading…' : audio.status === 'error' ? 'Audio needs your attention' : 'Connected · following the room') : 'Connected · tap Start listening to enable audio') : room.connection === 'ended' ? 'Room closed' : 'Connection interrupted · retrying automatically'}</span>{!connected && !terminal && <button onClick={room.retry}><RefreshCw size={12}/> Retry now</button>}{connected && !room.snapshot?.hostOnline && <span>Host is away · the room keeps its place</span>}</div>}
      {(audio.error || room.error) && !terminal && <div className="error-banner interface" role="alert">{audio.error || room.error}<button className="icon-button" aria-label="Dismiss room error" onClick={room.clearError}><X size={14}/></button></div>}

      <section id="environments" className="environments interface" aria-labelledby="environments-heading">
        <div className="section-heading"><div><span className="eyebrow">THREE PLACES. ONE LONG NIGHT.</span><h2 id="environments-heading">Find your kind of quiet.</h2></div><p>{roomId ? 'Every room has a world of its own.' : 'A change of scenery, without going anywhere.'}<ArrowDown size={15}/></p></div>
        <div className="environment-grid">{SCENES.map((item, index) => <button key={item.id} className={`environment-card ${scene === item.id ? 'selected' : ''}`} disabled={!!roomId} onClick={() => setSelectedScene(item.id)} aria-pressed={scene === item.id}>
          <div className="environment-image"><Scene scene={item.id} miniature/><span className="room-number">0{index + 1}</span>{scene === item.id && <span className="selected-label"><span className="status-dot"/>{roomId ? 'YOU ARE HERE' : 'TUNED IN'}</span>}</div>
          <div className="environment-caption"><div><h3>{item.name}</h3><p>{item.description}</p></div><ArrowUpRight size={18}/></div><div className="environment-tag">{item.tag}</div>
        </button>)}</div>
        {roomId && <p className="different-room"><a href="/">Find a different room <ArrowUpRight size={13}/></a><span>Your current room stays open for your friends.</span></p>}
      </section>
    </main>
    <footer className="site-footer interface"><span className="footer-mark"><Signal size={14}/> Somewhere, someone is listening.</span><span>NO FEED. NO RUSH. JUST HERE.</span><button onClick={() => setModal('about')}>Made for the in-between hours <ArrowUpRight size={12}/></button></footer>
    {hidden && <button className="restore-interface" onClick={() => setHidden(false)}><Eye size={16}/> Show interface <kbd>Esc</kbd></button>}

    {modal === 'about' && <Dialog title="A little company for the late hours." onClose={() => setModal(null)}><p>Night Signal is a place to put the day down. Pick a room, start a soundscape, and send a friend the invitation. You will hear the same moment, wherever you are.</p><div className="about-rule"/><p>These are original, procedurally composed demo soundscapes and illustrated environments. Each soundscape lasts 90 seconds; the host can replay it or choose another.</p><p>Nothing starts until you press <strong>Start listening</strong>. Your volume is yours. The room host controls shared playback.</p><p className="subtle">Rooms and their guestbooks disappear after 24 hours with nobody connected. No accounts, uploads, or public room directory. Reduced-motion preferences are respected, and you can pause all scene motion.</p><a className="text-link" href="https://github.com/TheRealestNwah/night-signal" target="_blank" rel="noreferrer">Source, credits & documentation <ArrowUpRight size={14}/></a></Dialog>}
    {modal === 'share' && <Dialog title="Leave the door open." onClose={() => setModal(null)}><p>A quiet night is better with company. Anyone with this invitation can listen and leave a note.</p><label className="field-label" htmlFor="invite-link">INVITATION LINK</label><div className="copy-field"><input id="invite-link" value={invitation} readOnly onFocus={event => event.target.select()}/><button className="icon-button" onClick={() => copy(invitation, 'Invitation copied')} aria-label="Copy invitation link">{copied === 'Invitation copied' ? <Check size={18}/> : <Copy size={18}/>}</button></div><p className="fine-print" role="status">{copied || 'Invite links give listening access, with no host controls.'}</p>{isHost && <><details className="host-settings"><summary>Host settings & recovery</summary><p>Save this private link to control this room from another browser. Anyone who has it can control or end your room.</p><label className="field-label" htmlFor="host-link">PRIVATE HOST RECOVERY LINK</label><div className="copy-field"><input id="host-link" value={`${invitation}#host=${hostKey}`} readOnly onFocus={event => event.target.select()}/><button className="icon-button" aria-label="Copy private host recovery link" onClick={() => copy(`${invitation}#host=${hostKey}`, 'Host recovery link copied')}><Copy size={18}/></button></div><label className="field-label" htmlFor="source">ROOM SOUNDSCAPE</label><select id="source" value={state?.trackId} disabled={!connected} onChange={event => room.send({ type: 'control', action: 'track', trackId: event.target.value as typeof TRACKS[number]['id'] })}>{TRACKS.map(track => <option key={track.id} value={track.id}>{track.title} · {track.duration}s</option>)}</select><p className="fine-print">Changing the soundscape pauses playback and returns to the beginning.</p><button className="danger-button" onClick={() => setModal('end')}>End this room</button></details></>}</Dialog>}
    {modal === 'end' && <Dialog title="Call it a night?" onClose={() => setModal(null)}><p>Ending this room disconnects everyone and permanently removes its guestbook. This invitation will stop working.</p><div className="dialog-buttons"><button className="secondary-button" onClick={() => setModal(null)}>Stay a little longer</button><button className="danger-button" disabled={!connected} onClick={() => { room.send({ type: 'end' }); setModal(null); }}>End room</button></div></Dialog>}
    {modal === 'guestbook' && <Dialog title="The guestbook" className="guestbook-dialog" onClose={() => setModal(null)}><p className="guestbook-intro">A little proof we were here together.</p><div className="notes" aria-live="polite" aria-relevant="additions removals">{notes.length === 0 ? <div className="empty-notes"><MessageSquare size={27}/><h3>A blank page, for now.</h3><p>Leave the first note for whoever finds their way here.</p></div> : notes.map(note => <article className="note" key={note.id}><div className="note-avatar">{note.name.slice(0, 1).toUpperCase()}</div><div className="note-body"><div className="note-heading"><strong>{note.name}</strong><time dateTime={new Date(note.createdAt).toISOString()}>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{isHost && <button className="icon-button" aria-label={`Delete note by ${note.name}`} onClick={() => room.send({ type: 'delete-note', id: note.id })} disabled={!connected}><Trash2 size={13}/></button>}</div><p>{note.text}</p></div></article>)}</div><form onSubmit={postNote} className="note-form"><label htmlFor="display-name">YOUR NAME</label><input id="display-name" autoComplete="nickname" placeholder="What should we call you?" required maxLength={30} value={displayName} onChange={event => setDisplayName(event.target.value)}/><label htmlFor="note-text">LEAVE A LITTLE SOMETHING</label><textarea id="note-text" placeholder="A thought, a song, a hello…" required maxLength={280} rows={3} value={draft} onChange={event => setDraft(event.target.value)}/><div className="note-form-bottom"><span>{draft.length}/280</span><button className="primary-button" disabled={!connected || !!pendingNote || !draft.trim() || !displayName.trim()}>{pendingNote ? 'Leaving your note…' : 'Leave a note'}<ArrowUpRight size={15}/></button></div>{!connected && <p className="inline-error">The signal is interrupted. Your draft will stay here while we reconnect.</p>}{room.error && <p className="inline-error" role="alert">{room.error}</p>}</form></Dialog>}
  </div>;
}
