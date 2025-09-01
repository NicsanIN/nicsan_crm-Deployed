const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const { authenticateToken, requireOps } = require('../middleware/auth');

// Create policy (with dual storage)
router.post('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      source: req.body.source || 'MANUAL_FORM'
    };

    const result = await storageService.savePolicy(policyData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create policy'
    });
  }
});

// Get all policies
router.get('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const policies = await storageService.getAllPolicies(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get policies'
    });
  }
});

// Get policy by ID
router.get('/:id', authenticateToken, requireOps, async (req, res) => {
  try {
    const policy = await storageService.getPolicy(req.params.id);
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get policy'
    });
  }
});

// Update policy
router.put('/:id', authenticateToken, requireOps, async (req, res) => {
  try {
    // For now, we'll implement a simple update
    // In a real app, you'd want to update both S3 and PostgreSQL
    const { query } = require('../config/database');
    
    const policyId = req.params.id;
    const updateData = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    const values = fields.map((field, index) => `$${index + 2}`);
    
    const queryText = `
      UPDATE policies 
      SET ${fields.map(field => `${field} = $${fields.indexOf(field) + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(queryText, [policyId, ...fields.map(field => updateData[field])]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update policy'
    });
  }
});

// Delete policy (from both storages)
router.delete('/:id', authenticateToken, requireOps, async (req, res) => {
  try {
    const result = await storageService.deletePolicy(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete policy'
    });
  }
});

module.exports = router;

