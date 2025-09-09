const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireFounder } = require('../middleware/auth');
const storageService = require('../services/storageService');

// Test endpoint to verify token
router.get('/test-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Get dashboard metrics with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/metrics', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { period = '14d' } = req.query;
    const metrics = await storageService.getDashboardMetricsWithFallback(period);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard metrics'
    });
  }
});

// Get sales explorer data with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/explorer', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { make, model, insurer, cashbackMax = 10 } = req.query;
    const filters = { make, model, insurer, cashbackMax };
    const explorer = await storageService.getSalesExplorerWithFallback(filters);
    
    res.json({
      success: true,
      data: explorer
    });
  } catch (error) {
    console.error('Sales explorer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sales explorer data'
    });
  }
});

// Get leaderboard data with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/leaderboard', authenticateToken, requireFounder, async (req, res) => {
  try {
    const leaderboard = await storageService.getLeaderboardWithFallback();
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get leaderboard data'
    });
  }
});

// Alias for frontend compatibility - sales reps with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/sales-reps', authenticateToken, requireFounder, async (req, res) => {
  try {
    const reps = await storageService.getSalesRepsWithFallback();
    
    res.json({
      success: true,
      data: reps
    });
  } catch (error) {
    console.error('Sales reps error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sales reps data'
    });
  }
});

// Alias for frontend compatibility - vehicle analysis with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/vehicle-analysis', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { make, model, insurer, cashbackMax = 10 } = req.query;
    const filters = { make, model, insurer, cashbackMax };
    const analysis = await storageService.getVehicleAnalysisWithFallback(filters);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Vehicle analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vehicle analysis data'
    });
  }
});

module.exports = router;

