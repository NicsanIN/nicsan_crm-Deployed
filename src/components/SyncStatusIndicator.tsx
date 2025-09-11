// Sync Status Indicator Component
// Shows real-time sync status and connection information

import React from 'react';
import { useCrossDeviceSync } from '../hooks/useCrossDeviceSync';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

const SyncStatusIndicator: React.FC = () => {
  const {
    syncStatus,
    error,
    hasConflicts,
    isFullyConnected,
    forceSync
  } = useCrossDeviceSync();

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (hasConflicts) return 'text-yellow-500';
    if (isFullyConnected) return 'text-green-500';
    if (syncStatus.isOnline) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (error) return <AlertTriangle className="w-4 h-4" />;
    if (hasConflicts) return <AlertTriangle className="w-4 h-4" />;
    if (isFullyConnected) return <CheckCircle className="w-4 h-4" />;
    if (syncStatus.isOnline) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (error) return 'Sync Error';
    if (hasConflicts) return 'Conflicts Detected';
    if (isFullyConnected) return 'Fully Synced';
    if (syncStatus.isOnline) return 'Online (Polling)';
    return 'Offline';
  };


  // Return a minimal, non-intrusive indicator
  return (
    <div className="fixed top-4 right-4 bg-white rounded-full shadow-sm border p-2 z-10">
      <div className="flex items-center space-x-2">
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className="text-xs font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
