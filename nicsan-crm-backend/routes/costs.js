const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all monthly recurring costs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        mrc.*,
        u.name as created_by_name
      FROM monthly_recurring_costs mrc
      JOIN users u ON mrc.created_by = u.id
      ORDER BY mrc.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get costs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new monthly recurring cost
router.post('/', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const {
      product_name,
      cost_amount,
      currency = 'INR',
      start_date,
      end_date,
      status = 'active',
      category,
      description
    } = req.body;

    // Validation
    if (!product_name || !cost_amount || !start_date || !category) {
      return res.status(400).json({
        success: false,
        error: 'Product name, cost amount, start date, and category are required'
      });
    }

    if (cost_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Cost amount must be greater than 0'
      });
    }

    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    // Insert new cost
    const result = await query(`
      INSERT INTO monthly_recurring_costs 
      (product_name, cost_amount, currency, start_date, end_date, status, category, description, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [product_name, cost_amount, currency, start_date, end_date, status, category, description, req.user.id]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Monthly recurring cost created successfully'
    });

  } catch (error) {
    console.error('Create cost error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update monthly recurring cost
router.put('/:id', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      cost_amount,
      currency,
      start_date,
      end_date,
      status,
      category,
      description
    } = req.body;

    // Check if cost exists
    const existingCost = await query('SELECT id FROM monthly_recurring_costs WHERE id = $1', [id]);
    if (existingCost.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cost not found'
      });
    }

    // Validation
    if (cost_amount && cost_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Cost amount must be greater than 0'
      });
    }

    if (end_date && start_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    // Update cost
    const result = await query(`
      UPDATE monthly_recurring_costs 
      SET 
        product_name = COALESCE($1, product_name),
        cost_amount = COALESCE($2, cost_amount),
        currency = COALESCE($3, currency),
        start_date = COALESCE($4, start_date),
        end_date = $5,
        status = COALESCE($6, status),
        category = COALESCE($7, category),
        description = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [product_name, cost_amount, currency, start_date, end_date, status, category, description, id]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Monthly recurring cost updated successfully'
    });

  } catch (error) {
    console.error('Update cost error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete monthly recurring cost
router.delete('/:id', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if cost exists
    const existingCost = await query('SELECT id FROM monthly_recurring_costs WHERE id = $1', [id]);
    if (existingCost.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cost not found'
      });
    }

    // Delete cost
    await query('DELETE FROM monthly_recurring_costs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Monthly recurring cost deleted successfully'
    });

  } catch (error) {
    console.error('Delete cost error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get cost summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = await query(`
      SELECT 
        COUNT(*) as total_costs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_costs,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_costs,
        SUM(CASE WHEN status = 'active' THEN cost_amount ELSE 0 END) as total_active_amount,
        AVG(CASE WHEN status = 'active' THEN cost_amount ELSE NULL END) as average_cost
      FROM monthly_recurring_costs
    `);

    const categoryBreakdown = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN cost_amount ELSE 0 END) as total_amount
      FROM monthly_recurring_costs
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    res.json({
      success: true,
      data: {
        summary: summary.rows[0],
        categoryBreakdown: categoryBreakdown.rows
      }
    });

  } catch (error) {
    console.error('Get cost summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
