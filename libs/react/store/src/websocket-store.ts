import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { QueryClient } from '@tanstack/react-query';

export interface WebSocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string, queryClient: QueryClient) => void;
  disconnect: () => void;
}

const WS_EVENT_INVALIDATION_MAP: Record<string, string[]> = {
  'order:new': ['orders'],
  'order:statusChanged': ['orders'],
  'order:paymentReceived': ['orders'],
  'inventory:updated': ['inventory'],
  'inventory:stockAlert': ['inventory'],
  'production:taskUpdated': ['production-plans'],
  'notification:new': ['notifications'],
  'batch:created': ['batches'],
  'batch:updated': ['batches'],
  'batch:expiringSoon': ['batches'],
  'batch:expired': ['batches'],
};

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token, queryClient) => {
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }

    const wsUrl = (typeof window !== 'undefined' && window.location.origin) || '';
    const socket = io(wsUrl, { auth: { token } });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    for (const [event, queryKeys] of Object.entries(WS_EVENT_INVALIDATION_MAP)) {
      socket.on(event, () => {
        for (const key of queryKeys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
    }

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, isConnected: false });
  },
}));
