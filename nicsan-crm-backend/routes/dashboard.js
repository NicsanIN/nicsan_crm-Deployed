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
    const { make, model, insurer, cashbackMax = 20, branch, rollover, rep, vehiclePrefix, fromDate, toDate, expiryFromDate, expiryToDate } = req.query;
    const filters = { make, model, insurer, cashbackMax, branch, rollover, rep, vehiclePrefix, fromDate, toDate, expiryFromDate, expiryToDate };
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

// Get leaderboard data
router.get('/leaderboard', authenticateToken, requireFounder, async (req, res) => {
  try {
    // Removed date filter to show all-time rep performance (consistent with Sales Explorer)
    const result = await query(`
      SELECT 
        COALESCE(caller_name, 'Unknown') as name,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback_amount) as cashback,
        SUM(brokerage - cashback_amount) as net,
        AVG(cashback_percentage) as avg_cashback_pct
      FROM policies 
      GROUP BY COALESCE(caller_name, 'Unknown')
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

// Get data sources with dual storage (S3 → PostgreSQL → Mock Data)
router.get('/data-sources', authenticateToken, requireFounder, async (req, res) => {
  try {
    const sources = await storageService.getDataSourcesWithFallback();
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Data sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get data sources'
    });
  }
});

// Get Total OD daily breakdown
router.get('/total-od/daily', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await storageService.getTotalODDaily(period);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Total OD daily breakdown error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Total OD daily breakdown'
    });
  }
});

// Get Total OD monthly breakdown
router.get('/total-od/monthly', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { period = '12m' } = req.query;
    const result = await storageService.getTotalODMonthly(period);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Total OD monthly breakdown error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Total OD monthly breakdown'
    });
  }
});

// Get Total OD financial year breakdown
router.get('/total-od/financial-year', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { years = 3 } = req.query;
    const result = await storageService.getTotalODFinancialYear(years);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Total OD financial year breakdown error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Total OD financial year breakdown'
    });
  }
});

module.exports = router;

