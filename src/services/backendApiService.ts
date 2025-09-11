// Backend API Service - Connects frontend to backend APIs
// This replaces the direct S3/Database access with proper backend API calls

import { authAPI, policiesAPI } from './api';

// Environment variables
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

interface BackendApiResult {
  success: boolean;
  data: any;
  source: 'BACKEND_API';
  error?: string;
}

class BackendApiService {
  private static instance: BackendApiService;

  private constructor() {
    if (ENABLE_DEBUG) {
    }
  }

  static getInstance(): BackendApiService {
    if (!BackendApiService.instance) {
      BackendApiService.instance = new BackendApiService();
    }
    return BackendApiService.instance;
  }

  // Check if backend API is available
  isAvailable(): boolean {
    // Always return true for login operations
    // The availability check should be based on server reachability, not authentication status
    return true;
  }

  // Dashboard Metrics from backend
  async getDashboardMetrics(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      const response = await fetch(`${API_BASE}/dashboard/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add missing lead/conversion data for KPI Dashboard
      if (result.data && result.data.basicMetrics) {
        const totalPolicies = result.data.basicMetrics.totalPolicies || 0;
        // Estimate leads as 1.2x policies (assuming 83% conversion rate)
        const estimatedLeads = Math.round(totalPolicies * 1.2);
        const estimatedConverted = totalPolicies;
        
        result.data.total_leads = estimatedLeads;
        result.data.total_converted = estimatedConverted;
        
      }
      
      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Dashboard metrics failed:', error);
      }
      throw error;
    }
  }

  // Sales Reps from backend
  async getSalesReps(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      const response = await fetch(`${API_BASE}/dashboard/sales-reps`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
      }

      // Transform backend data to match frontend expectations
      const transformedData = (result.data || []).map((rep: any) => ({
        name: rep.name,                // Map name → name (no transformation needed)
        leads_assigned: rep.policies,  // Map policies → leads_assigned  
        converted: rep.policies,       // Map policies → converted
        gwp: rep.gwp,
        brokerage: rep.brokerage,
        cashback: rep.cashback,
        net_revenue: rep.net_revenue,
        cac: Math.round(1800 / rep.policies) // Calculate CAC
      }));

      return {
        success: true,
        data: transformedData,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Sales reps failed:', error);
      }
      throw error;
    }
  }

  // Sales Explorer from backend
  async getSalesExplorer(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

 kumar-dev
      const response = await fetch('http://localhost:3001/api/dashboard/explorer', {

      const response = await fetch(`${API_BASE}/dashboard/vehicle-analysis`, {
 main
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
      }

      // Transform backend data to match frontend expectations
      const transformedData = (result.data || []).map((policy: any) => ({
        rep: policy.executive || 'Unknown',  // Use executive field for sales rep names
        make: policy.make || 'Unknown',
        model: policy.model || 'Unknown',
        policies: parseInt(policy.policies) || 0,  // Convert string to number
        gwp: parseFloat(policy.gwp) || 0,  // Convert string to number
        cashbackPctAvg: parseFloat(policy.cashbackPctAvg || policy.avg_cashback_pct || 0),  // Handle both field names and convert to number
        cashback: parseFloat(policy.total_cashback) || 0,  // Convert string to number
        net: parseFloat(policy.net) || 0,  // Convert string to number
        insurer: policy.insurer || 'Unknown'  // Add missing insurer field
      }));

      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: transformedData,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Sales explorer failed:', error);
      }
      throw error;
    }
  }

  // Policy Detail from backend
  async getPolicyDetail(policyId: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      const response = await fetch(`${API_BASE}/policies/${policyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Policy detail failed:', error);
      }
      throw error;
    }
  }

  // Data Sources from backend
  async getDataSources(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      const response = await fetch(`${API_BASE}/dashboard/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
      }

      // Transform sourceMetrics to match frontend expectations
      const sourceMetrics = result.data?.sourceMetrics || [];
      if (ENABLE_DEBUG) {
      }
      
      const transformedData = sourceMetrics.map((source: any) => ({
        name: source.source || 'Unknown',
        policies: parseInt(source.count) || 0,
        gwp: parseFloat(source.gwp) || 0
      }));

      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: transformedData,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Data sources failed:', error);
      }
      throw error;
    }
  }

  // All Policies from backend
  async getAllPolicies(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      const response = await fetch(`${API_BASE}/policies`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: All policies failed:', error);
      }
      throw error;
    }
  }

  // Settings from backend
  async getSettings(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting settings...');
      }

      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Settings retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Settings failed:', error);
      }
      throw error;
    }
  }

  async saveSettings(settings: any): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Saving settings...');
      }

      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Settings saved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Save settings failed:', error);
      }
      throw error;
    }
  }

  async resetSettings(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Resetting settings...');
      }

      const response = await fetch('http://localhost:3001/api/settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Settings reset successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Reset settings failed:', error);
      }
      throw error;
    }
  }

  // Upload PDF from backend
  async uploadPDF(file: File, manualExtras?: any, insurer?: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Uploading PDF...');
      }

      const formData = new FormData();
      formData.append('pdf', file);
      if (insurer) formData.append('insurer', insurer);
      
      if (manualExtras) {
        Object.entries(manualExtras).forEach(([key, value]) => {
          if (value) {
            formData.append(`manual_${key}`, value);
          }
        });
      }

      const response = await fetch('http://localhost:3001/api/upload/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: PDF uploaded successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: PDF upload failed:', error);
      }
      throw error;
    }
  }

  // Get uploads from backend
  async getUploads(page: number = 1, limit: number = 20): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting uploads...');
      }

      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`http://localhost:3001/api/upload?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Uploads retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get uploads failed:', error);
      }
      throw error;
    }
  }

  // Get upload by ID from backend
  async getUploadById(uploadId: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting upload by ID...');
      }

      const response = await fetch(`http://localhost:3001/api/upload/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Upload retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get upload by ID failed:', error);
      }
      throw error;
    }
  }

  // Get upload for review from backend
  async getUploadForReview(uploadId: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting upload for review...');
      }

      const response = await fetch(`http://localhost:3001/api/upload/${uploadId}/review`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Upload for review retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get upload for review failed:', error);
      }
      throw error;
    }
  }

  // Confirm upload as policy from backend
  async confirmUploadAsPolicy(uploadId: string, editedData?: any): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Confirming upload as policy...');
      }

      const requestBody = editedData ? {
        editedData: {
          pdfData: editedData.pdfData,
          manualExtras: editedData.manualExtras
        }
      } : {};

      const response = await fetch(`http://localhost:3001/api/upload/${uploadId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Upload confirmed as policy successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Confirm upload as policy failed:', error);
      }
      throw error;
    }
  }

  // Save manual form from backend
  async saveManualForm(formData: any): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Saving manual form...');
      }

      const response = await fetch('http://localhost:3001/api/policies/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Manual form saved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Save manual form failed:', error);
      }
      throw error;
    }
  }

  // Save grid entries from backend
  async saveGridEntries(entries: any[]): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Saving grid entries...');
      }

      const response = await fetch('http://localhost:3001/api/policies/grid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Grid entries saved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Save grid entries failed:', error);
      }
      throw error;
    }
  }

  // Create policy from backend
  async createPolicy(policyData: any): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Creating policy...');
      }

      const response = await fetch('http://localhost:3001/api/policies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Policy created successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Create policy failed:', error);
      }
      throw error;
    }
  }

  // Login from backend
  async login(credentials: { email: string; password: string }): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Logging in...');
      }

      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Login successful');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Login failed:', error);
      }
      throw error;
    }
  }

  // Get environment info
  getEnvironmentInfo(): BackendApiResult {
    return {
      success: true,
      data: {
        backendAvailable: this.isAvailable(),
        healthUrl: 'http://localhost:3001/health',
        checkInterval: 30000,
        enableDebug: ENABLE_DEBUG,
        enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
      },
      source: 'BACKEND_API'
    };
  }
}

export default BackendApiService;
