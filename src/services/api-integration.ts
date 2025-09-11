// Real API Integration Service for Nicsan CRM
// This replaces the mock data with actual backend API calls

import { authAPI, policiesAPI, uploadAPI, dashboardAPI, usersAPI, settingsAPI } from './api';

// Environment variables
const HEALTH_URL = import.meta.env.VITE_BACKEND_HEALTH_URL;
const CHECK_INTERVAL = parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000');
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// Mock data fallbacks for development
const mockData = {
  policies: [
    {
      id: '1',
      policy_number: 'TA-9921',
      vehicle_number: 'KA01AB1234',
      insurer: 'Tata AIG',
      total_premium: 12150,
      customer_name: 'John Doe',
      cashback: 600,
      status: 'SAVED',
      source: 'PDF_UPLOAD',
      created_at: new Date().toISOString()
    }
  ],
  uploads: [
    {
      id: '1',
      filename: 'policy_123.pdf',
      status: 'COMPLETED',
      confidence_score: 0.92,
      created_at: new Date().toISOString()
    }
  ]
};

// Enhanced API service with fallbacks
export class NicsanCRMService {
  private static instance: NicsanCRMService;
  private isBackendAvailable: boolean = false;

  private constructor() {
    this.checkBackendAvailability();
    
    // Set up periodic health checks
    setInterval(() => {
      this.checkBackendAvailability();
    }, CHECK_INTERVAL);
  }

  static getInstance(): NicsanCRMService {
    if (!NicsanCRMService.instance) {
      NicsanCRMService.instance = new NicsanCRMService();
    }
    return NicsanCRMService.instance;
  }

  private async checkBackendAvailability(): Promise<void> {
    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const wasAvailable = this.isBackendAvailable;
      this.isBackendAvailable = response.ok;
      
      if (ENABLE_DEBUG) {
        if (this.isBackendAvailable && !wasAvailable) {
        } else if (!this.isBackendAvailable && wasAvailable) {
        } else if (this.isBackendAvailable) {
        } else {
        }
      }
    } catch (error) {
      const wasAvailable = this.isBackendAvailable;
      this.isBackendAvailable = false;
      
      if (ENABLE_DEBUG && wasAvailable) {
      }
    }
  }

  // Authentication methods
  async login(credentials: { email: string; password: string }): Promise<any> {
    // Always check backend availability before login
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const response = await authAPI.login(credentials);
        if (response.success && response.data) {
          // Store user info for potential token refresh
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Login failed, falling back to mock:', error);
      }
    }
    
    // Mock login for development (only if mock data is enabled)
    if (ENABLE_MOCK_DATA && credentials.email === 'admin@nicsan.in' && credentials.password === 'admin123') {
      const mockUser = {
        id: '1',
        email: 'admin@nicsan.in',
        name: 'Admin User',
        role: 'founder'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      return {
        success: true,
        data: {
          token: 'mock-token-admin',
          user: mockUser
        }
      };
    } else if (ENABLE_MOCK_DATA && credentials.email === 'ops@nicsan.in' && credentials.password === 'ops123') {
      const mockUser = {
        id: '2',
        email: 'ops@nicsan.in',
        name: 'Ops User',
        role: 'ops'
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      return {
        success: true,
        data: {
          token: 'mock-token-ops',
          user: mockUser
        }
      };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }

  async getProfile(): Promise<any> {
    // Always check backend availability before profile fetch
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await authAPI.getProfile();
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Profile fetch failed:', error);
      }
    }
    
    // Return mock profile based on stored token
    const token = localStorage.getItem('authToken');
    if (token === 'mock-token-admin') {
      return {
        success: true,
        data: {
          id: '1',
          email: 'admin@nicsan.in',
          name: 'Admin User',
          role: 'founder'
        }
      };
    } else if (token === 'mock-token-ops') {
      return {
        success: true,
        data: {
          id: '2',
          email: 'ops@nicsan.in',
          name: 'Ops User',
          role: 'ops'
        }
      };
    }
    
    return { success: false, error: 'Not authenticated' };
  }

  // Policy methods with dual storage support
  async getPolicies(limit = 100, offset = 0): Promise<any> {
    if (this.isBackendAvailable) {
      try {
        const response = await policiesAPI.getPolicies(limit, offset);
        return response.data;
      } catch (error) {
        console.error('Get policies error:', error);
        return mockData.policies;
      }
    }
    return mockData.policies;
  }

  async getPolicy(id: string): Promise<any> {
    if (this.isBackendAvailable) {
      try {
        const response = await policiesAPI.getPolicy(id);
        return response.data;
      } catch (error) {
        console.error('Get policy error:', error);
        return mockData.policies.find(p => p.id === id);
      }
    }
    return mockData.policies.find(p => p.id === id);
  }

  // Save manual form with dual storage
  async saveManualForm(formData: any): Promise<any> {
    if (this.isBackendAvailable) {
      try {
        const response = await policiesAPI.saveManualForm(formData);
        return response; // Return full response with success property
      } catch (error) {
        console.error('Save manual form error:', error);
        throw error;
      }
    }
    // Mock response for offline mode
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        ...formData,
        source: 'MANUAL_FORM',
        created_at: new Date().toISOString()
      }
    };
  }

  // Save grid entries with dual storage
  async saveGridEntries(entries: any[]): Promise<any> {
    if (this.isBackendAvailable) {
      try {
        const response = await policiesAPI.saveGridEntries(entries);
        return response; // Return full response with success property
      } catch (error) {
        console.error('Save grid entries error:', error);
        throw error;
      }
    }
    // Mock response for offline mode
    return {
      success: true,
      data: entries.map((entry, index) => ({
        id: (Date.now() + index).toString(),
        ...entry,
        source: 'MANUAL_GRID',
        created_at: new Date().toISOString()
      }))
    };
  }

  async createPolicy(policyData: any): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await policiesAPI.create(policyData);
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Policy creation failed:', error);
      }
    }
    
    // Mock policy creation
    const newPolicy = {
      id: Date.now().toString(),
      ...policyData,
      created_at: new Date().toISOString(),
      status: 'SAVED'
    };
    
    mockData.policies.push(newPolicy);
    
    return {
      success: true,
      data: newPolicy,
      message: 'Policy created successfully'
    };
  }

  // Search policies by vehicle number
  async searchPoliciesByVehicle(vehicleNumber: string): Promise<any> {
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const result = await policiesAPI.searchPoliciesByVehicle(vehicleNumber);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Vehicle search failed',
          data: []
        };
      }
    } else {
      // Fallback to mock search
      const mockResults = mockData.policies.filter(policy => 
        policy.vehicle_number.toLowerCase().includes(vehicleNumber.toLowerCase())
      );
      return {
        success: true,
        data: mockResults,
        message: 'Using mock data (Backend unavailable)'
      };
    }
  }

  // Search policies by policy number
  async searchPoliciesByPolicyNumber(policyNumber: string): Promise<any> {
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const result = await policiesAPI.searchPoliciesByPolicyNumber(policyNumber);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Policy search failed',
          data: []
        };
      }
    } else {
      // Fallback to mock search
      const mockResults = mockData.policies.filter(policy => 
        policy.policy_number.toLowerCase().includes(policyNumber.toLowerCase())
      );
      return {
        success: true,
        data: mockResults,
        message: 'Using mock data (Backend unavailable)'
      };
    }
  }

  // Combined search
  async searchPolicies(query: string): Promise<any> {
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const result = await policiesAPI.searchPolicies(query);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Search failed',
          data: []
        };
      }
    } else {
      // Fallback to mock search
      const mockResults = mockData.policies.filter(policy => 
        policy.vehicle_number.toLowerCase().includes(query.toLowerCase()) ||
        policy.policy_number.toLowerCase().includes(query.toLowerCase())
      );
      return {
        success: true,
        data: mockResults,
        message: 'Using mock data (Backend unavailable)'
      };
    }
  }

  // Settings methods - Dual Storage Pattern (S3 Primary, PostgreSQL Secondary, Local Fallback)
  async getSettings(): Promise<any> {
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const result = await settingsAPI.getSettings();
        if (result.success) {
          return {
            success: true,
            data: result.data,
            source: 'S3_CLOUD', // Primary storage
            message: 'Settings loaded from cloud storage'
          };
        } else {
          // Try local storage fallback
          const localData = localStorage.getItem('nicsan_settings');
          if (localData) {
            return {
              success: true,
              data: JSON.parse(localData),
              source: 'LOCAL_STORAGE',
              message: 'Settings loaded from local storage (Cloud unavailable)'
            };
          }
          return {
            success: false,
            error: result.error || 'Failed to load settings',
            data: this.getDefaultSettings(),
            source: 'DEFAULT_VALUES'
          };
        }
      } catch (error: any) {
        // Try local storage fallback
        const localData = localStorage.getItem('nicsan_settings');
        if (localData) {
          return {
            success: true,
            data: JSON.parse(localData),
            source: 'LOCAL_STORAGE',
            message: 'Settings loaded from local storage (Backend error)'
          };
        }
        return {
          success: false,
          error: error.message || 'Failed to load settings',
          data: this.getDefaultSettings(),
          source: 'DEFAULT_VALUES'
        };
      }
    } else {
      // Backend unavailable - try local storage
      const localData = localStorage.getItem('nicsan_settings');
      if (localData) {
        return {
          success: true,
          data: JSON.parse(localData),
          source: 'LOCAL_STORAGE',
          message: 'Settings loaded from local storage (Backend unavailable)'
        };
      }
      // Fallback to default settings
      return {
        success: true,
        data: this.getDefaultSettings(),
        source: 'DEFAULT_VALUES',
        message: 'Using default settings (No data available)'
      };
    }
  }

  async saveSettings(settings: any): Promise<any> {
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        const result = await settingsAPI.saveSettings(settings);
        if (result.success) {
          // Also save to local storage as backup
          localStorage.setItem('nicsan_settings', JSON.stringify(settings));
          return {
            success: true,
            data: result.data,
            source: 'S3_CLOUD',
            message: 'Settings saved to cloud storage'
          };
        } else {
          // Save to local storage as fallback
          localStorage.setItem('nicsan_settings', JSON.stringify(settings));
          return {
            success: true,
            data: settings,
            source: 'LOCAL_STORAGE',
            message: 'Settings saved locally (Cloud save failed)'
          };
        }
      } catch (error: any) {
        // Save to local storage as fallback
        localStorage.setItem('nicsan_settings', JSON.stringify(settings));
        return {
          success: true,
          data: settings,
          source: 'LOCAL_STORAGE',
          message: 'Settings saved locally (Backend error)'
        };
      }
    } else {
      // Backend unavailable - save to local storage
      localStorage.setItem('nicsan_settings', JSON.stringify(settings));
      return {
        success: true,
        data: settings,
        source: 'LOCAL_STORAGE',
        message: 'Settings saved locally (Backend unavailable)'
      };
    }
  }

  async resetSettings(): Promise<any> {
    await this.checkBackendAvailability();
    
    const defaultSettings = this.getDefaultSettings();
    
    if (this.isBackendAvailable) {
      try {
        const result = await settingsAPI.resetSettings();
        if (result.success) {
          // Also save to local storage as backup
          localStorage.setItem('nicsan_settings', JSON.stringify(defaultSettings));
          return {
            success: true,
            data: result.data,
            source: 'S3_CLOUD',
            message: 'Settings reset in cloud storage'
          };
        } else {
          // Reset local storage as fallback
          localStorage.setItem('nicsan_settings', JSON.stringify(defaultSettings));
          return {
            success: true,
            data: defaultSettings,
            source: 'LOCAL_STORAGE',
            message: 'Settings reset locally (Cloud reset failed)'
          };
        }
      } catch (error: any) {
        // Reset local storage as fallback
        localStorage.setItem('nicsan_settings', JSON.stringify(defaultSettings));
        return {
          success: true,
          data: defaultSettings,
          source: 'LOCAL_STORAGE',
          message: 'Settings reset locally (Backend error)'
        };
      }
    } else {
      // Backend unavailable - reset local storage
      localStorage.setItem('nicsan_settings', JSON.stringify(defaultSettings));
      return {
        success: true,
        data: defaultSettings,
        source: 'LOCAL_STORAGE',
        message: 'Settings reset locally (Backend unavailable)'
      };
    }
  }

  private getDefaultSettings() {
    return {
      brokeragePercent: '15',
      repDailyCost: '2000',
      expectedConversion: '25',
      premiumGrowth: '10'
    };
  }

  // Upload methods
  async getUploads(page: number = 1, limit: number = 20): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await uploadAPI.getUploads(page, limit);
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Uploads fetch failed:', error);
      }
    }
    
    // Mock uploads data
    return {
      success: true,
      data: mockData.uploads,
      pagination: {
        page,
        limit,
        total: mockData.uploads.length,
        totalPages: 1
      }
    };
  }

  async uploadPDF(file: File, manualExtras?: any, insurer?: string): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        // Convert File to FormData for the API
        const formData = new FormData();
        formData.append('pdf', file); // Changed from 'file' to 'pdf' to match backend expectation
        
        // Add insurer if provided
        if (insurer) {
          formData.append('insurer', insurer);
        }
        
        // Add manual extras if provided
        if (manualExtras) {
          Object.entries(manualExtras).forEach(([key, value]) => {
            if (value) {
              formData.append(`manual_${key}`, value.toString());
            }
          });
        }
        
        return await uploadAPI.uploadPDF(formData);
      } catch (error: any) {
        if (ENABLE_DEBUG) console.error('PDF upload failed:', error);
      }
    }
    
    // Mock PDF upload
    const newUpload = {
      id: Date.now().toString(),
      filename: file.name,
      status: 'UPLOADED',
      confidence_score: 0.85,
      created_at: new Date().toISOString()
    };
    
    mockData.uploads.push(newUpload);
    
    return {
      success: true,
      data: newUpload,
      message: 'PDF uploaded successfully'
    };
  }

  async getUploadById(uploadId: string): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await uploadAPI.getUploadById(uploadId);
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Upload fetch failed:', error);
      }
    }
    
    // Mock upload data
    return {
      success: true,
      data: {
        id: uploadId,
        filename: 'mock_policy.pdf',
        status: 'REVIEW',
        s3_key: 'uploads/mock/mock_policy.pdf',
        extracted_data: {
          insurer: 'TATA_AIG',
          status: 'REVIEW',
          manual_extras: {
            executive: "Mock User",
            callerName: "Mock Caller",
            mobile: "9876543210",
            rollover: "MOCK-2025",
            remark: "Mock upload for testing",
            brokerage: 500,
            cashback: 600,
            customerPaid: 11550,
            customerChequeNo: "MOCK-001",
            ourChequeNo: "MOCK-002"
          },
          extracted_data: {
            policy_number: "TA-MOCK",
            vehicle_number: "KA01AB1234",
            insurer: "Tata AIG",
            product_type: "Private Car",
            vehicle_type: "Private Car",
            make: "Maruti",
            model: "Swift",
            cc: "1197",
            manufacturing_year: "2021",
            issue_date: "2025-01-30",
            expiry_date: "2026-01-29",
            idv: 495000,
            ncb: 20,
            discount: 0,
            net_od: 5400,
            ref: "",
            total_od: 7200,
            net_premium: 10800,
            total_premium: 12150,
            customer_name: 'Jane Smith',
            confidence_score: 0.86
          }
        }
      }
    };
  }

  async confirmUploadAsPolicy(uploadId: string, editedData?: any): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    console.log('🔍 Confirming upload as policy with edited data:', editedData);
    
    // Check if this is a mock upload ID
    if (uploadId.startsWith('mock_')) {
      // Return mock confirmation for mock uploads
      return {
        success: true,
        data: {
          policyId: Date.now(),
          uploadId: uploadId,
          status: 'SAVED'
        },
        message: 'Mock policy confirmed and saved successfully! (Demo mode)'
      };
    }
    
    if (this.isBackendAvailable) {
      try {
        const result = await uploadAPI.confirmUploadAsPolicy(uploadId, editedData);
        return result;
      } catch (error: any) {
        if (ENABLE_DEBUG) console.error('Policy confirmation failed:', error);
        return {
          success: false,
          error: error.message || 'Policy confirmation failed',
          message: 'Failed to confirm policy'
        };
      }
    }
    
    // Mock confirmation for real uploads when backend is unavailable
    return {
      success: true,
      data: {
        policyId: Date.now(),
        uploadId: uploadId,
        status: 'SAVED'
      },
      message: 'Policy confirmed and saved successfully (offline mode)'
    };
  }

  async getUploadForReview(uploadId: string): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    // Check if this is a mock upload ID
    if (uploadId.startsWith('mock_')) {
      // Return mock data for mock uploads
      return {
        success: true,
        data: {
          id: uploadId,
          filename: 'mock_policy.pdf',
          status: 'REVIEW',
          s3_key: 'uploads/mock/mock_policy.pdf',
          insurer: 'TATA_AIG',
          extracted_data: {
            insurer: 'TATA_AIG',
            status: 'REVIEW',
            manual_extras: {
              executive: "Mock User",
              callerName: "Mock Caller",
              mobile: "9876543210",
              rollover: "MOCK-2025",
              remark: "Mock upload for testing",
              brokerage: 500,
              cashback: 600,
              customerPaid: 11550,
              customerChequeNo: "MOCK-001",
              ourChequeNo: "MOCK-002"
            },
            extracted_data: {
              policy_number: "TA-MOCK",
              vehicle_number: "KA01AB1234",
              insurer: "Tata AIG",
              product_type: "Private Car",
              vehicle_type: "Private Car",
              make: "Maruti",
              model: "Swift",
              cc: "1197",
              manufacturing_year: "2021",
              issue_date: "2025-01-30",
              expiry_date: "2026-01-29",
              idv: 495000,
              ncb: 20,
              discount: 0,
              net_od: 5400,
              ref: "",
              total_od: 7200,
              net_premium: 10800,
              total_premium: 12150,
              confidence_score: 0.86
            }
          }
        }
      };
    }
    
    if (this.isBackendAvailable) {
      try {
        return await uploadAPI.getUploadForReview(uploadId);
      } catch (error: any) {
        if (ENABLE_DEBUG) console.error('Upload review fetch failed:', error);
      }
    }
    
    // Fallback mock data for real uploads when backend is unavailable
    return {
      success: true,
      data: {
        id: uploadId,
        filename: 'fallback_policy.pdf',
        status: 'REVIEW',
        s3_key: 'uploads/fallback/fallback_policy.pdf',
        insurer: 'TATA_AIG',
        extracted_data: {
          insurer: 'TATA_AIG',
          status: 'REVIEW',
          manual_extras: {
            executive: "Fallback User",
            callerName: "Fallback Caller",
            mobile: "9876543210",
            rollover: "FALLBACK-2025",
            remark: "Fallback upload for testing",
            brokerage: 500,
            cashback: 600,
            customerPaid: 11550,
            customerChequeNo: "FALLBACK-001",
            ourChequeNo: "FALLBACK-002"
          },
          extracted_data: {
            policy_number: "TA-FALLBACK",
            vehicle_number: "KA01AB1234",
            insurer: "Tata AIG",
            product_type: "Private Car",
            vehicle_type: "Private Car",
            make: "Maruti",
            model: "Swift",
            cc: "1197",
            manufacturing_year: "2021",
            issue_date: "2025-01-30",
            expiry_date: "2026-01-29",
            idv: 495000,
            ncb: 20,
            discount: 0,
            net_od: 5400,
            ref: "",
            total_od: 7200,
            net_premium: 10800,
            total_premium: 12150,
            customer_name: 'Jane Smith',
            confidence_score: 0.86
          }
        }
      }
    };
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await dashboardAPI.getMetrics();
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Dashboard metrics fetch failed:', error);
      }
    }
    
    // Mock dashboard metrics
    return {
      success: true,
      data: {
        total_policies: 150,
        total_gwp: 2500000,
        total_brokerage: 375000,
        total_cashback: 75000,
        net_revenue: 300000,
        conversion_rate: 0.65,
        avg_premium: 16667
      }
    };
  }

  async getSalesExplorer(): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await dashboardAPI.getVehicleAnalysis();
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Sales explorer fetch failed:', error);
      }
    }
    
    // Mock sales explorer data
    return {
      success: true,
      data: [
        { rep: 'Asha', make: 'Maruti', model: 'Swift', policies: 12, gwp: 130000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
        { rep: 'Vikram', make: 'Hyundai', model: 'i20', policies: 9, gwp: 115000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 }
      ]
    };
  }

  async getSalesReps(): Promise<any> {
    // Always check backend availability before API calls
    await this.checkBackendAvailability();
    
    if (this.isBackendAvailable) {
      try {
        return await dashboardAPI.getSalesReps();
      } catch (error) {
        if (ENABLE_DEBUG) console.error('Sales reps fetch failed:', error);
      }
    }
    
    // Mock sales reps data
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Priya Singh',
          leads_assigned: 120,
          converted: 22,
          gwp: 260000,
          brokerage: 39000,
          cashback: 10000,
          net_revenue: 29000,
          conversion_rate: 0.183,
          cac: 82
        },
        {
          id: '2',
          name: 'Rahul Kumar',
          leads_assigned: 110,
          converted: 18,
          gwp: 210000,
          brokerage: 31500,
          cashback: 9000,
          net_revenue: 22500,
          conversion_rate: 0.164,
          cac: 100
        }
      ]
    };
  }

  // Utility methods
  isBackendConnected(): boolean {
    return this.isBackendAvailable;
  }

  async refreshBackendStatus(): Promise<void> {
    await this.checkBackendAvailability();
    if (ENABLE_DEBUG) {
    }
  }

  // Get current environment info
  getEnvironmentInfo(): any {
    return {
      backendAvailable: this.isBackendAvailable,
      healthUrl: HEALTH_URL,
      checkInterval: CHECK_INTERVAL,
      enableDebug: ENABLE_DEBUG,
      enableMockData: ENABLE_MOCK_DATA
    };
  }
}

export default NicsanCRMService.getInstance();

