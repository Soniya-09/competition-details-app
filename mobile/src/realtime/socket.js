import { io } from 'socket.io-client';
import { API_URL } from '../config';

let socket;

function getSocket() {
  if (!socket) socket = io(API_URL, { transports: ['websocket'], reconnectionDelayMax: 10_000 });
  return socket;
}

export function subscribeToAvailability(competitionId, onUpdate) {
  const s = getSocket();
  const join = () => s.emit('competition:subscribe', competitionId);
  const handler = (payload) => {
    if (payload.competitionId === competitionId) onUpdate(payload);
  };
  s.on('connect', join);
  s.on('availability', handler);
  if (s.connected) join();
  return () => {
    s.emit('competition:unsubscribe', competitionId);
    s.off('connect', join);
    s.off('availability', handler);
  };
}
