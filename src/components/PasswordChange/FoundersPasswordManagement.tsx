import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, History, User } from 'lucide-react';
import { passwordService } from '../../services/passwordService';
import type { AdminPasswordChangeRequest, PasswordHistoryItem, User as UserType } from '../../types/passwordTypes';

const FoundersPasswordManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    reason: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load users and password history on component mount
  useEffect(() => {
    loadUsers();
    loadPasswordHistory();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await passwordService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadPasswordHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await passwordService.getPasswordHistory();
      setPasswordHistory(history);
    } catch (err) {
      console.error('Failed to load password history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUserSelect = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setFormData({ newPassword: '', reason: '' });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!selectedUser) {
      setError('Please select a user');
      return false;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!formData.reason.trim()) {
      setError('Reason for password change is required');
      return false;
    }

    if (formData.reason.trim().length < 5) {
      setError('Reason must be at least 5 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedUser) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData: AdminPasswordChangeRequest = {
        targetUserId: selectedUser.id,
        newPassword: formData.newPassword,
        reason: formData.reason.trim()
      };

      await passwordService.changeAnyPassword(requestData);
      setSuccess(`Password changed successfully for ${selectedUser.name}`);
      setFormData({ newPassword: '', reason: '' });
      setSelectedUser(null);
      
      // Reload password history
      loadPasswordHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Password Change Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Lock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Change User Password</h3>
            <p className="text-sm text-gray-600">Change password for any user in the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div>
            <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              id="userSelect"
              value={selectedUser?.id || ''}
              onChange={(e) => handleUserSelect(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Choose a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Password Change
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter reason for password change (e.g., Password reset requested by user, Account recovery, etc.)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 5 characters long</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Password History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <History className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Password Change History</h3>
              <p className="text-sm text-gray-600">Complete audit trail of all password changes</p>
            </div>
          </div>
          <button
            onClick={loadPasswordHistory}
            disabled={isLoadingHistory}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoadingHistory ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Changed By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Target User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody>
              {passwordHistory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">{formatTimestamp(item.timestamp)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{item.changed_by_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{item.target_user_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.action === 'admin_password_change' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.action === 'admin_password_change' ? 'Admin Change' : 'Self Change'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {item.reason || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {passwordHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No password changes found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoundersPasswordManagement;
