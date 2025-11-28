const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

// Save Health Insurance Policy
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const healthData = req.body;
    
    // Validate required fields
    if (!healthData.policy_number) {
      return res.status(400).json({ error: 'Policy number is required' });
    }
    
    if (!healthData.insurer) {
      return res.status(400).json({ error: 'Insurer is required' });
    }
    
    if (!healthData.insuredPersons || healthData.insuredPersons.length === 0) {
      return res.status(400).json({ error: 'At least one insured person is required' });
    }
    
    // Check if policy number already exists
    const exists = await storageService.checkHealthPolicyNumberExists(healthData.policy_number);
    if (exists) {
      return res.status(400).json({ error: 'Policy number already exists' });
    }
    
    // Save health insurance
    const result = await storageService.saveHealthInsurance(healthData);
    
    res.json({
      success: true,
      message: 'Health insurance policy saved successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Health insurance save error:', error);
    res.status(500).json({ 
      error: 'Failed to save health insurance policy',
      details: error.message 
    });
  }
});

// Get search fields only (fast query for search dropdown, no S3 enrichment)
// Must be before /:policyNumber route to avoid route conflicts
router.get('/search-fields', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, policy_number, customer_name, insurer FROM health_insurance ORDER BY created_at DESC'
    );
    
    const searchFields = result.rows.map(row => ({
      id: row.id,
      policy_number: row.policy_number,
      customer_name: row.customer_name,
      insurer: row.insurer,
      type: 'HEALTH'
    }));
    
    res.json({
      success: true,
      data: searchFields
    });
  } catch (error) {
    console.error('Get health insurance search fields error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get health insurance search fields'
    });
  }
});

// Get Health Insurance Policy
router.get('/:policyNumber', authenticateToken, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    
    const healthInsurance = await storageService.getHealthInsurance(policyNumber);
    
    if (!healthInsurance) {
      return res.status(404).json({ error: 'Health insurance policy not found' });
    }
    
    res.json({
      success: true,
      data: healthInsurance
    });
  } catch (error) {
    console.error('❌ Health insurance retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve health insurance policy',
      details: error.message 
    });
  }
});

// Get All Health Insurance Policies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const healthInsuranceList = await storageService.getAllHealthInsurance(
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: healthInsuranceList,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: healthInsuranceList.length
      }
    });
  } catch (error) {
    console.error('❌ Health insurance list retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve health insurance policies',
      details: error.message 
    });
  }
});

// Delete Health Insurance Policy
router.delete('/:policyNumber', authenticateToken, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    
    const deleted = await storageService.deleteHealthInsurance(policyNumber);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Health insurance policy not found' });
    }
    
    res.json({
      success: true,
      message: 'Health insurance policy deleted successfully'
    });
  } catch (error) {
    console.error('❌ Health insurance deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete health insurance policy',
      details: error.message 
    });
  }
});

// Update Health Insurance Policy
router.put('/:policyNumber', authenticateToken, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    const healthData = req.body;
    
    // First delete the existing policy
    await storageService.deleteHealthInsurance(policyNumber);
    
    // Then save the updated policy
    const result = await storageService.saveHealthInsurance(healthData);
    
    res.json({
      success: true,
      message: 'Health insurance policy updated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Health insurance update error:', error);
    res.status(500).json({ 
      error: 'Failed to update health insurance policy',
      details: error.message 
    });
  }
});

module.exports = router;
