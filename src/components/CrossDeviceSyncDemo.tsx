// Cross-Device Sync Demo Component
// Demonstrates real-time synchronization across devices

import React, { useState, useEffect } from 'react';
import { useCrossDeviceSync } from '../hooks/useCrossDeviceSync';
import { useAuth } from '../contexts/AuthContext';
import { 
  Smartphone, 
  Laptop, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';

const CrossDeviceSyncDemo: React.FC = () => {
  const { } = useAuth();
  const {
    syncStatus,
    syncData,
    isLoading,
    error,
    hasConflicts,
    hasPendingChanges,
    isFullyConnected,
    lastSyncFormatted,
    forceSync,
    getDeviceId,
    notifyPolicyChange,
    // notifyUploadChange
  } = useCrossDeviceSync();

  const [demoPolicies, setDemoPolicies] = useState<any[]>([]);
  const [newPolicy, setNewPolicy] = useState({
    policy_number: '',
    vehicle_number: '',
    insurer: 'Tata AIG'
  });

  useEffect(() => {
    // Load demo policies from sync data
    if (syncData?.policies) {
      setDemoPolicies(syncData.policies);
    }
  }, [syncData]);

  const addDemoPolicy = () => {
    if (!newPolicy.policy_number || !newPolicy.vehicle_number) return;

    const policy = {
      id: `demo_${Date.now()}`,
      ...newPolicy,
      total_premium: Math.floor(Math.random() * 50000) + 10000,
      cashback: Math.floor(Math.random() * 2000) + 500,
      status: 'SAVED',
      source: 'DEMO',
      created_at: new Date().toISOString()
    };

    setDemoPolicies(prev => [...prev, policy]);
    
    // Notify other devices
    notifyPolicyChange('created', policy);
    
    // Reset form
    setNewPolicy({
      policy_number: '',
      vehicle_number: '',
      insurer: 'Tata AIG'
    });
  };

  const getDeviceIcon = (deviceId: string) => {
    if (deviceId.includes('mobile') || deviceId.includes('phone')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (deviceId.includes('tablet')) {
      return <Monitor className="w-4 h-4" />;
    } else {
      return <Laptop className="w-4 h-4" />;
    }
  };

  const getConnectionStatus = () => {
    if (error) return { color: 'text-red-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Error' };
    if (hasConflicts) return { color: 'text-yellow-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Conflicts' };
    if (isFullyConnected) return { color: 'text-green-500', icon: <CheckCircle className="w-4 h-4" />, text: 'Fully Synced' };
    if (syncStatus.isOnline) return { color: 'text-blue-500', icon: <Wifi className="w-4 h-4" />, text: 'Online (Polling)' };
    return { color: 'text-gray-500', icon: <WifiOff className="w-4 h-4" />, text: 'Offline' };
  };

  const status = getConnectionStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Users className="w-6 h-6" />
          <span>Cross-Device Synchronization Demo</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Connection Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={status.color}>
                  {status.icon}
                </div>
                <span className="text-sm font-medium">{status.text}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Last sync: {lastSyncFormatted}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Device: {getDeviceId().substring(0, 12)}...</span>
              </div>
            </div>

            <button
              onClick={forceSync}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Force Sync</span>
            </button>
          </div>

          {/* Sync Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Sync Statistics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Policies:</span>
                <span className="text-sm font-medium">{demoPolicies.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">WebSocket:</span>
                <span className={`text-sm font-medium ${syncStatus.isWebSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {syncStatus.isWebSocketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Network:</span>
                <span className={`text-sm font-medium ${syncStatus.isOnline ? 'text-green-500' : 'text-red-500'}`}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {hasConflicts && (
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-600">Conflicts:</span>
                  <span className="text-sm font-medium text-yellow-600">{syncStatus.conflicts.length}</span>
                </div>
              )}
              
              {hasPendingChanges && (
                <div className="flex justify-between">
                  <span className="text-sm text-blue-600">Pending:</span>
                  <span className="text-sm font-medium text-blue-600">{syncStatus.pendingChanges.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Policy Creation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add Demo Policy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Policy Number"
            value={newPolicy.policy_number}
            onChange={(e) => setNewPolicy(prev => ({ ...prev, policy_number: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="text"
            placeholder="Vehicle Number"
            value={newPolicy.vehicle_number}
            onChange={(e) => setNewPolicy(prev => ({ ...prev, vehicle_number: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={newPolicy.insurer}
            onChange={(e) => setNewPolicy(prev => ({ ...prev, insurer: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tata AIG">Tata AIG</option>
            <option value="Bajaj Allianz">Bajaj Allianz</option>
            <option value="HDFC Ergo">HDFC Ergo</option>
            <option value="ICICI Lombard">ICICI Lombard</option>
          </select>
        </div>
        
        <button
          onClick={addDemoPolicy}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Add Policy (Sync to All Devices)
        </button>
      </div>

      {/* Demo Policies List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Synchronized Policies</h3>
        
        {demoPolicies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No policies yet. Add one above to see cross-device sync!</p>
        ) : (
          <div className="space-y-3">
            {demoPolicies.map((policy, index) => (
              <div key={policy.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(policy.deviceId || 'laptop')}
                  <div>
                    <div className="font-medium text-gray-800">{policy.policy_number}</div>
                    <div className="text-sm text-gray-600">{policy.vehicle_number} • {policy.insurer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">₹{policy.total_premium?.toLocaleString()}</div>
                  <div className="text-sm text-green-600">₹{policy.cashback?.toLocaleString()} cashback</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Test Cross-Device Sync</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>1. <strong>Open this app on multiple devices</strong> (laptop, phone, tablet)</p>
          <p>2. <strong>Login with the same account</strong> on all devices</p>
          <p>3. <strong>Add a policy on one device</strong> - it will appear on all other devices within 5 seconds</p>
          <p>4. <strong>Watch the sync status indicator</strong> in the bottom-right corner</p>
          <p>5. <strong>Try going offline</strong> - changes will sync when you come back online</p>
        </div>
      </div>
    </div>
  );
};

export default CrossDeviceSyncDemo;

