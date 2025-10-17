const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (founders only)
router.get('/', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, role, is_active, created_at, updated_at, last_login
      FROM users 
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new user (founders only)
router.post('/', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { name, email, password, role = 'ops' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    if (!['ops', 'founder'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "ops" or "founder"'
      });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(`
      INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, email, role, is_active, created_at
    `, [name, email, hashedPassword, role]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user (founders only)
router.put('/:id', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If email is being changed, check for conflicts
    if (email) {
      const emailConflict = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', 
        [email, id]
      );
      if (emailConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists for another user'
        });
      }
    }

    // Validate role if provided
    if (role && !['ops', 'founder'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "ops" or "founder"'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete user (founders only)
router.delete('/:id', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-deletion
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await query('SELECT id, name FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `User "${existingUser.rows[0].name}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Toggle user status (founders only)
router.patch('/:id/status', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const currentUserId = req.user.id;

    // Prevent self-deactivation
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }

    // Check if user exists
    const existingUser = await query('SELECT id, name, is_active FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update status
    const result = await query(`
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role, is_active, updated_at
    `, [is_active, id]);

    res.json({
      success: true,
      data: result.rows[0],
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user password (founders only)
router.patch('/:id/password', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user exists
    const existingUser = await query('SELECT id, name FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [hashedPassword, id]);

    // Log the change
    await query(
      'INSERT INTO password_change_logs (changed_by, target_user, action, timestamp) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [req.user.id, id, 'admin_password_change']
    );

    res.json({
      success: true,
      message: `Password updated successfully for user "${existingUser.rows[0].name}"`
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
