import { apiCall } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ops' | 'founder';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'ops' | 'founder';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'ops' | 'founder';
  is_active?: boolean;
}

export const userService = {
  // Get all users (founders only)
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiCall<User[]>('/users');
    return response.data || [];
  },

  // Create new user (founders only)
  createUser: async (userData: CreateUserRequest) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Update user (founders only)
  updateUser: async (id: number, userData: UpdateUserRequest) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Delete user (founders only)
  deleteUser: async (id: number) => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Toggle user status (founders only)
  toggleUserStatus: async (id: number, is_active: boolean) => {
    return apiCall(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active })
    });
  },

  // Update user password (founders only)
  updateUserPassword: async (id: number, password: string) => {
    return apiCall(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
  }
};
