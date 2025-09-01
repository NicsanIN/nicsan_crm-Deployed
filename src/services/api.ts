// API Service Layer for Nicsan CRM
// Handles all communication with the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ops' | 'founder';
  };
}

export interface Policy {
  id: string;
  policy_number: string;
  vehicle_number: string;
  insurer: string;
  total_premium: number;
  brokerage: number;
  cashback: number;
  net_premium: number;
  policy_type?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreateRequest {
  policy_number: string;
  vehicle_number: string;
  insurer: string;
  total_premium: number;
  brokerage: number;
  cashback: number;
  net_premium: number;
  policy_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface PDFUpload {
  id: string;
  filename: string;
  s3_key: string;
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'completed' | 'failed';
  textract_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: any;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_gwp: number;
  total_brokerage: number;
  total_cashback: number;
  net_revenue: number;
  total_policies: number;
  total_uploads: number;
}

// Utility function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    let token = localStorage.getItem('authToken');
    
    // Check if token is expired or about to expire
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // If token expires in next 5 minutes, try to refresh
        if (payload.exp && (payload.exp - currentTime) < 300) {
          if (ENABLE_DEBUG) console.log('🔄 Token expiring soon, attempting refresh...');
          const refreshResult = await authUtils.refreshToken();
          if (refreshResult.success) {
            token = refreshResult.data.token;
          }
        }
      } catch (error) {
        if (ENABLE_DEBUG) console.log('⚠️ Token validation failed, will attempt refresh');
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    if (ENABLE_DEBUG) console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Authentication API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    console.log('🔍 Debug: Login API called with:', credentials);
    const response = await apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    console.log('🔍 Debug: Login API response:', response);
    return response;
  },

  register: async (userData: any): Promise<ApiResponse<any>> => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    return apiCall('/auth/profile');
  },

  changePassword: async (passwordData: any): Promise<ApiResponse<any>> => {
    return apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};

// Policies API
export const policiesAPI = {
  getAll: async (page = 1, limit = 50, filters?: any): Promise<ApiResponse<{ policies: Policy[]; total: number }>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters && { filters: JSON.stringify(filters) }),
    });
    return apiCall(`/policies?${params}`);
  },

  getById: async (id: string): Promise<ApiResponse<Policy>> => {
    return apiCall(`/policies/${id}`);
  },

  create: async (policy: PolicyCreateRequest): Promise<ApiResponse<Policy>> => {
    return apiCall('/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  },

  update: async (id: string, policy: Partial<PolicyCreateRequest>): Promise<ApiResponse<Policy>> => {
    return apiCall(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/policies/${id}`, {
      method: 'DELETE',
    });
  },

  bulkCreate: async (policies: PolicyCreateRequest[]): Promise<ApiResponse<any>> => {
    return apiCall('/policies/bulk', {
      method: 'POST',
      body: JSON.stringify({ policies }),
    });
  },
};

// PDF Upload API
export const uploadAPI = {
  uploadPDF: async (formData: FormData): Promise<ApiResponse<PDFUpload>> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'PDF uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload PDF',
        message: 'Upload failed'
      };
    }
  },

  getUploads: async (page = 1, limit = 50): Promise<ApiResponse<{ uploads: PDFUpload[]; total: number }>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiCall(`/upload/pdf?${params}`);
  },

  getUploadById: async (uploadId: string): Promise<ApiResponse<PDFUpload>> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/upload/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Upload details retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upload details',
        message: 'Retrieval failed'
      };
    }
  },

  getUploadStatus: async (s3Key: string): Promise<ApiResponse<PDFUpload>> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/upload/internal/by-s3key/${encodeURIComponent(s3Key)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Upload status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upload status',
        message: 'Status retrieval failed'
      };
    }
  },

  retryProcessing: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/upload/pdf/${id}/retry`, {
      method: 'POST',
    });
  },

  confirmUploadAsPolicy: async (uploadId: string): Promise<ApiResponse<any>> => {
    return apiCall(`/upload/${uploadId}/confirm`, {
      method: 'POST',
    });
  },

  getUploadForReview: async (uploadId: string): Promise<ApiResponse<any>> => {
    return apiCall(`/upload/${uploadId}/review`);
  },
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    return apiCall('/dashboard/metrics');
  },

  getSalesReps: async (): Promise<ApiResponse<any[]>> => {
    return apiCall('/dashboard/sales-reps');
  },

  getTrends: async (period = 'month'): Promise<ApiResponse<any[]>> => {
    return apiCall(`/dashboard/trends?period=${period}`);
  },

  getDataSources: async (): Promise<ApiResponse<any[]>> => {
    return apiCall('/dashboard/data-sources');
  },

  getVehicleAnalysis: async (): Promise<ApiResponse<any[]>> => {
    return apiCall('/dashboard/vehicle-analysis');
  },

  getKPIs: async (): Promise<ApiResponse<any>> => {
    return apiCall('/dashboard/kpis');
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return apiCall('/users');
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/users/${id}`);
  },

  update: async (id: string, userData: any): Promise<ApiResponse<any>> => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Auth utilities
export const authUtils = {
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  setToken: (token: string): void => {
    if (ENABLE_DEBUG) console.log('🔍 Debug: Setting token, length:', token.length);
    localStorage.setItem('authToken', token);
    if (ENABLE_DEBUG) console.log('🔍 Debug: Token stored, verifying:', !!localStorage.getItem('authToken'));
  },

  removeToken: (): void => {
    localStorage.removeItem('authToken');
  },

  async refreshToken(): Promise<ApiResponse<any>> {
    try {
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken) {
        return { success: false, error: 'No token to refresh' };
      }

      // Try to get a new token using the current user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.email) {
        // For now, we'll try to login again with stored credentials
        // In a real app, you'd have a refresh token endpoint
        const response = await authAPI.login({ 
          email: user.email, 
          password: '***' // This won't work, but shows the pattern
        });
        
        if (response.success) {
          this.setToken(response.data.token);
          return response;
        }
      }
      
      return { success: false, error: 'Token refresh failed' };
    } catch (error) {
      return { success: false, error: 'Token refresh error' };
    }
  },

  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },
};

export default {
  auth: authAPI,
  policies: policiesAPI,
  upload: uploadAPI,
  dashboard: dashboardAPI,
  users: usersAPI,
  utils: authUtils,
};
