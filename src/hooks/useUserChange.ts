import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for detecting user changes and triggering immediate updates
 * Used for executive field updates when user switches
 */
export const useUserChange = () => {
  const { user } = useAuth();
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setLastUserId(user.id);
    }
  }, [user, lastUserId]);

  return { 
    userChanged: user?.id !== lastUserId,
    currentUserId: user?.id,
    lastUserId 
  };
};

/**
 * Hook for immediate executive field updates
 * Automatically updates executive field when user changes
 */
export const useExecutiveFieldUpdate = (setExecutive: (name: string) => void) => {
  const { user } = useAuth();
  const { userChanged } = useUserChange();

  useEffect(() => {
    if (userChanged && user) {
      setExecutive(user.name || "");
    }
  }, [userChanged, user, setExecutive]);
};
