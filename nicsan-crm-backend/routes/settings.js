const express = require('express');
const router = express.Router();
const { authenticateToken, requireFounder } = require('../middleware/auth');
const storageService = require('../services/storageService');

// Get current settings
router.get('/', authenticateToken, requireFounder, async (req, res) => {
  try {
    const settings = await storageService.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
});

// Save settings
router.put('/', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { settings } = req.body;
    
    // Validate settings
    const validationErrors = validateSettings(settings);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    const result = await storageService.saveSettings(settings);
    res.json({
      success: true,
      data: result,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings'
    });
  }
});

// Reset to defaults
router.post('/reset', authenticateToken, requireFounder, async (req, res) => {
  try {
    const defaultSettings = {
      brokeragePercent: '15',
      repDailyCost: '2000',
      expectedConversion: '25',
      premiumGrowth: '10'
    };
    
    const result = await storageService.saveSettings(defaultSettings);
    res.json({
      success: true,
      data: result,
      message: 'Settings reset to defaults'
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

function validateSettings(settings) {
  const errors = {};
  
  if (!settings.brokeragePercent || isNaN(settings.brokeragePercent) || 
      settings.brokeragePercent < 0 || settings.brokeragePercent > 100) {
    errors.brokeragePercent = 'Brokerage % must be between 0 and 100';
  }
  
  if (!settings.repDailyCost || isNaN(settings.repDailyCost) || 
      settings.repDailyCost < 0) {
    errors.repDailyCost = 'Rep Daily Cost must be a positive number';
  }
  
  if (!settings.expectedConversion || isNaN(settings.expectedConversion) || 
      settings.expectedConversion < 0 || settings.expectedConversion > 100) {
    errors.expectedConversion = 'Expected Conversion % must be between 0 and 100';
  }
  
  if (!settings.premiumGrowth || isNaN(settings.premiumGrowth) || 
      settings.premiumGrowth < 0 || settings.premiumGrowth > 100) {
    errors.premiumGrowth = 'Premium Growth % must be between 0 and 100';
  }
  
  return errors;
}

module.exports = router;
