const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireFounder } = require('../middleware/auth');

// Test endpoint to verify token
router.get('/test-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Get dashboard metrics
router.get('/metrics', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { period = '14d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    // NOTE: For data consistency across all founder pages:
    // - Rep Leaderboard: Shows all-time data (no date filter)
    // - Sales Explorer: Shows all-time data (no date filter)  
    // - Data Sources: Shows all-time data (no date filter)
    // - Basic Metrics: Still uses date filter for KPI calculations

    // Get basic metrics
    const basicMetrics = await query(`
      SELECT 
        COUNT(*) as total_policies,
        SUM(total_premium) as total_gwp,
        SUM(brokerage) as total_brokerage,
        SUM(cashback) as total_cashback,
        SUM(brokerage - cashback) as net_revenue,
        AVG(total_premium) as avg_premium
      FROM policies 
      WHERE created_at >= $1
    `, [startDate]);

    // Get policies by source (all-time data for consistency with Rep Leaderboard and Sales Explorer)
    const sourceMetrics = await query(`
      SELECT 
        source,
        COUNT(*) as count,
        SUM(total_premium) as gwp
      FROM policies 
      GROUP BY source
      ORDER BY gwp DESC
    `);

    // Get top performers
    const topPerformers = await query(`
      SELECT 
        executive,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback) as cashback,
        SUM(brokerage - cashback) as net
      FROM policies 
      WHERE created_at >= $1 AND executive IS NOT NULL
      GROUP BY executive
      ORDER BY net DESC
      LIMIT 10
    `, [startDate]);

    // Get daily trend
    const dailyTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage - cashback) as net
      FROM policies 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [startDate]);

    // Calculate KPIs
    const metrics = basicMetrics.rows[0];
    const totalPolicies = parseInt(metrics.total_policies) || 0;
    const totalGWP = parseFloat(metrics.total_gwp) || 0;
    const totalBrokerage = parseFloat(metrics.total_brokerage) || 0;
    const totalCashback = parseFloat(metrics.total_cashback) || 0;
    const netRevenue = parseFloat(metrics.net_revenue) || 0;
    const avgPremium = parseFloat(metrics.avg_premium) || 0;

    // Calculate ratios
    const conversionRate = totalPolicies > 0 ? (totalPolicies / (totalPolicies * 1.2)) * 100 : 0; // Mock calculation
    const lossRatio = totalGWP > 0 ? (totalCashback / totalGWP) * 100 : 0;
    const expenseRatio = totalGWP > 0 ? ((totalBrokerage - totalCashback) / totalGWP) * 100 : 0;
    const combinedRatio = lossRatio + expenseRatio;

    res.json({
      success: true,
      data: {
        period,
        basicMetrics: {
          totalPolicies,
          totalGWP,
          totalBrokerage,
          totalCashback,
          netRevenue,
          avgPremium
        },
        kpis: {
          conversionRate: conversionRate.toFixed(1),
          lossRatio: lossRatio.toFixed(1),
          expenseRatio: expenseRatio.toFixed(1),
          combinedRatio: combinedRatio.toFixed(1)
        },
        sourceMetrics: sourceMetrics.rows,
        topPerformers: topPerformers.rows,
        dailyTrend: dailyTrend.rows.reverse() // Reverse to show oldest first
      }
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

// Alias for frontend compatibility - sales reps
router.get('/sales-reps', authenticateToken, requireFounder, async (req, res) => {
  try {
    // Removed date filter to show all-time rep performance (consistent with Sales Explorer)
    const result = await query(`
      SELECT 
        COALESCE(executive, 'Unknown') as name,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback_amount) as cashback,
        SUM(brokerage - cashback_amount) as net_revenue,
        AVG(cashback_percentage) as avg_cashback_pct
      FROM policies 
      GROUP BY COALESCE(executive, 'Unknown')
      ORDER BY net_revenue DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Sales reps error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sales reps data'
    });
  }
});

// Alias for frontend compatibility - vehicle analysis
router.get('/vehicle-analysis', authenticateToken, requireFounder, async (req, res) => {
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
        executive as rep,
        make,
        model,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        AVG(cashback_percentage) as cashbackPctAvg,
        SUM(cashback_amount) as cashback,
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
    console.error('Vehicle analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vehicle analysis data'
    });
  }
});

module.exports = router;

