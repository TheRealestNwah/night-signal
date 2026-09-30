import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage, Snapshot } from '../shared/protocol';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'ended';

/** A fresh hello authenticates every socket; disconnected actions are never queued. */
export function useRoom(roomId: string | null, hostKey?: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>(roomId ? 'connecting' : 'offline');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const snapshotRef = useRef<Snapshot | null>(null);
  const offsetRef = useRef(0);
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  const clearError = useCallback(() => setError(null), []);
  const retry = useCallback(() => { setError(null); setAttempt(value => value + 1); }, []);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (!readyRef.current || !socket || socket.readyState !== WebSocket.OPEN) {
      setError('The room is disconnected. Try again when the connection returns.');
      return false;
    }
    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch {
      setError('That action did not reach the room. Please try again once connected.');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      snapshotRef.current = null;
      readyRef.current = false;
      setSnapshot(null);
      setConnection('offline');
      return;
    }
    if (snapshotRef.current?.room.id !== roomId) {
      snapshotRef.current = null;
      offsetRef.current = 0;
      setSnapshot(null);
    }
    setError(null);
    let disposed = false;
    let terminal = false;
    let failures = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let handshakeTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let activeSocket: WebSocket | null = null;
    let lastMessage = Date.now();
    const clockSamples: { rtt: number; offset: number }[] = [];

    function reconnect() {
      if (disposed || terminal) return;
      readyRef.current = false;
      if (!navigator.onLine) {
        setConnection('offline');
        return;
      }
      setConnection('reconnecting');
      const delay = Math.min(15000, 750 * 2 ** Math.min(failures++, 5)) + Math.random() * 250;
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      if (disposed || terminal) return;
      if (!navigator.onLine) { setConnection('offline'); return; }
      setConnection(snapshotRef.current ? 'reconnecting' : failures ? 'reconnecting' : 'connecting');
      const url = new URL('/ws', window.location.href);
      url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('room', roomId!);
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        setError('The room connection could not start. Retrying…');
        reconnect();
        return;
      }
      socketRef.current = socket;
      activeSocket = socket;
      readyRef.current = false;
      lastMessage = Date.now();
      handshakeTimer = setTimeout(() => {
        if (!readyRef.current && socket === activeSocket) socket.close();
      }, 12000);

      socket.onopen = () => {
        if (disposed || socket !== activeSocket) return;
        socket.send(JSON.stringify({ type: 'hello', ...(hostKey ? { hostKey } : {}) }));
        socket.send(JSON.stringify({ type: 'ping', sentAt: Date.now() }));
        heartbeatTimer = setInterval(() => {
          if (socket.readyState !== WebSocket.OPEN) return;
          if (Date.now() - lastMessage > 25000) { socket.close(); return; }
          socket.send(JSON.stringify({ type: 'ping', sentAt: Date.now() }));
        }, 5000);
      };

      socket.onmessage = event => {
        if (disposed || socket !== activeSocket) return;
        lastMessage = Date.now();
        let message: ServerMessage;
        try { message = JSON.parse(String(event.data)) as ServerMessage; } catch { return; }
        if (!message || typeof message !== 'object') return;
        if (message.type === 'snapshot') {
          if (message.room?.id !== roomId || !Number.isFinite(message.room.revision)) return;
          const previous = snapshotRef.current;
          // Presence and guestbook snapshots may legitimately share the room revision.
          if (previous && previous.room.id === roomId && previous.room.revision > message.room.revision) return;
          if (!clockSamples.length && Number.isFinite(message.serverTime)) offsetRef.current = message.serverTime - Date.now();
          snapshotRef.current = message;
          clearTimeout(handshakeTimer);
          setSnapshot(message);
          readyRef.current = true;
          failures = 0;
          setConnection('connected');
          setError(null);
        } else if (message.type === 'pong') {
          const received = Date.now();
          const rtt = received - message.sentAt;
          if (!Number.isFinite(rtt) || rtt < 0 || rtt > 20000 || !Number.isFinite(message.serverTime)) return;
          clockSamples.push({ rtt, offset: message.serverTime - (message.sentAt + received) / 2 });
          if (clockSamples.length > 8) clockSamples.shift();
          // The least delayed sample gives the best estimate on an asymmetric network.
          offsetRef.current = clockSamples.reduce((best, sample) => sample.rtt < best.rtt ? sample : best).offset;
        } else if (message.type === 'ended') {
          terminal = true;
          readyRef.current = false;
          setConnection('ended');
          setError(message.reason || 'This room has ended.');
          socket.close();
        } else if (message.type === 'error') {
          setError(message.message);
          if (message.code && /not.?found|expired|ended|HOST_UNAUTHORIZED/i.test(message.code)) {
            terminal = true;
            readyRef.current = false;
            setConnection('ended');
            socket.close();
          }
        }
      };
      socket.onerror = () => {
        if (!disposed && socket === activeSocket && !terminal) setError('The connection was interrupted. Reconnecting…');
      };
      socket.onclose = () => {
        clearTimeout(handshakeTimer);
        clearInterval(heartbeatTimer);
        if (disposed || socket !== activeSocket) return;
        readyRef.current = false;
        reconnect();
      };
    }

    function online() { if (!terminal) retry(); }
    function offline() {
      if (terminal) return;
      setConnection('offline');
      readyRef.current = false;
      activeSocket?.close();
    }
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    connect();
    return () => {
      disposed = true;
      readyRef.current = false;
      clearTimeout(reconnectTimer);
      clearTimeout(handshakeTimer);
      clearInterval(heartbeatTimer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      activeSocket?.close();
      if (socketRef.current === activeSocket) socketRef.current = null;
    };
  }, [roomId, hostKey, attempt, retry]);

  return { snapshot, connection, error, clearError, send, serverNow, retry };
}
