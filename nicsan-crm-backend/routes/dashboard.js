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

// Get sales explorer data
router.get('/explorer', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { make, model, insurer, cashbackMax = 10 } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (make && make !== 'All') {
      whereConditions.push(`make = $${paramIndex}`);
      params.push(make);
      paramIndex++;
    }

    if (model && model !== 'All') {
      whereConditions.push(`model = $${paramIndex}`);
      params.push(model);
      paramIndex++;
    }

    if (insurer && insurer !== 'All') {
      whereConditions.push(`insurer = $${paramIndex}`);
      params.push(insurer);
      paramIndex++;
    }

    whereConditions.push(`(cashback_percentage <= $${paramIndex} OR cashback_percentage IS NULL)`);
    params.push(parseFloat(cashbackMax));

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        executive,
        make,
        model,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        AVG(cashback_percentage) as avg_cashback_pct,
        SUM(cashback_amount) as total_cashback,
        SUM(brokerage - cashback_amount) as net
      FROM policies 
      ${whereClause}
      GROUP BY executive, make, model
      ORDER BY net DESC
    `, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Sales explorer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sales explorer data'
    });
  }
});

// Get leaderboard data
router.get('/leaderboard', authenticateToken, requireFounder, async (req, res) => {
  try {
    // Removed date filter to show all-time rep performance (consistent with Sales Explorer)
    const result = await query(`
      SELECT 
        COALESCE(executive, 'Unknown') as executive,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback_amount) as cashback,
        SUM(brokerage - cashback_amount) as net,
        AVG(cashback_percentage) as avg_cashback_pct
      FROM policies 
      GROUP BY COALESCE(executive, 'Unknown')
      ORDER BY net DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: result.rows
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

