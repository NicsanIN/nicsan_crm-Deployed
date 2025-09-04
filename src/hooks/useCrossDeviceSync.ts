// React Hook for Cross-Device Synchronization
// Provides easy integration with React components

import { useState, useEffect, useCallback, useRef } from 'react';
import CrossDeviceSyncService from '../services/crossDeviceSyncService';
import WebSocketSyncService from '../services/websocketSyncService';

interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: any[];
  conflicts: any[];
  deviceId: string;
  isWebSocketConnected: boolean;
}

interface SyncData {
  policies: any[];
  uploads: any[];
  dashboard: any;
  lastUpdated: number;
}

export const useCrossDeviceSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: 0,
    pendingChanges: [],
    conflicts: [],
    deviceId: '',
    isWebSocketConnected: false
  });

  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncService = useRef(CrossDeviceSyncService.getInstance());
  const wsService = useRef(WebSocketSyncService.getInstance());

  // Initialize sync services
  useEffect(() => {
    const initializeSync = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get initial sync status
        const status = syncService.current.getSyncStatus();
        setSyncStatus(prev => ({
          ...prev,
          ...status,
          isWebSocketConnected: wsService.current.isConnectedToServer()
        }));

        // Get cached data
        const cachedData = syncService.current.getCachedData();
        if (cachedData) {
          setSyncData(cachedData);
        }

        // Force initial sync
        await syncService.current.forceSync();

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize sync:', err);
        setError('Failed to initialize synchronization');
        setIsLoading(false);
      }
    };

    initializeSync();
  }, []);

  // Setup sync callbacks
  useEffect(() => {
    const handleDataChange = (data: SyncData) => {
      setSyncData(data);
      setSyncStatus(prev => ({
        ...prev,
        lastSync: Date.now()
      }));
    };

    const handleStatusChange = (status: any) => {
      setSyncStatus(prev => ({
        ...prev,
        ...status,
        isWebSocketConnected: wsService.current.isConnectedToServer()
      }));
    };

    const handleWebSocketMessage = (message: any) => {
      console.log('WebSocket message received:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'policy_created':
        case 'policy_updated':
        case 'policy_deleted':
          // Trigger data refresh
          syncService.current.forceSync();
          break;
        case 'upload_created':
        case 'upload_updated':
          // Trigger data refresh
          syncService.current.forceSync();
          break;
        case 'dashboard_updated':
          // Trigger data refresh
          syncService.current.forceSync();
          break;
        case 'conflict_detected':
          setSyncStatus(prev => ({
            ...prev,
            conflicts: [...prev.conflicts, message.data]
          }));
          break;
      }
    };

    const handleWebSocketConnection = (connected: boolean) => {
      setSyncStatus(prev => ({
        ...prev,
        isWebSocketConnected: connected
      }));
    };

    // Register callbacks
    syncService.current.onDataChange(handleDataChange);
    syncService.current.onStatusChange(handleStatusChange);
    wsService.current.onSyncMessage(handleWebSocketMessage);
    wsService.current.onConnectionChange(handleWebSocketConnection);

    // Cleanup
    return () => {
      syncService.current.removeDataChangeCallback(handleDataChange);
      syncService.current.removeStatusChangeCallback(handleStatusChange);
      wsService.current.removeSyncMessageCallback(handleWebSocketMessage);
      wsService.current.removeConnectionChangeCallback(handleWebSocketConnection);
    };
  }, []);

  // Public methods
  const forceSync = useCallback(async () => {
    try {
      setError(null);
      await syncService.current.forceSync();
    } catch (err) {
      console.error('Force sync failed:', err);
      setError('Failed to synchronize data');
    }
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: any) => {
    syncService.current.resolveConflict(conflictId, resolution);
  }, []);

  const notifyPolicyChange = useCallback((type: 'created' | 'updated' | 'deleted', policy: any) => {
    switch (type) {
      case 'created':
        wsService.current.notifyPolicyCreated(policy);
        break;
      case 'updated':
        wsService.current.notifyPolicyUpdated(policy);
        break;
      case 'deleted':
        wsService.current.notifyPolicyDeleted(policy.id);
        break;
    }
  }, []);

  const notifyUploadChange = useCallback((type: 'created' | 'updated', upload: any) => {
    switch (type) {
      case 'created':
        wsService.current.notifyUploadCreated(upload);
        break;
      case 'updated':
        wsService.current.notifyUploadUpdated(upload);
        break;
    }
  }, []);

  const notifyDashboardChange = useCallback((dashboard: any) => {
    wsService.current.notifyDashboardUpdated(dashboard);
  }, []);

  const getDeviceId = useCallback(() => {
    return syncService.current.getDeviceId();
  }, []);

  const getLastSyncTime = useCallback(() => {
    return syncService.current.getLastSyncTime();
  }, []);

  const isOnline = useCallback(() => {
    return syncService.current.isDeviceOnline();
  }, []);

  const isWebSocketConnected = useCallback(() => {
    return wsService.current.isConnectedToServer();
  }, []);

  return {
    // State
    syncStatus,
    syncData,
    isLoading,
    error,
    
    // Methods
    forceSync,
    resolveConflict,
    notifyPolicyChange,
    notifyUploadChange,
    notifyDashboardChange,
    getDeviceId,
    getLastSyncTime,
    isOnline,
    isWebSocketConnected,
    
    // Computed values
    hasConflicts: syncStatus.conflicts.length > 0,
    hasPendingChanges: syncStatus.pendingChanges.length > 0,
    isFullyConnected: syncStatus.isOnline && syncStatus.isWebSocketConnected,
    lastSyncFormatted: syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'
  };
};

