// Dual Storage Service - Implements Backend API → Mock Data fallback pattern
// This is the core service that all pages will use for identical data flow

import BackendApiService from './backendApiService';

interface BackendApiResult {
  success: boolean;
  data: any;
  source: 'BACKEND_API';
  error?: string;
}

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

interface DualStorageResult {
  success: boolean;
  data: any;
  source: 'BACKEND_API' | 'MOCK_DATA' | 'ERROR';
  error?: string;
}

class DualStorageService {
  private static instance: DualStorageService;
  private backendApiService: BackendApiService;

  private constructor() {
    this.backendApiService = BackendApiService.getInstance();
  }

  static getInstance(): DualStorageService {
    if (!DualStorageService.instance) {
      DualStorageService.instance = new DualStorageService();
    }
    return DualStorageService.instance;
  }

  // Core dual storage pattern: Backend API → Mock Data
  private async executeDualStoragePattern<T>(
    backendMethod: () => Promise<BackendApiResult>,
    mockData: T,
    _operationName: string
  ): Promise<DualStorageResult> {
    
    if (ENABLE_DEBUG) {
    }

    // Step 1: Try Backend API (Primary Storage)
    try {
      if (this.backendApiService.isAvailable()) {
        const result = await backendMethod();
        
        if (ENABLE_DEBUG) {
        }
        
        return {
          success: result.success,
          data: result.data,
          source: 'BACKEND_API'
        };
      } else {
        throw new Error('Backend API service not available');
      }
    } catch (backendError) {
      if (ENABLE_DEBUG) {
        console.error('Backend API Error:', backendError);
      }
    }

    // Step 2: Fallback to Mock Data
    if (ENABLE_DEBUG) {
    }
    
    return {
      success: true,
      data: mockData,
      source: 'MOCK_DATA'
    };
  }

  // Dashboard Metrics with dual storage
  async getDashboardMetrics(): Promise<DualStorageResult> {
    const mockData = {
      total_policies: 150,
      total_gwp: 2500000,
      total_brokerage: 375000,
      total_cashback: 75000,
      net_revenue: 300000,
      conversion_rate: 0.65,
      avg_premium: 16667
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getDashboardMetrics(),
      mockData,
      'Dashboard Metrics'
    );
  }

  // Sales Reps with dual storage
  async getSalesReps(): Promise<DualStorageResult> {
    const mockData = [
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
      },
      {
        id: '3',
        name: 'Anjali Sharma',
        leads_assigned: 90,
        converted: 20,
        gwp: 240000,
        brokerage: 36000,
        cashback: 8000,
        net_revenue: 28000,
        conversion_rate: 0.222,
        cac: 90
      }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getSalesReps(),
      mockData,
      'Sales Reps'
    );
  }

  // Sales Explorer with dual storage
  async getSalesExplorer(filters: any = {}): Promise<DualStorageResult> {
    const mockData = [
      { rep: 'Asha', make: 'Maruti', model: 'Swift', policies: 12, gwp: 130000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
      { rep: 'Asha', make: 'Hyundai', model: 'i20', policies: 10, gwp: 130000, cashbackPctAvg: 1.9, cashback: 2500, net: 17500 },
      { rep: 'Vikram', make: 'Hyundai', model: 'i20', policies: 9, gwp: 115000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 },
      { rep: 'Meera', make: 'Maruti', model: 'Baleno', policies: 11, gwp: 125000, cashbackPctAvg: 0.9, cashback: 1100, net: 17800 }
    ];

    const result = await this.executeDualStoragePattern(
      () => this.backendApiService.getSalesExplorer(filters),
      mockData,
      'Sales Explorer'
    );

    // Fix field name mapping for backend data
    if (result.success && result.source === 'BACKEND_API' && Array.isArray(result.data)) {
      const mappedData = result.data.map((item: any) => ({
        rep: item.executive || item.rep,
        make: item.make,
        model: item.model,
        insurer: item.insurer,
        policies: item.policies,
        gwp: item.gwp,
        cashbackPctAvg: item.avg_cashback_pct || item.cashbackPctAvg || 0,
        cashback: item.total_cashback || item.cashback || 0,
        net: item.net
      }));

      if (ENABLE_DEBUG) {
        console.log('🔧 Sales Explorer: Fixed field name mapping', {
          original: result.data,
          mapped: mappedData
        });
      }

      return {
        success: true,
        data: mappedData,
        source: result.source
      };
    }

    return result;
  }

  // Data Sources with dual storage
  async getDataSources(): Promise<DualStorageResult> {
    const mockData = [
      { name: "PDF_TATA", policies: 62, gwp: 725000 },
      { name: "PDF_DIGIT", policies: 58, gwp: 690000 },
      { name: "MANUAL_FORM", policies: 40, gwp: 410000 },
      { name: "MANUAL_GRID", policies: 60, gwp: 620000 },
      { name: "CSV_IMPORT", policies: 200, gwp: 2050000 }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getDataSources(),
      mockData,
      'Data Sources'
    );
  }

  // Policy Detail with dual storage
  async getPolicyDetail(policyId: string): Promise<DualStorageResult> {
    const mockData = {
      id: policyId,
      policy_number: 'TA-9921',
      vehicle_number: 'KA01AB1234',
      insurer: 'Tata AIG',
      product_type: 'Private Car',
      vehicle_type: 'Private Car',
      make: 'Maruti',
      model: 'Swift',
      cc: '1197',
      manufacturing_year: '2021',
      issue_date: '2025-08-10',
      expiry_date: '2026-08-09',
      idv: 495000,
      ncb: 20,
      discount: 0,
      net_od: 5400,
      ref: '',
      total_od: 7200,
      net_premium: 10800,
      total_premium: 12150,
      customer_name: 'John Doe',
      brokerage: 1822,
      cashback: 600,
      net_revenue: 1222,
      source: 'PDF_UPLOAD',
      created_at: '2025-08-12T15:54:00Z',
      updated_at: '2025-08-12T15:57:00Z',
      audit_trail: [
        { timestamp: '2025-08-12T15:54:00Z', action: 'PDF_PARSED', user: 'System', details: 'Parsed PDF (98% confidence)' },
        { timestamp: '2025-08-12T15:56:00Z', action: 'CONFIRMED', user: 'Priya Singh', details: 'Confirmed by Ops team' },
        { timestamp: '2025-08-12T15:57:00Z', action: 'AUDIT_SAVED', user: 'System', details: 'Audit log saved' }
      ]
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getPolicyDetail(policyId),
      mockData,
      'Policy Detail'
    );
  }

  // All Policies with dual storage
  async getAllPolicies(): Promise<DualStorageResult> {
    const mockData = [
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
      },
      {
        id: '2',
        policy_number: 'DG-4410',
        vehicle_number: 'KA05CJ7777',
        insurer: 'Digit',
        total_premium: 11500,
        cashback: 500,
        status: 'SAVED',
        source: 'MANUAL_FORM',
        created_at: new Date().toISOString()
      }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getAllPolicies(),
      mockData,
      'All Policies'
    );
  }

  // Settings with dual storage
  async getSettings(): Promise<DualStorageResult> {
    const mockData = {
      brokeragePercent: '15',
      repDailyCost: '2000',
      expectedConversion: '25',
      premiumGrowth: '10'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getSettings(),
      mockData,
      'Settings'
    );
  }

  async saveSettings(settings: any): Promise<DualStorageResult> {
    return this.executeDualStoragePattern(
      () => this.backendApiService.saveSettings(settings),
      settings,
      'Save Settings'
    );
  }

  async resetSettings(): Promise<DualStorageResult> {
    const defaultSettings = {
      brokeragePercent: '15',
      repDailyCost: '2000',
      expectedConversion: '25',
      premiumGrowth: '10'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.resetSettings(),
      defaultSettings,
      'Reset Settings'
    );
  }

  // Get storage status
  getStorageStatus(): { backend: boolean } {
    return {
      backend: this.backendApiService.isAvailable()
    };
  }

  // Refresh storage availability
  async refreshStorageStatus(): Promise<void> {
    // Backend availability is checked on each request
    // No need for separate refresh method
  }

  // Upload PDF with dual storage
  async uploadPDF(file: File, manualExtras?: any, insurer?: string): Promise<DualStorageResult> {
    const mockData = {
      uploadId: `mock_${Date.now()}`,
      s3Key: `uploads/${insurer}/${Date.now()}_${file.name}`,
      status: 'UPLOADED',
      message: 'PDF uploaded successfully (mock)'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.uploadPDF(file, manualExtras, insurer),
      mockData,
      'Upload PDF'
    );
  }

  // Get uploads with dual storage
  async getUploads(page: number = 1, limit: number = 20): Promise<DualStorageResult> {
    const mockData = [
      {
        id: 'mock_1',
        filename: 'policy_TA_9921.pdf',
        status: 'UPLOADED',
        insurer: 'TATA_AIG',
        s3_key: 'uploads/TATA_AIG/1234567890_policy_TA_9921.pdf',
        time: '10:30 AM',
        size: '2.5 MB',
        extracted_data: {
          insurer: 'TATA_AIG',
          status: 'UPLOADED',
          manual_extras: {
            executive: 'Priya Singh',
            callerName: 'John Doe',
            mobile: '9876543210'
          },
          extracted_data: {
            policy_number: 'TA-9921',
            vehicle_number: 'KA01AB1234',
            insurer: 'Tata AIG',
            total_premium: 12150
          }
        }
      }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getUploads(page, limit),
      mockData,
      'Get Uploads'
    );
  }

  // Get upload by ID with dual storage
  async getUploadById(uploadId: string): Promise<DualStorageResult> {
    const mockData = {
      id: uploadId,
      filename: 'policy_TA_9921.pdf',
      status: 'UPLOADED',
      insurer: 'TATA_AIG',
      s3_key: 'uploads/TATA_AIG/1234567890_policy_TA_9921.pdf',
      time: '10:30 AM',
      size: '2.5 MB',
      extracted_data: {
        insurer: 'TATA_AIG',
        status: 'UPLOADED',
        manual_extras: {
          executive: 'Priya Singh',
          callerName: 'John Doe',
          mobile: '9876543210'
        },
        extracted_data: {
          policy_number: 'TA-9921',
          vehicle_number: 'KA01AB1234',
          insurer: 'Tata AIG',
          total_premium: 12150
        }
      }
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getUploadById(uploadId),
      mockData,
      'Get Upload by ID'
    );
  }

  // Get upload for review with dual storage
  async getUploadForReview(uploadId: string): Promise<DualStorageResult> {
    const mockData = {
      id: uploadId,
      filename: 'policy_TA_9921.pdf',
      status: 'UPLOADED',
      insurer: 'TATA_AIG',
      s3_key: 'uploads/TATA_AIG/1234567890_policy_TA_9921.pdf',
      time: '10:30 AM',
      size: '2.5 MB',
      extracted_data: {
        insurer: 'TATA_AIG',
        status: 'UPLOADED',
        manual_extras: {
          executive: 'Priya Singh',
          callerName: 'John Doe',
          mobile: '9876543210',
          brokerage: '0',
          cashback: '',
          customerPaid: '',
          customerChequeNo: '',
          ourChequeNo: '',
          customerName: ''
        },
        extracted_data: {
          policy_number: 'TA-9921',
          vehicle_number: 'KA01AB1234',
          insurer: 'Tata AIG',
          product_type: 'Private Car',
          vehicle_type: 'Private Car',
          make: 'Maruti',
          model: 'Swift',
          cc: '1197',
          manufacturing_year: '2021',
          issue_date: '2025-08-10',
          expiry_date: '2026-08-09',
          idv: 495000,
          ncb: 20,
          discount: 0,
          net_od: 5400,
          ref: '',
          total_od: 7200,
          net_premium: 10800,
          total_premium: 12150,
          customer_name: 'John Doe',
          confidence_score: 0.86
        }
      }
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getUploadForReview(uploadId),
      mockData,
      'Get Upload for Review'
    );
  }

  // Confirm upload as policy with dual storage
  async confirmUploadAsPolicy(uploadId: string, editedData?: any): Promise<DualStorageResult> {
    const mockData = {
      success: true,
      policyId: `POL_${Date.now()}`,
      message: 'Upload confirmed as policy successfully (mock)'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.confirmUploadAsPolicy(uploadId, editedData),
      mockData,
      'Confirm Upload as Policy'
    );
  }

  // Save manual form with dual storage
  async saveManualForm(formData: any): Promise<DualStorageResult> {
    const mockData = {
      id: Date.now().toString(),
      ...formData,
      source: 'MANUAL_FORM',
      created_at: new Date().toISOString(),
      message: 'Manual form saved successfully (mock)'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.saveManualForm(formData),
      mockData,
      'Save Manual Form'
    );
  }

  // Save grid entries with dual storage
  async saveGridEntries(entries: any[]): Promise<DualStorageResult> {
    const mockData = {
      success: true,
      savedCount: entries.length,
      message: `${entries.length} grid entries saved successfully (mock)`,
      entries: entries.map((entry, index) => ({
        id: `GRID_${Date.now()}_${index}`,
        ...entry,
        source: 'MANUAL_GRID',
        created_at: new Date().toISOString()
      }))
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.saveGridEntries(entries),
      mockData,
      'Save Grid Entries'
    );
  }

  // Create policy with dual storage
  async createPolicy(policyData: any): Promise<DualStorageResult> {
    const mockData = {
      id: Date.now().toString(),
      ...policyData,
      created_at: new Date().toISOString(),
      status: 'SAVED'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.createPolicy(policyData),
      mockData,
      'Create Policy'
    );
  }

  // Login with dual storage
  async login(credentials: { email: string; password: string }): Promise<DualStorageResult> {
    const mockData = {
      success: true,
      data: {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Mock User',
          role: 'founder'
        },
        token: 'mock-token-' + Date.now()
      }
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.login(credentials),
      mockData,
      'Login'
    );
  }

  // Get environment info
  getEnvironmentInfo(): any {
    return this.backendApiService.getEnvironmentInfo();
  }
}

export default DualStorageService.getInstance();
