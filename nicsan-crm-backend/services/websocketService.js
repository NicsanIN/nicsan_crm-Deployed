
// WebSocket Service for Real-Time Cross-Device Synchronization
// Handles Socket.IO connections and real-time data updates

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedDevices = new Map(); // deviceId -> { socket, userId, lastSeen }
    this.userSessions = new Map(); // userId -> Set of deviceIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New WebSocket connection:', socket.id);

      // Handle device registration
      socket.on('register_device', async (data) => {
        try {
          const { deviceId, token, userAgent } = data;
          
          // Verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;

          // Store device connection
          this.connectedDevices.set(deviceId, {
            socket,
            userId,
            userAgent,
            lastSeen: Date.now(),
            connectedAt: Date.now()
          });

          // Add to user sessions
          if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
          }
          this.userSessions.get(userId).add(deviceId);

          // Join user room for targeted messaging
          socket.join(`user_${userId}`);
          socket.join(`device_${deviceId}`);

          console.log(`✅ Device ${deviceId} registered for user ${userId}`);
          
          // Send confirmation
          socket.emit('device_registered', {
            deviceId,
            userId,
            timestamp: Date.now()
          });

          // Notify other devices of new connection
          this.broadcastToUser(userId, 'device_connected', {
            deviceId,
            userAgent,
            timestamp: Date.now()
          }, deviceId);

        } catch (error) {
          console.error('Device registration failed:', error);
          socket.emit('registration_failed', {
            error: 'Invalid token or registration failed'
          });
        }
      });

      // Handle user setting
      socket.on('set_user', (data) => {
        const { userId, deviceId } = data;
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.userId = userId;
          device.lastSeen = Date.now();
        }
      });

      // Handle sync messages
      socket.on('sync_message', (message) => {
        this.handleSyncMessage(message);
      });

      // Handle heartbeat
      socket.on('heartbeat', (data) => {
        const { deviceId } = data;
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.lastSeen = Date.now();
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', socket.id, reason);
        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Cleanup inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 300000);
  }

  handleSyncMessage(message) {
    try {
      const { type, data, deviceId, userId, timestamp } = message;
      
      console.log(`📡 Sync message received: ${type} from device ${deviceId}`);

      // Broadcast to all other devices of the same user
      this.broadcastToUser(userId, 'sync_message', message, deviceId);

      // Handle specific message types
      switch (type) {
        case 'policy_created':
        case 'policy_updated':
        case 'policy_deleted':
          this.broadcastToUser(userId, 'data_updated', {
            type: 'policies',
            action: type,
            data,
            timestamp
          }, deviceId);
          break;

        case 'upload_created':
        case 'upload_updated':
          this.broadcastToUser(userId, 'data_updated', {
            type: 'uploads',
            action: type,
            data,
            timestamp
          }, deviceId);
          break;

        case 'dashboard_updated':
          this.broadcastToUser(userId, 'data_updated', {
            type: 'dashboard',
            action: type,
            data,
            timestamp
          }, deviceId);
          break;
      }

    } catch (error) {
      console.error('Failed to handle sync message:', error);
    }
  }

  broadcastToUser(userId, event, data, excludeDeviceId = null) {
    const userDevices = this.userSessions.get(userId);
    if (userDevices) {
      userDevices.forEach(deviceId => {
        if (deviceId !== excludeDeviceId) {
          const device = this.connectedDevices.get(deviceId);
          if (device && device.socket) {
            device.socket.emit(event, data);
          }
        }
      });
    }
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  sendToDevice(deviceId, event, data) {
    const device = this.connectedDevices.get(deviceId);
    if (device && device.socket) {
      device.socket.emit(event, data);
    }
  }

  handleDisconnection(socket) {
    // Find and remove the disconnected device
    for (const [deviceId, device] of this.connectedDevices.entries()) {
      if (device.socket === socket) {
        const userId = device.userId;
        
        // Remove from connected devices
        this.connectedDevices.delete(deviceId);
        
        // Remove from user sessions
        if (userId && this.userSessions.has(userId)) {
          this.userSessions.get(userId).delete(deviceId);
          if (this.userSessions.get(userId).size === 0) {
            this.userSessions.delete(userId);
          }
        }

        // Notify other devices of disconnection
        if (userId) {
          this.broadcastToUser(userId, 'device_disconnected', {
            deviceId,
            timestamp: Date.now()
          });
        }

        console.log(`✅ Device ${deviceId} disconnected and cleaned up`);
        break;
      }
    }
  }

  cleanupInactiveConnections() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [deviceId, device] of this.connectedDevices.entries()) {
      if (now - device.lastSeen > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive device: ${deviceId}`);
        
        if (device.socket) {
          device.socket.disconnect();
        }
        
        this.connectedDevices.delete(deviceId);
        
        if (device.userId && this.userSessions.has(device.userId)) {
          this.userSessions.get(device.userId).delete(deviceId);
          if (this.userSessions.get(device.userId).size === 0) {
            this.userSessions.delete(device.userId);
          }
        }
      }
    }
  }

  // Public methods for external use
  notifyPolicyChange(userId, type, policy) {
    this.broadcastToUser(userId, 'data_updated', {
      type: 'policies',
      action: type,
      data: policy,
      timestamp: Date.now()
    });
  }

  notifyUploadChange(userId, type, upload) {
    this.broadcastToUser(userId, 'data_updated', {
      type: 'uploads',
      action: type,
      data: upload,
      timestamp: Date.now()
    });
  }

  notifyDashboardChange(userId, dashboard) {
    this.broadcastToUser(userId, 'data_updated', {
      type: 'dashboard',
      action: 'updated',
      data: dashboard,
      timestamp: Date.now()
    });
  }

  getConnectedDevicesCount() {
    return this.connectedDevices.size;
  }

  getConnectedUsersCount() {
    return this.userSessions.size;
  }

  getDeviceInfo(deviceId) {
    return this.connectedDevices.get(deviceId);
  }

  getUserDevices(userId) {
    const userDevices = this.userSessions.get(userId);
    if (userDevices) {
      return Array.from(userDevices).map(deviceId => ({
        deviceId,
        ...this.connectedDevices.get(deviceId)
      }));
    }
    return [];
  }
}

module.exports = new WebSocketService();

