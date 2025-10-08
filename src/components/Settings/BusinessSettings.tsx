import React, { useState, useEffect } from 'react';
import LabeledInput from '../common/LabeledInput';
import DualStorageService from '../../services/dualStorageService';

const BusinessSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    brokeragePercent: '15',
    repDailyCost: '2000',
    expectedConversion: '25',
    premiumGrowth: '10'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [settings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await DualStorageService.getSettings();
      if (response.success) {
        setSettings(response.data);
        setHasChanges(false);
      } else {
        setError(response.error || 'Failed to load settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateSettings = (settings: any) => {
    const errors: any = {};
    
    // Brokerage % validation
    if (!settings.brokeragePercent || isNaN(parseFloat(settings.brokeragePercent))) {
      errors.brokeragePercent = 'Brokerage % is required and must be a number';
    } else {
      const value = parseFloat(settings.brokeragePercent);
      if (value < 0 || value > 100) {
        errors.brokeragePercent = 'Brokerage % must be between 0 and 100';
      }
    }
    
    // Rep Daily Cost validation
    if (!settings.repDailyCost || isNaN(parseFloat(settings.repDailyCost))) {
      errors.repDailyCost = 'Rep Daily Cost is required and must be a number';
    } else {
      const value = parseFloat(settings.repDailyCost);
      if (value < 0) {
        errors.repDailyCost = 'Rep Daily Cost must be positive';
      }
    }
    
    // Expected Conversion % validation
    if (!settings.expectedConversion || isNaN(parseFloat(settings.expectedConversion))) {
      errors.expectedConversion = 'Expected Conversion % is required and must be a number';
    } else {
      const value = parseFloat(settings.expectedConversion);
      if (value < 0 || value > 100) {
        errors.expectedConversion = 'Expected Conversion % must be between 0 and 100';
      }
    }
    
    // Premium Growth % validation
    if (!settings.premiumGrowth || isNaN(parseFloat(settings.premiumGrowth))) {
      errors.premiumGrowth = 'Premium Growth % is required and must be a number';
    } else {
      const value = parseFloat(settings.premiumGrowth);
      if (value < 0 || value > 100) {
        errors.premiumGrowth = 'Premium Growth % must be between 0 and 100';
      }
    }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate settings
      const validationErrors = validateSettings(settings);
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors);
        return;
      }
      
      // Save settings
      const response = await DualStorageService.saveSettings(settings);
      
      if (response.success) {
        setSuccess(`Settings saved successfully! (${response.source || 'Saved'})`);
        setHasChanges(false);
        setValidationErrors({});
        setDataSource(response.source || 'Unknown');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to save settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Reset settings
      const response = await DualStorageService.resetSettings();
      
      if (response.success) {
        setSettings(response.data);
        setHasChanges(false);
        setValidationErrors({});
        setSuccess(`Settings reset to defaults! (${response.source || 'Reset'})`);
        setDataSource(response.source || 'Unknown');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to reset settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Business Settings</h3>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xs text-red-800">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-800">{success}</div>
        </div>
      )}
      
      {/* Settings Grid - More Compact */}
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput 
          label="Brokerage %" 
          hint="% of GWP that we earn"
          value={settings.brokeragePercent}
          onChange={(value) => updateSetting('brokeragePercent', value)}
          error={validationErrors.brokeragePercent}
        />
        <LabeledInput 
          label="Rep Daily Cost (₹)" 
          hint="salary + incentives + telephony + tools / working days"
          value={settings.repDailyCost}
          onChange={(value) => updateSetting('repDailyCost', value)}
          error={validationErrors.repDailyCost}
        />
        <LabeledInput 
          label="Expected Conversion %" 
          hint="for valuing backlog"
          value={settings.expectedConversion}
          onChange={(value) => updateSetting('expectedConversion', value)}
          error={validationErrors.expectedConversion}
        />
        <LabeledInput 
          label="Premium Growth %" 
          hint="for LTV estimates later"
          value={settings.premiumGrowth}
          onChange={(value) => updateSetting('premiumGrowth', value)}
          error={validationErrors.premiumGrowth}
        />
      </div>
      
      {/* Action Buttons - More Compact */}
      <div className="flex gap-2 pt-1">
        <button 
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
        <button 
          onClick={handleReset}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-white border-2 border-gray-300 text-gray-700 text-xs font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default BusinessSettings;
