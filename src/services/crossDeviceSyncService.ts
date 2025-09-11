// Cross-Device Synchronization Service
// Provides real-time data sync across multiple devices
// Updated: Fixed import and method calls

import NicsanCRMService from './api-integration';

interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: any[];
  conflicts: any[];
  deviceId: string;
}

interface SyncData {
  policies: any[];
  uploads: any[];
  dashboard: any;
  lastUpdated: number;
}

class CrossDeviceSyncService {
  private static instance: CrossDeviceSyncService;
  private syncInterval: number = 5000; // 5 seconds
  private isOnline: boolean = navigator.onLine;
  private deviceId: string;
  private lastSync: number = 0;
  private pendingChanges: any[] = [];
  private conflicts: any[] = [];
  private syncCallbacks: ((data: SyncData) => void)[] = [];
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupEventListeners();
    this.startSync();
  }

  static getInstance(): CrossDeviceSyncService {
    if (!CrossDeviceSyncService.instance) {
      CrossDeviceSyncService.instance = new CrossDeviceSyncService();
    }
    return CrossDeviceSyncService.instance;
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.syncAllData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });

    // Page visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncAllData();
      }
    });

    // Focus event (window focus)
    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.syncAllData();
      }
    });
  }

  private startSync(): void {
    // Initial sync
    this.syncAllData();

    // Periodic sync
    setInterval(() => {
      if (this.isOnline) {
        this.syncAllData();
      }
    }, this.syncInterval);
  }

  private async syncAllData(): Promise<void> {
    try {
      
      const syncData = await this.fetchAllData();
      
      if (syncData) {
        this.lastSync = Date.now();
        this.saveToLocalCache(syncData);
        this.notifyDataChange(syncData);
        this.notifyStatusChange();
        
      }
    } catch (error) {
      console.error('❌ Cross-device sync failed:', error);
      this.notifyStatusChange();
    }
  }

  private async fetchAllData(): Promise<SyncData | null> {
    try {
      
      const [policiesResponse, uploadsResponse, dashboardResponse] = await Promise.all([
        NicsanCRMService.getPolicies(),
        NicsanCRMService.getUploads(),
        NicsanCRMService.getDashboardMetrics()
      ]);

      const syncData: SyncData = {
        policies: Array.isArray(policiesResponse) ? policiesResponse : (policiesResponse?.data || []),
        uploads: uploadsResponse?.data || [],
        dashboard: dashboardResponse?.data || null,
        lastUpdated: Date.now()
      };


      return syncData;
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
      return null;
    }
  }

  private saveToLocalCache(data: SyncData): void {
    try {
      const cacheData = {
        ...data,
        cachedAt: Date.now(),
        deviceId: this.deviceId
      };
      
      localStorage.setItem('nicsan_sync_cache', JSON.stringify(cacheData));
      localStorage.setItem('nicsan_last_sync', Date.now().toString());
    } catch (error) {
      console.error('Failed to save to local cache:', error);
    }
  }

  private getLocalCache(): SyncData | null {
    try {
      const cached = localStorage.getItem('nicsan_sync_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is not too old (1 hour)
        if (Date.now() - cacheData.cachedAt < 3600000) {
          return cacheData;
        }
      }
    } catch (error) {
      console.error('Failed to get local cache:', error);
    }
    return null;
  }

  // Public methods
  public getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges,
      conflicts: this.conflicts,
      deviceId: this.deviceId
    };
  }

  public getCachedData(): SyncData | null {
    return this.getLocalCache();
  }

  public forceSync(): Promise<void> {
    return this.syncAllData();
  }

  public onDataChange(callback: (data: SyncData) => void): void {
    this.syncCallbacks.push(callback);
  }

  public onStatusChange(callback: (status: SyncStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  public removeDataChangeCallback(callback: (data: SyncData) => void): void {
    const index = this.syncCallbacks.indexOf(callback);
    if (index > -1) {
      this.syncCallbacks.splice(index, 1);
    }
  }

  public removeStatusChangeCallback(callback: (status: SyncStatus) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  private notifyDataChange(data: SyncData): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data change callback:', error);
      }
    });
  }

  private notifyStatusChange(): void {
    const status = this.getSyncStatus();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  // Conflict resolution
  public addPendingChange(change: any): void {
    this.pendingChanges.push({
      ...change,
      timestamp: Date.now(),
      deviceId: this.deviceId
    });
    this.notifyStatusChange();
  }

  public resolveConflict(conflictId: string): void {
    const index = this.conflicts.findIndex(c => c.id === conflictId);
    if (index > -1) {
      this.conflicts.splice(index, 1);
      this.notifyStatusChange();
    }
  }

  // Device management
  public getDeviceId(): string {
    return this.deviceId;
  }

  public getLastSyncTime(): number {
    return this.lastSync;
  }

  public isDeviceOnline(): boolean {
    return this.isOnline;
  }
}

export default CrossDeviceSyncService;
