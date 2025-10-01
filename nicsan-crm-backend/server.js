const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://app.nicsanin.com',
      'https://staging.nicsanin.com',
      process.env.FRONTEND_URL || 'https://app.nicsanin.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin: ' + origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// ✅ CORS and JSON parsers MUST be before routes
app.use(cors(corsOptions));
app.use(express.json());                         // parse application/json
app.use(express.urlencoded({ extended: true })); // parse form bodies (just in case)

// CF health must be first so no router/catch-all swallows it
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));


// Set port
const PORT = process.env.PORT || 3001;

// DEBUG: echo key headers to verify CloudFront forwarding
app.get('/api/debug/headers', (req, res) => {
  res.json({
    authorization: req.headers['authorization'] || null,
    cookie: req.headers['cookie'] ? '(set)' : null,
    host: req.headers['host'],
    via: req.headers['via'] || null,
    xForwardedFor: req.headers['x-forwarded-for'] || null,
    xAmzCfId: req.headers['x-amz-cf-id'] || null
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/telecallers', require('./routes/telecallers'));
app.use('/api/debug', require('./routes/debug'));

// Initialize WebSocket Service (handles Socket.IO internally)
const wsService = require('./services/websocketService');
wsService.initialize(server);

// Middleware already configured above


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// --- DEBUG: DB connectivity probe (remove after use) ---
app.get('/api/debug/db-connect', async (_req, res) => {
  const { Client } = require('pg');

  const url = process.env.DATABASE_URL || null;
  let sslMode = null;
  try { if (url) sslMode = new URL(url).searchParams.get('sslmode') || null; } catch {}

  async function tryConnect(connStr, sslOption) {
    const client = new Client({
      connectionString: connStr,
      ssl: sslOption
    });
    const t0 = Date.now();
    try {
      await client.connect();
      const r = await client.query('select now() as now, current_user as db_user');
      await client.end();
      return { ok: true, ms: Date.now() - t0, sample: r.rows[0] };
    } catch (e) {
      return { ok: false, ms: Date.now() - t0, code: e.code, message: e.message };
    }
  }

  const attempts = [];
  // 1) As-is (what your app currently uses)
  attempts.push({
    label: 'as-is',
    ssl: sslMode ?? '(default verify)',
    result: await tryConnect(url, sslMode
      ? (sslMode === 'disable' ? false :
         (sslMode === 'no-verify' ? { rejectUnauthorized: false } : { rejectUnauthorized: true }))
      : { rejectUnauthorized: true })
  });

  // 2) Forced no-verify (probe only)
  attempts.push({
    label: 'forced-no-verify',
    ssl: 'rejectUnauthorized=false',
    result: await tryConnect(url, { rejectUnauthorized: false })
  });

  res.status(attempts[0].result.ok ? 200 : 500).json({
    env: {
      DATABASE_URL: url ? '(set)' : '(not set)',
      sslMode
    },
    attempts
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🚀 Nicsan CRM Backend running on port ' + PORT);
  console.log('🏥 Health check: /health');
  console.log('🔗 API base: /api');
  console.log('🔌 WebSocket server: ws://' + (process.env.HOST || '0.0.0.0') + ':' + PORT);
  console.log('🌐 CORS enabled for: https://app.nicsanin.com, https://staging.nicsanin.com');
});

module.exports = { app, server };