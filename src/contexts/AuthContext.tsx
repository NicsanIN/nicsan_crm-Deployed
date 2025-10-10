import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authAPI, authUtils } from '../services/api';
import DualStorageService from '../services/dualStorageService';
import type { LoginRequest } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ops' | 'founder';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // NEW: Unified state management
  forceUserUpdate: () => void;
  clearUserCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userChangeListeners, setUserChangeListeners] = useState<Set<() => void>>(new Set());

  const isAuthenticated = !!user;

  // Force user update for immediate executive field updates
  const forceUserUpdate = useCallback(() => {
    setUser(prev => prev ? { ...prev } : null);
    userChangeListeners.forEach(listener => listener());
  }, [userChangeListeners]);

  // Clear user cache on logout
  const clearUserCache = useCallback(() => {
    localStorage.removeItem('nicsan_crm_policies');
    localStorage.removeItem('nicsan_crm_uploads');
    localStorage.removeItem('nicsan_crm_dashboard');
    localStorage.removeItem('nicsan_settings');
  }, []);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authUtils.getToken();
        if (token) {
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, remove it
            authUtils.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authUtils.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearUserCache();
      
      // Unified login with dual storage fallback
      const response = await DualStorageService.login(credentials);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        authUtils.setToken(token);
        setUser(userData);
        
        // Force immediate executive field updates
        setTimeout(() => forceUserUpdate(), 100);
        
        return true;
      } else {
        console.error('Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Backend logout failed:', error);
    } finally {
      // Clear user state first
      setUser(null);
      clearUserCache();
      
      // Clear all localStorage data
      authUtils.logout();
      
      // Force immediate update
      forceUserUpdate();
    }
  };

  const refreshUser = async () => {
    try {
      clearUserCache();
      
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        // Force immediate update
        setTimeout(() => forceUserUpdate(), 100);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    forceUserUpdate,
    clearUserCache,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
