import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken, requireFounderRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { User, ApiResponse } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireFounderRole);

// Get all users
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.rows
    } as ApiResponse<User[]>);

  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: result.rows[0]
    } as ApiResponse<User>);

  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    // Update user
    const result = await pool.query(
      'UPDATE users SET name = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, role, created_at',
      [name, role, id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    } as ApiResponse<User>);

  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    // Check if user has created policies
    const policiesResult = await pool.query(
      'SELECT COUNT(*) FROM policies WHERE created_by = $1',
      [id]
    );

    if (parseInt(policiesResult.rows[0].count) > 0) {
      return next(createError('Cannot delete user with existing policies', 400));
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    } as ApiResponse<null>);

  } catch (error) {
    next(error);
  }
});

export default router;
