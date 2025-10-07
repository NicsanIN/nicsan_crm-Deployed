import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const PasswordChangeForm: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('You must be logged in to change your password');
      }

      // Make API call directly
      const response = await fetch('http://localhost:3001/api/password/change-own', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Current Password */}
      <div>
        <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="block w-full px-2 py-1.5 pr-8 text-xs border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPasswords.current ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="newPassword" className="block text-xs font-medium text-gray-700 mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="block w-full px-2 py-1.5 pr-8 text-xs border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPasswords.new ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Confirm New Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="block w-full px-2 py-1.5 pr-8 text-xs border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPasswords.confirm ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-800 rounded-md">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-2 bg-green-50 text-green-800 rounded-md">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">{success}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full flex justify-center py-1.5 px-3 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};

export default PasswordChangeForm;
