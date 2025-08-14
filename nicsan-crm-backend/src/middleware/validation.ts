import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const validatePolicyData = (req: Request, res: Response, next: NextFunction) => {
  const { policy_number, vehicle_number, insurer, total_premium } = req.body;

  const errors: string[] = [];

  if (!policy_number) errors.push('Policy number is required');
  if (!vehicle_number) errors.push('Vehicle number is required');
  if (!insurer) errors.push('Insurer is required');
  if (!total_premium || total_premium <= 0) errors.push('Total premium must be greater than 0');

  if (errors.length > 0) {
    return next(createError(`Validation failed: ${errors.join(', ')}`, 400));
  }

  next();
};

export const validateUserData = (req: Request, res: Response, next: NextFunction) => {
  const { email, name, password, role } = req.body;

  const errors: string[] = [];

  if (!email || !email.includes('@')) errors.push('Valid email is required');
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (!role || !['ops', 'founder'].includes(role)) errors.push('Valid role is required');

  if (errors.length > 0) {
    return next(createError(`Validation failed: ${errors.join(', ')}`, 400));
  }

  next();
};

export const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError('Email and password are required', 400));
  }

  next();
};
