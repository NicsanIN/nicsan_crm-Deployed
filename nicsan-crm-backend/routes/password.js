const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Operations: Change own password
router.post('/change-own', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Get current user
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate current password
    const isValidCurrent = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidCurrent) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log the change
    await query(
      'INSERT INTO password_change_logs (changed_by, target_user, action, timestamp) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [userId, userId, 'self_password_change']
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Founders: Change any user's password
router.post('/admin/change-any', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const { targetUserId, newPassword, reason } = req.body;
    const adminUserId = req.user.id;

    // Validation
    if (!targetUserId || !newPassword || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Target user, new password, and reason are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    if (reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason must be at least 5 characters long'
      });
    }

    // Check if target user exists
    const targetUserResult = await query('SELECT id, name FROM users WHERE id = $1', [targetUserId]);
    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update target user's password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, targetUserId]
    );

    // Log the change
    await query(
      'INSERT INTO password_change_logs (changed_by, target_user, action, timestamp) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [adminUserId, targetUserId, 'admin_password_change']
    );

    res.json({
      success: true,
      message: `Password changed successfully for ${targetUserResult.rows[0].name}`
    });

  } catch (error) {
    console.error('Admin password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get password change history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let queryText;
    let queryParams;

    if (userRole === 'founder') {
      // Founders can see all password changes
      queryText = `
        SELECT 
          pcl.id,
          pcl.action,
          pcl.timestamp,
          u1.name as changed_by_name,
          u2.name as target_user_name,
          pcl.reason
        FROM password_change_logs pcl
        JOIN users u1 ON pcl.changed_by = u1.id
        JOIN users u2 ON pcl.target_user = u2.id
        ORDER BY pcl.timestamp DESC
        LIMIT 100
      `;
      queryParams = [];
    } else {
      // Operations can only see their own password changes
      queryText = `
        SELECT 
          pcl.id,
          pcl.action,
          pcl.timestamp,
          u1.name as changed_by_name,
          u2.name as target_user_name
        FROM password_change_logs pcl
        JOIN users u1 ON pcl.changed_by = u1.id
        JOIN users u2 ON pcl.target_user = u2.id
        WHERE pcl.target_user = $1
        ORDER BY pcl.timestamp DESC
        LIMIT 50
      `;
      queryParams = [userId];
    }

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Password history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all users (for founders to select target user)
router.get('/users', authenticateToken, requireRole(['founder']), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, role, department, is_active
      FROM users 
      WHERE is_active = true
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
