import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import DualStorageService from '../services/dualStorageService';

interface Settings {
  brokeragePercent: string;
  repDailyCost: string;
  expectedConversion: string;
  premiumGrowth: string;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  brokeragePercent: '15',
  repDailyCost: '2000',
  expectedConversion: '25',
  premiumGrowth: '10'
};

interface SettingsProviderProps {
  children: ReactNode;
  /** Only founders can access /api/settings. For telecaller/ops, use defaults and skip the API call to avoid 403. */
  userRole?: 'founder' | 'ops' | 'telecaller';
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, userRole = 'ops' }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(userRole === 'founder');
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    if (userRole !== 'founder') return; // /api/settings requires founder role
    try {
      setIsLoading(true);
      setError(null);
      const response = await DualStorageService.getSettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        setError(response.error || 'Failed to load settings');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'founder') {
      refreshSettings();
    } else {
      setSettings(defaultSettings);
      setIsLoading(false);
      setError(null);
    }
  }, [userRole]);

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      error,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
