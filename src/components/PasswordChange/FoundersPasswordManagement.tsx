import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, History, User } from 'lucide-react';
import { passwordService } from '../../services/passwordService';
import type { AdminPasswordChangeRequest, PasswordHistoryItem, User as UserType } from '../../types/passwordTypes';
import PasswordChangeForm from './PasswordChangeForm';

const FoundersPasswordManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    reason: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load users and password history on component mount
  useEffect(() => {
    loadUsers();
    loadPasswordHistory();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersData = await passwordService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please check your connection and try again.');
    } finally {
      setIsLoadingUsers(false);
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
    setSearchTerm(user ? `${user.name} (${user.email})` : '');
    setShowDropdown(false);
    setFormData({ newPassword: '', reason: '' });
    setError('');
    setSuccess('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedUser(null);
    }
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
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
    <div className="space-y-4">
      {/* Password Change Form */}
      {/* Founder's Own Password Change */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Lock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Change Your Password</h3>
            <p className="text-xs text-gray-600">Update your own account password</p>
          </div>
        </div>
        
        <PasswordChangeForm />
      </div>

      {/* Change Other Users' Passwords */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Lock className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Change User Password</h3>
            <p className="text-xs text-gray-600">Change password for any user in the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* User Selection with Search */}
          <div className="relative">
            <label htmlFor="userSearch" className="block text-xs font-medium text-gray-700 mb-1">
              Search and Select User
            </label>
            <div className="relative">
              <input
                type="text"
                id="userSearch"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Type to search users by name, email, or role..."
                className="w-full px-2 py-1.5 pr-8 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedUser(null);
                    setShowDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="px-2 py-2 text-gray-500 text-xs">
                    Loading users...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className="px-2 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 text-xs">{user.name}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                      <div className="text-xs text-purple-600 capitalize">{user.role}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-2 text-gray-500 text-xs">
                    {users.length === 0 ? 'No users available' : `No users found matching "${searchTerm}"`}
                  </div>
                )}
              </div>
            )}
            
            {/* Selected User Display */}
            {selectedUser && (
              <div className="mt-1 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-900 text-xs">{selectedUser.name}</div>
                    <div className="text-xs text-purple-700">{selectedUser.email} • {selectedUser.role}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="adminNewPassword" className="block text-xs font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="adminNewPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-8 focus:outline-none transition-colors"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                ) : (
                  <Eye className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Must be at least 8 characters long</p>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-xs font-medium text-gray-700 mb-1">
              Reason for Password Change
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-2 py-1.5 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter reason for password change (e.g., Password reset requested by user, Account recovery, etc.)"
              required
            />
            <p className="text-xs text-gray-500 mt-0.5">Must be at least 5 characters long</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-700">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="w-full bg-purple-600 text-white py-1.5 px-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Password History */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <History className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Password Change History</h3>
              <p className="text-xs text-gray-600">Complete audit trail of all password changes</p>
            </div>
          </div>
          <button
            onClick={loadPasswordHistory}
            disabled={isLoadingHistory}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoadingHistory ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-700">Date & Time</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Changed By</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Target User</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {passwordHistory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">{formatTimestamp(item.timestamp)}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-900">{item.changed_by_name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-900">{item.target_user_name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      item.action === 'admin_password_change' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.action === 'admin_password_change' ? 'Admin Change' : 'Self Change'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {passwordHistory.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-xs">
              No password changes found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoundersPasswordManagement;
