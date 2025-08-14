import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken, requireAnyRole, AuthenticatedRequest } from '../middleware/auth';
import { validatePolicyData } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { Policy, PolicyCreate, ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAnyRole);

// Get all policies with pagination
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const { status, insurer, source, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (insurer) {
      paramCount++;
      whereClause += ` AND insurer ILIKE $${paramCount}`;
      params.push(`%${insurer}%`);
    }

    if (source) {
      paramCount++;
      whereClause += ` AND source = $${paramCount}`;
      params.push(source);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (policy_number ILIKE $${paramCount} OR vehicle_number ILIKE $${paramCount} OR make ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM policies ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get policies
    paramCount++;
    const policiesResult = await pool.query(
      `SELECT * FROM policies ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Policies retrieved successfully',
      data: policiesResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as PaginatedResponse<Policy>);

  } catch (error) {
    next(error);
  }
});

// Get policy by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM policies WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(createError('Policy not found', 404));
    }

    res.json({
      success: true,
      message: 'Policy retrieved successfully',
      data: result.rows[0]
    } as ApiResponse<Policy>);

  } catch (error) {
    next(error);
  }
});

// Create new policy
router.post('/', validatePolicyData, async (req: AuthenticatedRequest, res, next) => {
  try {
    const policyData: PolicyCreate = req.body;
    const userId = req.user?.userId;

    // Check for duplicate policy number
    const existingPolicy = await pool.query(
      'SELECT id FROM policies WHERE policy_number = $1',
      [policyData.policy_number]
    );

    if (existingPolicy.rows.length > 0) {
      return next(createError('Policy with this number already exists', 409));
    }

    // Insert policy with minimal required fields including brokerage and cashback
    const result = await pool.query(
      `INSERT INTO policies (
        policy_number, vehicle_number, insurer, product_type, vehicle_type, make,
        issue_date, expiry_date, idv, ncb, discount, net_od, ref, total_od,
        net_premium, total_premium, cashback_percentage, cashback_amount,
        customer_paid, executive, caller_name, mobile, source, brokerage, cashback, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *`,
      [
        policyData.policy_number, policyData.vehicle_number, policyData.insurer,
        policyData.product_type || 'Private Car', policyData.vehicle_type || 'Private Car', 
        policyData.make || 'Unknown', policyData.issue_date || new Date(), 
        policyData.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        policyData.idv || 0, policyData.ncb || 0, policyData.discount || 0, 
        policyData.net_od || 0, policyData.ref || null, policyData.total_od || 0, 
        policyData.net_premium || (policyData.total_premium || 0), 
        policyData.total_premium || 0, policyData.cashback_percentage || 0, 
        policyData.cashback_amount || 0, policyData.customer_paid || (policyData.total_premium || 0), 
        policyData.executive || 'Unknown', policyData.caller_name || 'Unknown', 
        policyData.mobile || 'Unknown', policyData.source || 'MANUAL_FORM', 
        policyData.brokerage || 0, policyData.cashback || 0, userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: result.rows[0]
    } as ApiResponse<Policy>);

  } catch (error) {
    next(error);
  }
});

// Update policy
router.put('/:id', validatePolicyData, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId;

    // Check if policy exists
    const existingPolicy = await pool.query(
      'SELECT id FROM policies WHERE id = $1',
      [id]
    );

    if (existingPolicy.rows.length === 0) {
      return next(createError('Policy not found', 404));
    }

    // Check for duplicate policy number if changing
    if (updateData.policy_number) {
      const duplicatePolicy = await pool.query(
        'SELECT id FROM policies WHERE policy_number = $1 AND id != $2',
        [updateData.policy_number, id]
      );

      if (duplicatePolicy.rows.length > 0) {
        return next(createError('Policy with this number already exists', 409));
      }
    }

    // Build update query dynamically
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updateData[field])];

    const result = await pool.query(
      `UPDATE policies SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: result.rows[0]
    } as ApiResponse<Policy>);

  } catch (error) {
    next(error);
  }
});

// Delete policy
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM policies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return next(createError('Policy not found', 404));
    }

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    } as ApiResponse<null>);

  } catch (error) {
    next(error);
  }
});

// Bulk create policies (for grid entry)
router.post('/bulk', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { policies }: { policies: PolicyCreate[] } = req.body;
    const userId = req.user?.userId;

    if (!Array.isArray(policies) || policies.length === 0) {
      return next(createError('Policies array is required', 400));
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < policies.length; i++) {
      try {
        const policy = policies[i];
        
        // Validate required fields
        if (!policy.policy_number || !policy.vehicle_number || !policy.insurer) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check for duplicates
        const existingPolicy = await pool.query(
          'SELECT id FROM policies WHERE policy_number = $1',
          [policy.policy_number]
        );

        if (existingPolicy.rows.length > 0) {
          errors.push(`Row ${i + 1}: Policy number already exists`);
          continue;
        }

        // Insert policy
        const result = await pool.query(
          `INSERT INTO policies (
            policy_number, vehicle_number, insurer, product_type, vehicle_type, make,
            source, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, policy_number`,
          [
            policy.policy_number, policy.vehicle_number, policy.insurer,
            policy.product_type || 'Unknown', policy.vehicle_type || 'Unknown',
            policy.make || 'Unknown', 'MANUAL_GRID', userId
          ]
        );

        results.push(result.rows[0]);

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk operation completed. ${results.length} created, ${errors.length} failed.`,
      data: { results, errors }
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

export default router;
