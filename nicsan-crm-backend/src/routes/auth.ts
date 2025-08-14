import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { validateUserData, validateLoginData } from '../middleware/validation';
import { authenticateToken, requireFounderRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { User, UserCreate, UserLogin, ApiResponse } from '../types';

const router = Router();

// Register new user (Founder only)
router.post('/register', authenticateToken, requireFounderRole, validateUserData, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email, name, password, role }: UserCreate = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return next(createError('User with this email already exists', 409));
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, name, passwordHash, role]
    );

    const newUser: User = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    } as ApiResponse<User>);

  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateLoginData, async (req, res, next) => {
  try {
    const { email, password }: UserLogin = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return next(createError('Invalid email or password', 401));
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return next(createError('Invalid email or password', 401));
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = (jwt.sign as any)(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN as string) || '24h' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: result.rows[0]
    } as ApiResponse<User>);

  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!currentPassword || !newPassword) {
      return next(createError('Current password and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return next(createError('New password must be at least 6 characters', 400));
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return next(createError('Current password is incorrect', 401));
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse<null>);

  } catch (error) {
    next(error);
  }
});

export default router;
