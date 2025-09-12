
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      'https://app.nicsanin.com',
      'https://staging.nicsanin.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true
  }
});

// Set port
const PORT = process.env.PORT || 3001;

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://app.nicsanin.com',
      'https://staging.nicsanin.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('�� CORS blocked origin: ' + origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health checks (works with CF /api/* behavior)
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// DEBUG: auth probe (TEMP - staging only)
app.get('/api/debug/auth', (req, res) => {
  const auth = req.headers['authorization'] || null;
  const cookie = req.headers['cookie'] || null;
  res.status(200).json({
    ok: true,
    sawAuthorizationHeader: Boolean(auth),
    authorizationSample: auth ? auth.slice(0, 20) + '...' : null,
    sawCookieHeader: Boolean(cookie),
    cookieSample: cookie ? cookie.split(';')[0] : null
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// Health checks (must be before any 404/catch-all)
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(' Nicsan CRM Backend running on port ' + PORT);
  console.log(' Health check: http://localhost:' + PORT + '/health');
  console.log(' API base: http://localhost:' + PORT + '/api');
  console.log(' WebSocket server: ws://localhost:' + PORT);
  console.log(' CORS enabled for: https://app.nicsanin.com, https://staging.nicsanin.com');
});

module.exports = { app, server };
