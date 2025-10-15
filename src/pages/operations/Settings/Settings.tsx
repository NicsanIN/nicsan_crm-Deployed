import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import WorkingPasswordChange from '../../../components/PasswordChange/WorkingPasswordChange';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

function PageOperationsSettings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { userChanged } = useUserChange();

  // Handle user changes - reset settings when user changes
  useEffect(() => {
    if (userChanged && user) {
      // Reset any user-specific settings or state
      // The password change component will handle its own user change logic
    }
  }, [userChanged, user]);

  return (
    <div className="max-w-2xl space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>
      
      {/* Password Change Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <WorkingPasswordChange />
      </div>
    </div>
  );
}

export default PageOperationsSettings;
