import React, { useState, useEffect } from 'react';
import { Lock, History, AlertCircle } from 'lucide-react';
import { passwordService } from '../../services/passwordService';
import type { PasswordHistoryItem } from '../../types/passwordTypes';
import PasswordChangeForm from './PasswordChangeForm';

const FoundersPasswordManagement: React.FC = () => {
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState('');

  // Load password history on component mount
  useEffect(() => {
    loadPasswordHistory();
  }, []);

  const loadPasswordHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const historyData = await passwordService.getPasswordHistory();
      setPasswordHistory(historyData);
    } catch (err) {
      console.error('Failed to load password history:', err);
      setError('Failed to load password history. Please check your connection and try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {/* Change Your Password */}
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

      {/* Password History */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <History className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Password History</h3>
              <p className="text-xs text-gray-600">Recent password changes in the system</p>
            </div>
          </div>
          <button
            onClick={loadPasswordHistory}
            disabled={isLoadingHistory}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            {isLoadingHistory ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-4 text-xs text-gray-500">Loading password history...</div>
        ) : passwordHistory.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">No password changes found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">User</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Changed By</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Action</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {passwordHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900">{item.target_user_name}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-600">{item.changed_by_name}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        item.action === 'changed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundersPasswordManagement;