const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables
dotenv.config();

// Debug logging to verify environment variables are loaded
console.log('🔍 Environment Check:');
console.log('DB_HOST:', process.env.DB_HOST ? 'LOADED' : 'MISSING');
console.log('DB_PORT:', process.env.DB_PORT ? 'LOADED' : 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME ? 'LOADED' : 'MISSING');
console.log('DB_USER:', process.env.DB_USER ? 'LOADED' : 'MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'LOADED' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'MISSING');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? 'LOADED' : 'MISSING');
console.log('FRONTEND_ORIGIN:', process.env.FRONTEND_ORIGIN ? 'LOADED' : 'MISSING');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'LOADED' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('---');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket service
const websocketService = require('./services/websocketService');
websocketService.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Nicsan CRM Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
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
  console.log(`🚀 Nicsan CRM Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
});

module.exports = { app, server };

