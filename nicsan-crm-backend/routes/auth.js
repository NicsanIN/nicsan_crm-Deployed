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

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getAllUsers();
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users'
    });
  }
});

// Get user by ID
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authService.getUserById(id);
    res.json(result);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'User not found'
    });
  }
});

// Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await authService.updateUser(id, updateData);
    res.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authService.deleteUser(id);
    res.json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
});

// Toggle user status
router.patch('/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const result = await authService.updateUser(id, { is_active });
    res.json(result);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle user status'
    });
  }
});

// Update user password
router.patch('/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const passwordHash = await authService.hashPassword(password);
    const result = await authService.updateUser(id, { password_hash: passwordHash });
    res.json(result);
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user password'
    });
  }
});

module.exports = router;

