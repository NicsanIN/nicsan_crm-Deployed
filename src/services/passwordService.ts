import { apiCall } from './api';
import type { 
  PasswordChangeRequest, 
  AdminPasswordChangeRequest, 
  PasswordHistoryItem, 
  User 
} from '../types/passwordTypes';

export const passwordService = {
  // Operations: Change own password
  changeOwnPassword: async (data: PasswordChangeRequest) => {
    return apiCall('/password/change-own', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Founders: Change any user's password
  changeAnyPassword: async (data: AdminPasswordChangeRequest) => {
    return apiCall('/password/admin/change-any', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get password change history
  getPasswordHistory: async (): Promise<PasswordHistoryItem[]> => {
    const response = await apiCall<PasswordHistoryItem[]>('/password/history');
    return response.data || [];
  },

  // Get all users (for founders)
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiCall<User[]>('/password/users');
    return response.data || [];
  }
};
