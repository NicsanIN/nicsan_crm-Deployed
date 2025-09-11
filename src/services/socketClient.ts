// Centralized WebSocket Client for Nicsan CRM
// Provides a unified interface for WebSocket communications

import { io, Socket } from 'socket.io-client';

// Environment variables
// Prefer explicit WS env; fallback derives from API base
const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws").replace(/\/+$/, "").replace(/\/api$/, "")
    : "ws://localhost:3001");
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// WebSocket client configuration
const socketConfig = {
  transports: ['websocket'],
  withCredentials: true,
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

// Create socket instance
export const socket: Socket = io(WEBSOCKET_URL, socketConfig);

// Connection event handlers
socket.on('connect', () => {
  if (ENABLE_DEBUG) {
    console.log('🔌 WebSocket connected:', socket.id);
  }
});

socket.on('disconnect', (reason) => {
  if (ENABLE_DEBUG) {
    console.log('🔌 WebSocket disconnected:', reason);
  }
});

socket.on('connect_error', (error) => {
  if (ENABLE_DEBUG) {
    console.error('❌ WebSocket connection error:', error);
  }
});

socket.on('reconnect', (attemptNumber) => {
  if (ENABLE_DEBUG) {
    console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
  }
});

socket.on('reconnect_error', (error) => {
  if (ENABLE_DEBUG) {
    console.error('❌ WebSocket reconnection error:', error);
  }
});

// Utility functions
export const socketUtils = {
  // Check if socket is connected
  isConnected: (): boolean => {
    return socket.connected;
  },

  // Get socket ID
  getSocketId: (): string | undefined => {
    return socket.id;
  },

  // Emit event with error handling
  emit: (event: string, data?: any): void => {
    if (socket.connected) {
      socket.emit(event, data);
      if (ENABLE_DEBUG) {
        console.log(`📤 Socket emit: ${event}`, data);
      }
    } else {
      if (ENABLE_DEBUG) {
        console.warn('⚠️ Socket not connected, cannot emit:', event);
      }
    }
  },

  // Listen to event with error handling
  on: (event: string, callback: (...args: any[]) => void): void => {
    socket.on(event, (...args) => {
      if (ENABLE_DEBUG) {
        console.log(`📥 Socket received: ${event}`, args);
      }
      callback(...args);
    });
  },

  // Remove event listener
  off: (event: string, callback?: (...args: any[]) => void): void => {
    socket.off(event, callback);
  },

  // Disconnect socket
  disconnect: (): void => {
    socket.disconnect();
    if (ENABLE_DEBUG) {
      console.log('🔌 WebSocket manually disconnected');
    }
  },

  // Reconnect socket
  reconnect: (): void => {
    socket.connect();
    if (ENABLE_DEBUG) {
      console.log('🔄 WebSocket reconnection initiated');
    }
  }
};

export default socket;
