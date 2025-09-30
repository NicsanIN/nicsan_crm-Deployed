// WebSocket-based Real-Time Synchronization Service
// Provides instant updates across devices using Socket.IO

import { io, Socket } from 'socket.io-client';

interface WebSocketSyncConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
}

interface SyncMessage {
  type: 'policy_created' | 'policy_updated' | 'policy_deleted' | 'upload_created' | 'upload_updated' | 'dashboard_updated';
  data: any;
  timestamp: number;
  deviceId: string;
  userId: string;
}

class WebSocketSyncService {
  private static instance: WebSocketSyncService;
  private socket: Socket | null = null;
  private config: WebSocketSyncConfig;
  private isConnected: boolean = false;
  private messageCallbacks: ((message: SyncMessage) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private deviceId: string;
  private userId: string | null = null;

  private constructor() {
    // Prefer explicit WS env; fallback derives from API base
    const WS_URL =
      import.meta.env.VITE_WEBSOCKET_URL ||
      (import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws").replace(/\/+$/, "").replace(/\/api$/, "")
        : import.meta.env.VITE_WEBSOCKET_URL!);

    this.config = {
      serverUrl: WS_URL,
      reconnectAttempts: 5,
      reconnectDelay: 1000
    };
    
    this.deviceId = this.getDeviceId();
    this.setupConnection();
  }

  static getInstance(): WebSocketSyncService {
    if (!WebSocketSyncService.instance) {
      WebSocketSyncService.instance = new WebSocketSyncService();
    }
    return WebSocketSyncService.instance;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private setupConnection(): void {
    try {
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
        this.isConnected = true;
        this.notifyConnectionChange(true);
        this.registerDevice();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
        this.notifyConnectionChange(true);
        this.registerDevice();
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('🔌 WebSocket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('🔌 WebSocket reconnection failed');
        this.isConnected = false;
        this.notifyConnectionChange(false);
      });

      // Listen for sync messages
      this.socket.on('sync_message', (message: SyncMessage) => {
        this.handleSyncMessage(message);
      });

      this.socket.on('data_updated', (data: any) => {
        console.log('📡 Real-time data update received:', data);
        this.handleDataUpdate(data);
      });

      this.socket.on('conflict_detected', (conflict: any) => {
        console.log('⚠️ Conflict detected:', conflict);
        this.handleConflict(conflict);
      });

    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
    }
  }

  private registerDevice(): void {
    if (this.socket && this.isConnected) {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.socket.emit('register_device', {
          deviceId: this.deviceId,
          token: token,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        });
      }
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    if (this.socket && this.isConnected) {
      this.socket.emit('set_user', { userId, deviceId: this.deviceId });
    }
  }

  public sendSyncMessage(type: SyncMessage['type'], data: any): void {
    if (this.socket && this.isConnected && this.userId) {
      const message: SyncMessage = {
        type,
        data,
        timestamp: Date.now(),
        deviceId: this.deviceId,
        userId: this.userId
      };

      this.socket.emit('sync_message', message);
      console.log('📤 Sync message sent:', message);
    } else {
      console.warn('Cannot send sync message: WebSocket not connected or user not set');
    }
  }

  private handleSyncMessage(message: SyncMessage): void {
    // Don't process messages from the same device
    if (message.deviceId === this.deviceId) {
      return;
    }

    console.log('📥 Sync message received:', message);
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in sync message callback:', error);
      }
    });
  }

  private handleDataUpdate(data: any): void {
    // Handle real-time data updates
    this.messageCallbacks.forEach(callback => {
      try {
        callback({
          type: 'data_updated' as any,
          data,
          timestamp: Date.now(),
          deviceId: 'server',
          userId: 'system'
        });
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  private handleConflict(conflict: any): void {
    // Handle conflict resolution
    this.messageCallbacks.forEach(callback => {
      try {
        callback({
          type: 'conflict_detected' as any,
          data: conflict,
          timestamp: Date.now(),
          deviceId: 'server',
          userId: 'system'
        });
      } catch (error) {
        console.error('Error in conflict callback:', error);
      }
    });
  }

  // Public methods
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // public getDeviceId(): string {
  //   return this.deviceId;
  // }

  public onSyncMessage(callback: (message: SyncMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  public onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  public removeSyncMessageCallback(callback: (message: SyncMessage) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  public removeConnectionChangeCallback(callback: (connected: boolean) => void): void {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection change callback:', error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.setupConnection();
    }
  }

  // Specific sync methods
  public notifyPolicyCreated(policy: any): void {
    this.sendSyncMessage('policy_created', policy);
  }

  public notifyPolicyUpdated(policy: any): void {
    this.sendSyncMessage('policy_updated', policy);
  }

  public notifyPolicyDeleted(policyId: string): void {
    this.sendSyncMessage('policy_deleted', { id: policyId });
  }

  public notifyUploadCreated(upload: any): void {
    this.sendSyncMessage('upload_created', upload);
  }

  public notifyUploadUpdated(upload: any): void {
    this.sendSyncMessage('upload_updated', upload);
  }

  public notifyDashboardUpdated(dashboard: any): void {
    this.sendSyncMessage('dashboard_updated', dashboard);
  }
}

export default WebSocketSyncService;

