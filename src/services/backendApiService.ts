// Backend API Service - Connects frontend to backend APIs
// This replaces the direct S3/Database access with proper backend API calls

// import { authAPI, policiesAPI } from './api';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL!;
const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL!;
const ENABLE_DEBUG: boolean = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';


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
      console.log('BackendApiService initialized');
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

      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
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

  // Telecallers from backend
  async getTelecallers(): Promise<BackendApiResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/telecallers`, {
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
        console.log('✅ BackendApiService: Telecallers retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get telecallers failed:', error);
      }
      throw error;
    }
  }

  // Add new telecaller
  async addTelecaller(telecallerData: any): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Adding new telecaller...');
        console.log('🔍 Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
        console.log('🔍 Telecaller data:', telecallerData);
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/telecallers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telecallerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Telecaller added successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Add telecaller failed:', error);
      }
      throw error;
    }
  }

  // Update telecaller status
  async updateTelecallerStatus(id: number, name: string, isActive: boolean): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Updating telecaller status...', { id, name, isActive });
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/telecallers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name,
          is_active: isActive 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Telecaller status updated successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Update telecaller status failed:', error);
      }
      throw error;
    }
  }

  // Sales Reps from backend
  async getSalesReps(month?: string, fromDate?: string, toDate?: string): Promise<BackendApiResult> {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      const queryString = params.toString();
      const url = queryString 
        ? `${API_BASE_URL}/dashboard/sales-reps?${queryString}`
        : `${API_BASE_URL}/dashboard/sales-reps`;

      const response = await fetch(url, {
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
      

      // Transform backend data to match frontend expectations
      const transformedData = (result.data || []).map((rep: any) => ({
        name: rep.name,                // Map name → name (no transformation needed)
        leads_assigned: rep.policies,  // Map policies → leads_assigned  
        converted: rep.policies,       // Map policies → converted
        gwp: rep.gwp,
        brokerage: rep.brokerage,
        cashback: rep.cashback,
        net_revenue: rep.net_revenue,
        total_od: rep.total_od,        // Map total_od → total_od
        cac: Math.round(1800 / rep.policies), // Calculate CAC
        // Preserve rollover/renewal breakdown data
        rollover_policies: rep.rollover_policies || 0,
        renewal_policies: rep.renewal_policies || 0,
        rollover_total_od: rep.rollover_total_od || 0,
        renewal_total_od: rep.renewal_total_od || 0
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
  async getSalesExplorer(filters: any = {}): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: getSalesExplorer called with filters:', filters);
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.make && filters.make !== 'All') queryParams.append('make', filters.make);
      if (filters.model && filters.model !== 'All') queryParams.append('model', filters.model);
      if (filters.insurer && filters.insurer !== 'All') queryParams.append('insurer', filters.insurer);
      if (filters.cashbackMax) queryParams.append('cashbackMax', filters.cashbackMax.toString());
      if (filters.branch && filters.branch !== 'All') queryParams.append('branch', filters.branch);
      if (filters.rollover && filters.rollover !== 'All') queryParams.append('rollover', filters.rollover);
      if (filters.rep && filters.rep !== 'All') queryParams.append('rep', filters.rep);
      if (filters.vehiclePrefix && filters.vehiclePrefix !== 'All') queryParams.append('vehiclePrefix', filters.vehiclePrefix);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.expiryFromDate) queryParams.append('expiryFromDate', filters.expiryFromDate);
      if (filters.expiryToDate) queryParams.append('expiryToDate', filters.expiryToDate);

      const url = `${API_BASE_URL}/dashboard/explorer${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: Calling URL:', url);
      }

      const response = await fetch(url, {
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
      


      return {
        success: true,
        data: result.data, // Return raw data, let DualStorageService handle transformation
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

      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`, {
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

      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
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
      

      // Transform sourceMetrics to match frontend expectations
      const sourceMetrics = result.data?.sourceMetrics || [];
      
      const transformedData = sourceMetrics.map((source: any) => ({
        name: source.source || 'Unknown',
        policies: parseInt(source.count) || 0,
        gwp: parseFloat(source.gwp) || 0
      }));


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

  // Get policy numbers only (fast query for validation, no S3 enrichment)
  async getPolicyNumbers(): Promise<BackendApiResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/policy-numbers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get policy numbers failed:', error);
      }
      throw error;
    }
  }

  // Get search fields only (fast query for search dropdown, no S3 enrichment)
  async getPolicySearchFields(): Promise<BackendApiResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/search-fields`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get policy search fields failed:', error);
      }
      throw error;
    }
  }

  // Get health insurance search fields only (fast query for search dropdown, no S3 enrichment)
  async getHealthInsuranceSearchFields(): Promise<BackendApiResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-insurance/search-fields`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get health insurance search fields failed:', error);
      }
      throw error;
    }
  }

  // Get policies by source (fast query for grid entry, no S3 enrichment)
  async getPoliciesBySource(source: string): Promise<BackendApiResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/by-source?source=${encodeURIComponent(source)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get policies by source failed:', error);
      }
      throw error;
    }
  }

  // All Policies from backend
  async getAllPolicies(): Promise<BackendApiResult> {
    try {

const response = await fetch(`${API_BASE_URL}/policies`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
});

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      

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

  // Executive Payments from backend
  async getExecutivePayments(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting executive payments...');
      }

      const response = await fetch(`${BACKEND_URL}/api/dashboard/payments/executive`, {
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
        console.log('✅ BackendApiService: Executive payments response received');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Executive payments failed:', error);
      }
      throw error;
    }
  }

  // Mark payment as received
  async markPaymentAsReceived(policyNumber: string, receivedBy: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Marking payment as received...', policyNumber);
      }

      const response = await fetch(`${BACKEND_URL}/api/dashboard/payments/received/${policyNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          received_by: receivedBy
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Payment marked as received successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Mark payment as received failed:', error);
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

      const response = await fetch(`${API_BASE_URL}/settings`, {
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

      const response = await fetch(`${API_BASE_URL}/settings`, {
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

      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
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
            formData.append(`manual_${key}`, String(value));
          }
        });
      }

      const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend upload failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
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

  // Upload individual document from backend
  async uploadDocument(formData: FormData): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Uploading document...');
      }

      const response = await fetch('http://localhost:3001/api/upload/document', {
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
        console.log('✅ BackendApiService: Document uploaded successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Document upload failed:', error);
      }
      throw error;
    }
  }

  // Get documents by policy number from backend
  async getPolicyDocuments(policyNumber: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting policy documents...');
      }

      const response = await fetch(`http://localhost:3001/api/upload/documents/${policyNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Policy documents retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Failed to get policy documents:', error);
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

      const response = await fetch(`${API_BASE_URL}/upload?${params}`, {
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

      const response = await fetch(`${API_BASE_URL}/upload/${uploadId}`, {
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

      const response = await fetch(`${API_BASE_URL}/upload/${uploadId}/review`, {
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

      const response = await fetch(`${API_BASE_URL}/upload/${uploadId}/confirm`, {
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

      const response = await fetch(`${API_BASE_URL}/policies/manual`, {
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

  // Save health insurance from backend
  async saveHealthInsurance(healthData: any): Promise<BackendApiResult> {
    try {

      const response = await fetch('http://localhost:3001/api/health-insurance/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      throw error;
    }
  }

  // Save grid entries from backend
  async saveGridEntries(entries: any[]): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Saving grid entries...');
      }

      const response = await fetch(`${API_BASE_URL}/policies/grid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      });

      const result = await response.json();
      
      if (ENABLE_DEBUG) {
        console.log('✅ BackendApiService: Grid entries response received');
      }

      // Return the result regardless of HTTP status - let the frontend handle partial success
      return {
        success: result.success,
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

      const response = await fetch(`${API_BASE_URL}/policies`, {
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

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        healthUrl: `${BACKEND_URL}/api/health`,
        checkInterval: 30000,
        enableDebug: ENABLE_DEBUG,
        enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
      },
      source: 'BACKEND_API'
    };
  }

  // Get Total OD daily breakdown
  async getTotalODDaily(period: string = '30d'): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: getTotalODDaily called with period:', period);
      }

      const url = `${API_BASE_URL}/dashboard/total-od/daily?period=${period}`;
      
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: Calling URL:', url);
      }

      const response = await fetch(url, {
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
        console.log('✅ BackendApiService: Total OD daily breakdown successful');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Total OD daily breakdown failed:', error);
      }
      throw error;
    }
  }

  // Get Total OD monthly breakdown
  async getTotalODMonthly(period: string = '12m'): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: getTotalODMonthly called with period:', period);
      }

      const url = `${API_BASE_URL}/dashboard/total-od/monthly?period=${period}`;
      
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: Calling URL:', url);
      }

      const response = await fetch(url, {
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
        console.log('✅ BackendApiService: Total OD monthly breakdown successful');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Total OD monthly breakdown failed:', error);
      }
      throw error;
    }
  }

  // Get Total OD financial year breakdown
  async getTotalODFinancialYear(years: number = 3): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: getTotalODFinancialYear called with years:', years);
      }

      const url = `${API_BASE_URL}/dashboard/total-od/financial-year?years=${years}`;
      
      if (ENABLE_DEBUG) {
        console.log('🔍 BackendApiService: Calling URL:', url);
      }

      const response = await fetch(url, {
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
        console.log('✅ BackendApiService: Total OD financial year breakdown successful');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Total OD financial year breakdown failed:', error);
      }
      throw error;
    }
  }

  // Health Insurance API Methods
  async getAllHealthInsurance(limit: number = 50, offset: number = 0): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting all health insurance policies...');
      }

      const response = await fetch(`${API_BASE_URL}/health-insurance?limit=${limit}&offset=${offset}`, {
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
        console.log('✅ BackendApiService: Health insurance policies retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get all health insurance failed:', error);
      }
      throw error;
    }
  }

  async getHealthInsuranceDetail(policyNumber: string): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting health insurance detail...');
      }

      const response = await fetch(`http://localhost:3001/api/health-insurance/${policyNumber}`, {
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
        console.log('✅ BackendApiService: Health insurance detail retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get health insurance detail failed:', error);
      }
      throw error;
    }
  }

  // Health Insurance Metrics from backend
  async getHealthInsuranceMetrics(): Promise<BackendApiResult> {
    try {
      if (ENABLE_DEBUG) {
        console.log('🔄 BackendApiService: Getting health insurance metrics...');
      }

      const response = await fetch('http://localhost:3001/api/dashboard/health-metrics', {
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
        console.log('✅ BackendApiService: Health insurance metrics retrieved successfully');
      }

      return {
        success: true,
        data: result.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ BackendApiService: Get health insurance metrics failed:', error);
      }
      throw error;
    }
  }
}

export default BackendApiService;
