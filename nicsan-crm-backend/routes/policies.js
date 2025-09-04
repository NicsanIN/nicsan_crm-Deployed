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

// Get all policies (with dual storage fallback)
router.get('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const policies = await storageService.getPoliciesWithFallback(parseInt(limit), parseInt(offset));
    
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

// Get policy by ID (with dual storage fallback)
router.get('/:id', authenticateToken, requireOps, async (req, res) => {
  try {
    const policy = await storageService.getPolicyWithFallback(req.params.id);
    
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

// Save manual form (with dual storage)
router.post('/manual', authenticateToken, requireOps, async (req, res) => {
  try {
    const result = await storageService.saveManualForm(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Save manual form error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to save manual form'
    });
  }
});

// Save grid entries (with dual storage)
router.post('/grid', authenticateToken, requireOps, async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Entries must be an array'
      });
    }

    const result = await storageService.saveGridEntries(entries);
    res.status(201).json(result);
  } catch (error) {
    console.error('Save grid entries error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to save grid entries'
    });
  }
});

// Check if policy number already exists
router.get('/check-duplicate/:policyNumber', authenticateToken, requireOps, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    
    if (!policyNumber) {
      return res.status(400).json({
        success: false,
        error: 'Policy number is required'
      });
    }

    const exists = await storageService.checkPolicyNumberExists(policyNumber);
    
    res.json({
      success: true,
      data: {
        policyNumber,
        exists
      }
    });
  } catch (error) {
    console.error('Check policy number duplicate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check policy number'
    });
  }
});

module.exports = router;

