// Cross-Device Sync Provider Component
// Wraps the entire app to provide cross-device synchronization

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CrossDeviceSyncService from '../services/crossDeviceSyncService';
import WebSocketSyncService from '../services/websocketSyncService';

interface CrossDeviceSyncContextType {
  isInitialized: boolean;
  isOnline: boolean;
  isWebSocketConnected: boolean;
  lastSync: number;
  deviceId: string;
  hasConflicts: boolean;
  hasPendingChanges: boolean;
  forceSync: () => Promise<void>;
  notifyPolicyChange: (type: 'created' | 'updated' | 'deleted', policy: any) => void;
  notifyUploadChange: (type: 'created' | 'updated', upload: any) => void;
  notifyDashboardChange: (dashboard: any) => void;
}

const CrossDeviceSyncContext = createContext<CrossDeviceSyncContextType | null>(null);

export const useCrossDeviceSync = () => {
  const context = useContext(CrossDeviceSyncContext);
  if (!context) {
    throw new Error('useCrossDeviceSync must be used within CrossDeviceSyncProvider');
  }
  return context;
};

interface CrossDeviceSyncProviderProps {
  children: React.ReactNode;
}

export const CrossDeviceSyncProvider: React.FC<CrossDeviceSyncProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  const [hasConflicts, setHasConflicts] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const syncService = CrossDeviceSyncService.getInstance();
  const wsService = WebSocketSyncService.getInstance();

  useEffect(() => {
    const initializeSync = async () => {
      try {
        // Set device ID
        setDeviceId(syncService.getDeviceId());

        // Setup status change listeners
        const handleStatusChange = (status: any) => {
          setIsOnline(status.isOnline);
          setLastSync(status.lastSync);
          setHasConflicts(status.conflicts.length > 0);
          setHasPendingChanges(status.pendingChanges.length > 0);
        };

        const handleWebSocketConnection = (connected: boolean) => {
          setIsWebSocketConnected(connected);
        };

        syncService.onStatusChange(handleStatusChange);
        wsService.onConnectionChange(handleWebSocketConnection);

        setIsInitialized(true);

        // Cleanup function
        return () => {
          syncService.removeStatusChangeCallback(handleStatusChange);
          wsService.removeConnectionChangeCallback(handleWebSocketConnection);
        };
      } catch (error) {
        console.error('Failed to initialize cross-device sync:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initializeSync();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Set user ID for WebSocket service
      wsService.setUserId(user.id.toString());
    }
  }, [isAuthenticated, user]);

  const forceSync = async () => {
    try {
      await syncService.forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const notifyPolicyChange = (type: 'created' | 'updated' | 'deleted', policy: any) => {
    if (type === 'created') {
      wsService.notifyPolicyCreated(policy);
    } else if (type === 'updated') {
      wsService.notifyPolicyUpdated(policy);
    } else if (type === 'deleted') {
      wsService.notifyPolicyDeleted(policy.id);
    }
  };

  const notifyUploadChange = (type: 'created' | 'updated', upload: any) => {
    if (type === 'created') {
      wsService.notifyUploadCreated(upload);
    } else if (type === 'updated') {
      wsService.notifyUploadUpdated(upload);
    }
  };

  const notifyDashboardChange = (dashboard: any) => {
    // Dashboard change notification not implemented in WebSocket service
    console.log('Dashboard change:', dashboard);
  };

  const contextValue: CrossDeviceSyncContextType = {
    isInitialized,
    isOnline,
    isWebSocketConnected,
    lastSync,
    deviceId,
    hasConflicts,
    hasPendingChanges,
    forceSync,
    notifyPolicyChange,
    notifyUploadChange,
    notifyDashboardChange,
  };

  return (
    <CrossDeviceSyncContext.Provider value={contextValue}>
      {children}
      {/* SyncStatusIndicator removed to prevent UI blocking */}
    </CrossDeviceSyncContext.Provider>
  );
};
