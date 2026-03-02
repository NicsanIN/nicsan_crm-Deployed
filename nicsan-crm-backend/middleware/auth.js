const authService = require('../services/authService');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user is founder (allow ops access too)
const requireFounder = requireRole(['founder', 'ops']);

// Middleware: founder only (no ops) - for admin overrides like task reassign
const requireFounderOnly = requireRole(['founder']);

// Middleware to check if user is ops, founder, or admin
const requireOps = requireRole(['ops', 'founder', 'admin']);

// Middleware to check if user is telecaller (for task creation, my-requests)
const requireTelecaller = requireRole(['telecaller']);

// Middleware: telecaller OR admin/founder (e.g. admin can create task on behalf)
const requireTelecallerOrAdmin = requireRole(['telecaller', 'founder', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireFounder,
  requireFounderOnly,
  requireOps,
  requireTelecaller,
  requireTelecallerOrAdmin
};

