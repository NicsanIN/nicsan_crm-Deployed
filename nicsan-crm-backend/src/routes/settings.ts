import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken, requireFounderRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireFounderRole);

// Get business settings
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM business_settings ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        brokerage_percent: 15,
        rep_daily_cost: 1800,
        expected_conversion: 25,
        premium_growth: 12,
        created_at: new Date(),
        updated_at: new Date()
      };

      return res.json({
        success: true,
        message: 'Default business settings retrieved',
        data: defaultSettings
      } as ApiResponse<any>);
    }

    res.json({
      success: true,
      message: 'Business settings retrieved successfully',
      data: result.rows[0]
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// Update business settings
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      brokerage_percent,
      rep_daily_cost,
      expected_conversion,
      premium_growth
    } = req.body;

    // Validate input
    if (brokerage_percent < 0 || brokerage_percent > 100) {
      return next(createError('Brokerage percentage must be between 0 and 100', 400));
    }

    if (rep_daily_cost < 0) {
      return next(createError('Rep daily cost cannot be negative', 400));
    }

    if (expected_conversion < 0 || expected_conversion > 100) {
      return next(createError('Expected conversion must be between 0 and 100', 400));
    }

    if (premium_growth < -100 || premium_growth > 1000) {
      return next(createError('Premium growth must be between -100 and 1000', 400));
    }

    // Check if settings table exists, if not create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id SERIAL PRIMARY KEY,
        brokerage_percent DECIMAL(5,2) NOT NULL DEFAULT 15.00,
        rep_daily_cost DECIMAL(10,2) NOT NULL DEFAULT 1800.00,
        expected_conversion DECIMAL(5,2) NOT NULL DEFAULT 25.00,
        premium_growth DECIMAL(5,2) NOT NULL DEFAULT 12.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert new settings
    const result = await pool.query(
      `INSERT INTO business_settings (
        brokerage_percent, rep_daily_cost, expected_conversion, premium_growth
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [brokerage_percent, rep_daily_cost, expected_conversion, premium_growth]
    );

    res.json({
      success: true,
      message: 'Business settings updated successfully',
      data: result.rows[0]
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// Get settings history
router.get('/history', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM business_settings ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      success: true,
      message: 'Settings history retrieved successfully',
      data: result.rows
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

export default router;
