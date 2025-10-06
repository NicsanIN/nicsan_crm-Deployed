
import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
// import { Save, RefreshCw, Plus, Search, Trash2, Edit, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// LabeledInput component for form inputs
function LabeledInput({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder, 
  error, 
  info,
  hint 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  type?: string; 
  placeholder?: string; 
  error?: string; 
  info?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && <div className="text-xs text-red-500">{error}</div>}
      {info && <div className="text-xs text-gray-500">{info}</div>}
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function PageFounderSettings() {
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
  
    // Telecaller management state
    const [telecallers, setTelecallers] = useState<any[]>([]);
    const [telecallerSearch, setTelecallerSearch] = useState('');
    const [isLoadingTelecallers, setIsLoadingTelecallers] = useState(false);
    const [telecallerError, setTelecallerError] = useState<string | null>(null);
    const [telecallerSuccess, setTelecallerSuccess] = useState<string | null>(null);
  
    // Load settings on component mount
    useEffect(() => {
      loadSettings();
      loadTelecallers();
    }, []);
  
    // Track changes
    useEffect(() => {
      setHasChanges(true);
    }, [settings]);
  
    const [dataSource, setDataSource] = useState<string>('');
  
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await DualStorageService.getSettings();
        if (response.success) {
          setSettings(response.data);
          setHasChanges(false);
          setDataSource(response.source || 'Unknown');
          
          if (ENABLE_DEBUG) {
          }
        } else {
          setError(response.error || 'Failed to load settings');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
  
    // Load all telecallers
    const loadTelecallers = async () => {
      setIsLoadingTelecallers(true);
      setTelecallerError(null);
      try {
        const response = await fetch('http://localhost:3001/api/telecallers/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setTelecallers(data.data);
        } else {
          setTelecallerError(data.error || 'Failed to load telecallers');
        }
      } catch (error: any) {
        setTelecallerError(error.message || 'Failed to load telecallers');
      } finally {
        setIsLoadingTelecallers(false);
      }
    };
  
    // Toggle telecaller status
    const toggleTelecallerStatus = async (id: number, currentStatus: boolean, name: string) => {
      try {
        const response = await fetch(`http://localhost:3001/api/telecallers/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            name: name,
            is_active: !currentStatus 
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setTelecallerSuccess(`Telecaller ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
          loadTelecallers(); // Refresh list
          // Clear success message after 3 seconds
          setTimeout(() => setTelecallerSuccess(null), 3000);
        } else {
          setTelecallerError(data.error || 'Failed to update telecaller');
        }
      } catch (error: any) {
        setTelecallerError(error.message || 'Failed to update telecaller');
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
      <Card title="Business Settings" desc={`These drive calculations in dashboards (Data Source: ${dataSource || 'Loading...'})`}>
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="flex gap-3 mt-4">
          <button 
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          <button 
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white border disabled:opacity-50"
          >
            Reset
          </button>
        </div>
  
        {/* Telecaller Management Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Telecaller Status Management</h3>
          
          {/* Telecaller Error/Success Messages */}
          {telecallerError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">{telecallerError}</div>
            </div>
          )}
          
          {telecallerSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">{telecallerSuccess}</div>
            </div>
          )}
          
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search telecaller by name..."
              value={telecallerSearch}
              onChange={(e) => setTelecallerSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Telecaller List */}
          <div className="space-y-2">
            {telecallers
              .filter(telecaller => 
                telecaller.name.toLowerCase().includes(telecallerSearch.toLowerCase())
              )
              .map(telecaller => (
                <div key={telecaller.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{telecaller.name}</div>
                    <div className="text-sm text-gray-500">
                      {telecaller.policy_count} policies • 
                      Created: {new Date(telecaller.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      telecaller.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {telecaller.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleTelecallerStatus(telecaller.id, telecaller.is_active, telecaller.name)}
                      disabled={isLoadingTelecallers}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        telecaller.is_active 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      } disabled:opacity-50`}
                    >
                      {telecaller.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Empty State */}
          {telecallers.length === 0 && !isLoadingTelecallers && (
            <div className="text-center py-8 text-gray-500">
              No telecallers found.
            </div>
          )}
          
          {/* Loading State */}
          {isLoadingTelecallers && (
            <div className="text-center py-8 text-gray-500">
              Loading telecallers...
            </div>
          )}
          
          {/* No Results */}
          {telecallerSearch.length >= 2 && telecallers.filter(telecaller => 
            telecaller.name.toLowerCase().includes(telecallerSearch.toLowerCase())
          ).length === 0 && !isLoadingTelecallers && (
            <div className="text-center py-4 text-gray-500">
              No telecallers found matching "{telecallerSearch}"
            </div>
          )}
        </div>
      </Card>
    )
  }

export default PageFounderSettings;