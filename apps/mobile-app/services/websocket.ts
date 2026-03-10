import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';
import { WS_URL } from './config';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const token = await getToken();
  if (!token) {
    throw new Error('No auth token for WebSocket connection');
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
