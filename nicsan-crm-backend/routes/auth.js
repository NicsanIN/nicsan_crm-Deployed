const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    const result = await authService.register({ email, password, name, role });
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Profile not found'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate token on backend (if needed)
    // For now, just return success - client will clear localStorage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Initialize default users (development only)
router.post('/init-users', async (req, res) => {
  try {
    await authService.initializeDefaultUsers();
    res.json({
      success: true,
      message: 'Default users initialized successfully'
    });
  } catch (error) {
    console.error('Init users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize users'
    });
  }
});

module.exports = router;

