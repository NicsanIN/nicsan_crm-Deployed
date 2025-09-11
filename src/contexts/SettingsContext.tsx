import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import NicsanCRMService from '../services/api-integration';

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

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    brokeragePercent: '15',
    repDailyCost: '2000',
    expectedConversion: '25',
    premiumGrowth: '10'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await NicsanCRMService.getSettings();
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
    refreshSettings();
  }, []);

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
