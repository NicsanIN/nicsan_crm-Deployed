const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireOps, requireFounder } = require('../middleware/auth');

// Get all telecallers
router.get('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, is_active, created_at, updated_at
      FROM telecallers 
      WHERE is_active = true
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get telecallers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get telecallers'
    });
  }
});

// Get all telecallers (including inactive) - for Founder management
router.get('/all', authenticateToken, requireFounder, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        is_active, 
        created_at, 
        updated_at,
        (SELECT COUNT(*) FROM policies WHERE caller_name = telecallers.name) as policy_count
      FROM telecallers 
      ORDER BY is_active DESC, name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all telecallers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get telecallers'
    });
  }
});

// Add new telecaller
router.post('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Telecaller name is required and must be at least 2 characters'
      });
    }
    
    const trimmedName = name.trim();
    
    // Check if telecaller already exists
    const existing = await query(
      'SELECT id FROM telecallers WHERE name = $1',
      [trimmedName]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Telecaller already exists'
      });
    }
    
    // Insert new telecaller
    const result = await query(`
      INSERT INTO telecallers (name)
      VALUES ($1)
      RETURNING *
    `, [trimmedName]);
    
    console.log('✅ New telecaller added:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add telecaller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add telecaller'
    });
  }
});

// Update telecaller
router.put('/:id', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;
    
    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Telecaller name is required and must be at least 2 characters'
      });
    }
    
    const trimmedName = name.trim();
    
    // Check if telecaller already exists (excluding current record)
    const existing = await query(
      'SELECT id FROM telecallers WHERE name = $1 AND id != $2',
      [trimmedName, id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Telecaller name already exists'
      });
    }
    
    // Update telecaller
    const result = await query(`
      UPDATE telecallers 
      SET name = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [trimmedName, is_active !== false, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Telecaller not found'
      });
    }
    
    console.log('✅ Telecaller updated:', result.rows[0]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update telecaller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update telecaller'
    });
  }
});

// Delete telecaller (soft delete)
router.delete('/:id', authenticateToken, requireOps, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const result = await query(`
      UPDATE telecallers 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Telecaller not found'
      });
    }
    
    console.log('✅ Telecaller deleted:', result.rows[0]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete telecaller error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete telecaller'
    });
  }
});

module.exports = router;
