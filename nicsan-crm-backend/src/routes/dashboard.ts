import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken, requireFounderRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { DashboardMetrics, SalesRepPerformance, ApiResponse } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireFounderRole);

// Get overall dashboard metrics
router.get('/metrics', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let dateFilter = '';
    let params: any[] = [];
    
    if (period === '14d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'14 days\'';
    } else if (period === '30d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === '90d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'90 days\'';
    }

    // Get total policies and GWP
    const policiesResult = await pool.query(
      `SELECT 
        COUNT(*) as total_policies,
        COALESCE(SUM(total_premium), 0) as total_gwp,
        COALESCE(AVG(total_premium), 0) as avg_premium
      FROM policies ${dateFilter}`,
      params
    );

    const { total_policies, total_gwp, avg_premium } = policiesResult.rows[0];

    // Calculate brokerage (assuming 15% of GWP)
    const brokerageRate = 0.15;
    const total_brokerage = total_gwp * brokerageRate;

    // Get total cashback
    const cashbackResult = await pool.query(
      `SELECT COALESCE(SUM(cashback_amount), 0) as total_cashback FROM policies ${dateFilter}`,
      params
    );
    const total_cashback = cashbackResult.rows[0].total_cashback;

    // Calculate net revenue
    const net_revenue = total_brokerage - total_cashback;

    // Get conversion rate (assuming we have leads data)
    const conversion_rate = 0; // TODO: Implement when leads system is added

    const metrics: DashboardMetrics = {
      total_policies: parseInt(total_policies),
      total_gwp: parseFloat(total_gwp),
      total_brokerage: parseFloat(total_brokerage.toString()),
      total_cashback: parseFloat(total_cashback.toString()),
      net_revenue: parseFloat(net_revenue.toString()),
      conversion_rate,
      avg_premium: parseFloat(avg_premium)
    };

    res.json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    } as ApiResponse<DashboardMetrics>);

  } catch (error) {
    next(error);
  }
});

// Get sales representative performance
router.get('/sales-reps', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let dateFilter = '';
    let params: any[] = [];
    
    if (period === '14d') {
      dateFilter = 'WHERE p.created_at >= CURRENT_DATE - INTERVAL \'14 days\'';
    } else if (period === '30d') {
      dateFilter = 'WHERE p.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === '90d') {
      dateFilter = 'WHERE p.created_at >= CURRENT_DATE - INTERVAL \'90 days\'';
    }

    // Get sales rep performance data
    const result = await pool.query(
      `SELECT 
        u.name,
        COUNT(p.id) as converted,
        COALESCE(SUM(p.total_premium), 0) as gwp,
        COALESCE(SUM(p.total_premium * 0.15), 0) as brokerage,
        COALESCE(SUM(p.cashback_amount), 0) as cashback,
        COALESCE(SUM(p.total_premium * 0.15 - p.cashback_amount), 0) as net_revenue
      FROM users u
      LEFT JOIN policies p ON u.id = p.created_by
      ${dateFilter}
      GROUP BY u.id, u.name
      ORDER BY net_revenue DESC`,
      params
    );

    // Calculate additional metrics
    const salesReps: SalesRepPerformance[] = result.rows.map((row: any) => {
      const netRevenue = parseFloat(row.net_revenue);
      const converted = parseInt(row.converted);
      
      return {
        id: row.id || 'unknown',
        name: row.name,
        leads_assigned: 0, // TODO: Implement when leads system is added
        converted,
        gwp: parseFloat(row.gwp),
        brokerage: parseFloat(row.brokerage),
        cashback: parseFloat(row.cashback),
        net_revenue: netRevenue,
        conversion_rate: 0, // TODO: Calculate when leads system is added
        cac: 0 // TODO: Calculate when cost data is available
      };
    });

    res.json({
      success: true,
      message: 'Sales rep performance retrieved successfully',
      data: salesReps
    } as ApiResponse<SalesRepPerformance[]>);

  } catch (error) {
    next(error);
  }
});

// Get trend data for charts
router.get('/trends', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { days = '14' } = req.query;
    const numDays = parseInt(days as string);

    const result = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as policies,
        COALESCE(SUM(total_premium), 0) as gwp,
        COALESCE(SUM(total_premium * 0.15), 0) as brokerage,
        COALESCE(SUM(cashback_amount), 0) as cashback,
        COALESCE(SUM(total_premium * 0.15 - cashback_amount), 0) as net_revenue
      FROM policies
      WHERE created_at >= CURRENT_DATE - INTERVAL '${numDays} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`
    );

    const trends = result.rows.map((row: any) => ({
      date: row.date,
      policies: parseInt(row.policies),
      gwp: parseFloat(row.gwp),
      brokerage: parseFloat(row.brokerage),
      cashback: parseFloat(row.cashback),
      net_revenue: parseFloat(row.net_revenue)
    }));

    res.json({
      success: true,
      message: 'Trend data retrieved successfully',
      data: trends
    });

  } catch (error) {
    next(error);
  }
});

// Get trends data
router.get('/trends', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let days = 14;
    if (period === '30d') days = 30;
    else if (period === '90d') days = 90;

    const result = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as policies,
        COALESCE(SUM(total_premium), 0) as gwp,
        COALESCE(SUM(total_premium * 0.15 - cashback_amount), 0) as net_revenue
      FROM policies
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`
    );

    const trends = result.rows.map((row: any) => ({
      date: row.date,
      policies: parseInt(row.policies),
      gwp: parseFloat(row.gwp),
      net_revenue: parseFloat(row.net_revenue)
    }));

    res.json({
      success: true,
      message: 'Trends data retrieved successfully',
      data: trends
    });

  } catch (error) {
    next(error);
  }
});

// Get data source analysis
router.get('/data-sources', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let dateFilter = '';
    let params: any[] = [];
    
    if (period === '14d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'14 days\'';
    } else if (period === '30d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === '90d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'90 days\'';
    }

    const result = await pool.query(
      `SELECT 
        source,
        COUNT(*) as policies,
        COALESCE(SUM(total_premium), 0) as gwp
      FROM policies
      ${dateFilter}
      GROUP BY source
      ORDER BY gwp DESC`,
      params
    );

    const sources = result.rows.map((row: any) => ({
      name: row.source,
      policies: parseInt(row.policies),
      gwp: parseFloat(row.gwp)
    }));

    res.json({
      success: true,
      message: 'Data source analysis retrieved successfully',
      data: sources
    });

  } catch (error) {
    next(error);
  }
});

// Get vehicle make/model analysis
router.get('/vehicle-analysis', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let dateFilter = '';
    let params: any[] = [];
    
    if (period === '14d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'14 days\'';
    } else if (period === '30d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === '90d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'90 days\'';
    }

    const result = await pool.query(
      `SELECT 
        make,
        model,
        COUNT(*) as policies,
        COALESCE(SUM(total_premium), 0) as gwp,
        COALESCE(AVG(cashback_percentage), 0) as avg_cashback_pct,
        COALESCE(SUM(cashback_amount), 0) as total_cashback,
        COALESCE(SUM(total_premium * 0.15 - cashback_amount), 0) as net_revenue
      FROM policies
      ${dateFilter}
      GROUP BY make, model
      ORDER BY net_revenue DESC
      LIMIT 20`,
      params
    );

    const analysis = result.rows.map((row: any) => ({
      make: row.make,
      model: row.model,
      policies: parseInt(row.policies),
      gwp: parseFloat(row.gwp),
      avg_cashback_pct: parseFloat(row.avg_cashback_pct),
      total_cashback: parseFloat(row.total_cashback),
      net_revenue: parseFloat(row.net_revenue)
    }));

    res.json({
      success: true,
      message: 'Vehicle analysis retrieved successfully',
      data: analysis
    });

  } catch (error) {
    next(error);
  }
});

// Get KPI calculations
router.get('/kpis', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { period = '14d' } = req.query;
    
    let dateFilter = '';
    let params: any[] = [];
    
    if (period === '14d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'14 days\'';
    } else if (period === '30d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === '90d') {
      dateFilter = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'90 days\'';
    }

    // Get basic metrics
    const basicResult = await pool.query(
      `SELECT 
        COUNT(*) as total_policies,
        COALESCE(SUM(total_premium), 0) as total_gwp,
        COALESCE(SUM(cashback_amount), 0) as total_cashback
      FROM policies ${dateFilter}`,
      params
    );

    const { total_policies, total_gwp, total_cashback } = basicResult.rows[0];

    // Calculate KPIs
    const gwp = parseFloat(total_gwp);
    const cashback = parseFloat(total_cashback);
    const brokerage = gwp * 0.15; // 15% brokerage rate
    const netRevenue = brokerage - cashback;

    // Assumptions for demo (in real system, these would come from other tables)
    const totalLeads = Math.round(gwp / 10000); // Rough estimate
    const conversionRate = total_policies > 0 ? (total_policies / totalLeads) * 100 : 0;
    const avgPremium = total_policies > 0 ? gwp / total_policies : 0;
    const cashbackRate = gwp > 0 ? (cashback / gwp) * 100 : 0;

    const kpis = {
      // Acquisition
      conversion_rate: Math.round(conversionRate * 100) / 100,
      cost_per_lead: 0, // TODO: Implement when marketing data is available
      cac: 0, // TODO: Implement when cost data is available
      
      // Value
      arpa: Math.round(avgPremium),
      retention_rate: 78, // Demo assumption
      churn_rate: 22, // Demo assumption
      
      // Financial
      total_gwp: Math.round(gwp),
      total_brokerage: Math.round(brokerage),
      total_cashback: Math.round(cashback),
      net_revenue: Math.round(netRevenue),
      cashback_rate: Math.round(cashbackRate * 100) / 100
    };

    res.json({
      success: true,
      message: 'KPI data retrieved successfully',
      data: kpis
    });

  } catch (error) {
    next(error);
  }
});

export default router;
