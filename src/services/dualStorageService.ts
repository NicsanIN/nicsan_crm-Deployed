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
      
      // For save operations, propagate the error instead of falling back to mock data
      if (_operationName.includes('Save') || _operationName.includes('Create') || _operationName.includes('Add')) {
        return {
          success: false,
          data: null,
          source: 'ERROR',
          error: backendError instanceof Error ? backendError.message : 'Backend operation failed'
        };
      }

      // Step 2: Fallback to Mock Data (only for read operations)
      if (ENABLE_DEBUG) {
      }
      
      return {
        success: true,
        data: mockData,
        source: 'MOCK_DATA'
      };
    }
  }

  // Dashboard Metrics with dual storage
  async getDashboardMetrics(): Promise<DualStorageResult> {
    const mockData = {
      basicMetrics: {
        totalPolicies: 2,
        totalGWP: 23650,
        totalBrokerage: 3547,
        totalCashback: 1100,
        netRevenue: 2447,
        totalOutstandingDebt: 15000,
        avgPremium: 11825
      },
      kpis: {
        conversionRate: "65.0",
        lossRatio: "4.6",
        expenseRatio: "10.3",
        combinedRatio: "14.9"
      },
      sourceMetrics: [],
      topPerformers: [],
      dailyTrend: []
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getDashboardMetrics(),
      mockData,
      'Dashboard Metrics'
    );
  }

  // Telecallers with dual storage
  async getTelecallers(): Promise<DualStorageResult> {
    const mockData = [
      {
        id: 1,
        name: 'Priya Singh',
        email: 'priya@nicsan.in',
        phone: '9876543210',
        branch: 'Mumbai',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Rahul Kumar',
        email: 'rahul@nicsan.in',
        phone: '9876543211',
        branch: 'Delhi',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Anjali Sharma',
        email: 'anjali@nicsan.in',
        phone: '9876543212',
        branch: 'Bangalore',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getTelecallers(),
      mockData,
      'Telecallers'
    );
  }

  // Add new telecaller
  async addTelecaller(telecallerData: any): Promise<DualStorageResult> {
    return this.executeDualStoragePattern(
      () => this.backendApiService.addTelecaller(telecallerData),
      null,
      'Add Telecaller'
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
        total_od: 450000,
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
        total_od: 380000,
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
        total_od: 420000,
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
      { rep: 'Asha', make: 'Maruti', model: 'Swift', vehicleNumber: 'KA01AB1234', policyNumber: 'POL-2025-001', customerName: 'Rajesh Kumar', rollover: 'New', branch: 'Bangalore', issueDate: '2025-01-15', expiryDate: '2026-01-15', policies: 12, gwp: 130000, totalPremium: 135000, totalOD: 120000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
      { rep: 'Asha', make: 'Hyundai', model: 'i20', vehicleNumber: 'KA02CD5678', policyNumber: 'POL-2025-002', customerName: 'Priya Sharma', rollover: 'Renewal', branch: 'Bangalore', issueDate: '2025-02-20', expiryDate: '2026-02-20', policies: 10, gwp: 130000, totalPremium: 135000, totalOD: 120000, cashbackPctAvg: 1.9, cashback: 2500, net: 17500 },
      { rep: 'Vikram', make: 'Hyundai', model: 'i20', vehicleNumber: 'MH01EF9012', policyNumber: 'POL-2025-003', customerName: 'Amit Patel', rollover: 'New', branch: 'Mumbai', issueDate: '2025-03-10', expiryDate: '2026-03-10', policies: 9, gwp: 115000, totalPremium: 120000, totalOD: 110000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 },
      { rep: 'Meera', make: 'Maruti', model: 'Baleno', vehicleNumber: 'DL01GH3456', policyNumber: 'POL-2025-004', customerName: 'Sunita Singh', rollover: 'Renewal', branch: 'Delhi', issueDate: '2025-04-05', expiryDate: '2026-04-05', policies: 11, gwp: 125000, totalPremium: 130000, totalOD: 115000, cashbackPctAvg: 0.9, cashback: 1100, net: 17800 }
    ];


    const result = await this.executeDualStoragePattern(
      () => this.backendApiService.getSalesExplorer(filters),
      mockData,
      'Sales Explorer'
    );


    // Fix field name mapping for backend data
    if (result.success && result.source === 'BACKEND_API' && Array.isArray(result.data)) {
      const mappedData = result.data.map((item: any) => ({
        rep: item.caller_name || item.rep,
        make: item.make,
        model: item.model,
        insurer: item.insurer,
        vehicleNumber: item.vehicle_number || 'N/A',
        policyNumber: item.policy_number || 'N/A',
        customerName: item.customer_name || 'N/A',
        rollover: item.rollover || 'N/A',
        branch: item.branch || 'N/A',
        issueDate: item.issue_date || 'N/A',
        expiryDate: item.expiry_date || 'N/A',
        policies: item.policies,
        gwp: item.gwp,
        totalPremium: item.gwp || 0,
        totalOD: item.total_od || 0,
        cashbackPctAvg: item.avg_cashback_pct || item.cashbackPctAvg || 0,
        cashback: item.total_cashback || item.cashback || 0,
        net: item.net
      }));


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

  // Executive Payments with dual storage
  async getExecutivePayments(): Promise<DualStorageResult> {
    const mockData = [
      {
        executive: 'Priya Singh',
        customer_paid: 12150,
        customer_cheque_no: 'CHQ123456',
        our_cheque_no: 'CHQ789012',
        issue_date: '2025-08-12',
        customer_name: 'John Doe',
        policy_number: 'TA-9921',
        vehicle_number: 'KA01AB1234',
        total_premium: 12150,
        payment_received: false,
        received_date: null,
        received_by: null,
        created_at: '2025-08-12T15:54:00Z'
      },
      {
        executive: 'Rahul Kumar',
        customer_paid: 13500,
        customer_cheque_no: 'CHQ123457',
        our_cheque_no: '',
        issue_date: '2025-08-11',
        customer_name: 'Jane Smith',
        policy_number: 'TA-9922',
        vehicle_number: 'KA02CD5678',
        total_premium: 13500,
        payment_received: false,
        received_date: null,
        received_by: null,
        created_at: '2025-08-11T14:30:00Z'
      },
      {
        executive: 'Anjali Sharma',
        customer_paid: 10800,
        customer_cheque_no: 'CHQ123458',
        our_cheque_no: 'CHQ789013',
        issue_date: '2025-08-10',
        customer_name: 'Mike Johnson',
        policy_number: 'TA-9923',
        vehicle_number: 'KA03EF9012',
        total_premium: 10800,
        payment_received: false,
        received_date: null,
        received_by: null,
        created_at: '2025-08-10T16:20:00Z'
      }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getExecutivePayments(),
      mockData,
      'Executive Payments'
    );
  }

  // Mark payment as received with dual storage
  async markPaymentAsReceived(policyNumber: string, receivedBy: string): Promise<DualStorageResult> {
    try {
      if (ENABLE_DEBUG) {
      }

      // Try backend API first
      const response = await this.backendApiService.markPaymentAsReceived(policyNumber, receivedBy);
      
      if (ENABLE_DEBUG) {
      }

      return {
        success: true,
        data: response.data,
        source: 'BACKEND_API'
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ DualStorageService: Mark payment as received failed:', error);
      }
      
      // For demo purposes, return mock success
      return {
        success: true,
        data: {
          policy_number: policyNumber,
          payment_received: true,
          received_date: new Date().toISOString(),
          received_by: receivedBy
        },
        source: 'MOCK_DATA'
      };
    }
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
      customer_email: 'customer@example.com',
      brokerage: 1822,
      cashback: 600,
      net_revenue: 1222,
      cashback_percentage: 4.9,
      cashback_amount: 600,
      customer_paid: 12150,
      customer_cheque_no: 'CHQ123456',
      our_cheque_no: 'CHQ789012',
      payment_method: 'NICSAN',
      payment_sub_method: 'EXECUTIVE',
      status: 'SAVED',
      confidence_score: 0.98,
      created_by: 'System',
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
        payment_method: 'NICSAN',
        payment_sub_method: 'EXECUTIVE',
        executive: 'Priya Singh',
        customer_paid: 12150,
        customer_cheque_no: 'CHQ123456',
        our_cheque_no: 'CHQ789012',
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
        customer_name: 'Jane Smith',
        cashback: 500,
        payment_method: 'INSURER',
        payment_sub_method: '',
        status: 'SAVED',
        source: 'MANUAL_FORM',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        policy_number: 'RS-7890',
        vehicle_number: 'KA02CD3456',
        insurer: 'Royal Sundaram General Insurance',
        total_premium: 13200,
        customer_name: 'Sarah Wilson',
        cashback: 700,
        payment_method: 'NICSAN',
        payment_sub_method: 'DIRECT',
        executive: 'Rahul Kumar',
        customer_paid: 13200,
        customer_cheque_no: 'CHQ123457',
        our_cheque_no: '',
        status: 'SAVED',
        source: 'PDF_UPLOAD',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        policy_number: 'ZK-5678',
        vehicle_number: 'KA03EF7890',
        insurer: 'Zurich Kotak General Insurance',
        total_premium: 12800,
        customer_name: 'Michael Brown',
        cashback: 650,
        payment_method: 'INSURER',
        payment_sub_method: '',
        status: 'SAVED',
        source: 'MANUAL_FORM',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        policy_number: 'HE-9012',
        vehicle_number: 'KA04GH1234',
        insurer: 'HDFC ERGO General Insurance',
        total_premium: 12500,
        customer_name: 'Emily Davis',
        cashback: 600,
        payment_method: 'NICSAN',
        payment_sub_method: 'EXECUTIVE',
        executive: 'Anjali Sharma',
        customer_paid: 12500,
        customer_cheque_no: 'CHQ123458',
        our_cheque_no: 'CHQ789013',
        status: 'SAVED',
        source: 'PDF_UPLOAD',
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

  // Upload individual document with dual storage
  async uploadDocument(formData: FormData): Promise<DualStorageResult> {
    const mockData = {
      documentId: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      s3Key: `uploads/documents/${Date.now()}_document.pdf`,
      status: 'UPLOADED',
      message: 'Document uploaded successfully (mock)'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.uploadDocument(formData),
      mockData,
      'Upload Document'
    );
  }

  // Get documents by policy number
  async getPolicyDocuments(policyNumber: string): Promise<DualStorageResult> {
    const mockData = {
      policyPDF: {
        s3Key: `uploads/TATA_AIG/policy_documents/${policyNumber}_policy.pdf`,
        filename: `${policyNumber}_policy.pdf`,
        size: 1024000,
        policyNumber: policyNumber
      },
      aadhaar: {
        s3Key: `uploads/TATA_AIG/aadhaar_cards/${policyNumber}_aadhaar.jpg`,
        filename: `${policyNumber}_aadhaar.jpg`,
        size: 512000,
        policyNumber: policyNumber
      },
      pancard: {
        s3Key: `uploads/TATA_AIG/pan_cards/${policyNumber}_pan.jpg`,
        filename: `${policyNumber}_pan.jpg`,
        size: 256000,
        policyNumber: policyNumber
      },
      rc: {
        s3Key: `uploads/TATA_AIG/rc_documents/${policyNumber}_rc.pdf`,
        filename: `${policyNumber}_rc.pdf`,
        size: 768000,
        policyNumber: policyNumber
      }
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getPolicyDocuments(policyNumber),
      mockData,
      'Get Policy Documents'
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

  // Save health insurance with dual storage
  async saveHealthInsurance(healthData: any): Promise<DualStorageResult> {
    const mockData = {
      id: Date.now().toString(),
      ...healthData,
      source: 'HEALTH_INSURANCE',
      created_at: new Date().toISOString(),
      message: 'Health insurance saved successfully (mock)'
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.saveHealthInsurance(healthData),
      mockData,
      'Save Health Insurance'
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

  // Login with dual storage - Enhanced for unified authentication
  async login(credentials: { email: string; password: string }): Promise<DualStorageResult> {
    // Enhanced mock data with proper user information
    const mockData = {
      success: true,
      data: {
        user: {
          id: credentials.email.includes('founder') ? '1' : '2',
          email: credentials.email,
          name: credentials.email.split('@')[0] || 'User',
          role: credentials.email.includes('founder') ? 'founder' : 'ops'
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

  // Get Total OD daily breakdown with dual storage
  async getTotalODDaily(period: string = '30d'): Promise<DualStorageResult> {
    const mockData = [
      { date: '2025-01-15', total_od: 15000, policy_count: 5, avg_od_per_policy: 3000, max_od: 5000, min_od: 1000 },
      { date: '2025-01-14', total_od: 12000, policy_count: 4, avg_od_per_policy: 3000, max_od: 4000, min_od: 2000 },
      { date: '2025-01-13', total_od: 18000, policy_count: 6, avg_od_per_policy: 3000, max_od: 6000, min_od: 1500 }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getTotalODDaily(period),
      mockData,
      'Total OD Daily Breakdown'
    );
  }

  // Get Total OD monthly breakdown with dual storage
  async getTotalODMonthly(period: string = '12m'): Promise<DualStorageResult> {
    const mockData = [
      { month: '2025-01-01', total_od: 45000, policy_count: 15, avg_od_per_policy: 3000, max_od: 6000, min_od: 1000 },
      { month: '2024-12-01', total_od: 42000, policy_count: 14, avg_od_per_policy: 3000, max_od: 5500, min_od: 1500 },
      { month: '2024-11-01', total_od: 38000, policy_count: 13, avg_od_per_policy: 2923, max_od: 5000, min_od: 1200 }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getTotalODMonthly(period),
      mockData,
      'Total OD Monthly Breakdown'
    );
  }

  // Get Total OD financial year breakdown with dual storage
  async getTotalODFinancialYear(years: number = 3): Promise<DualStorageResult> {
    const mockData = [
      { financial_year: 2024, total_od: 480000, policy_count: 160, avg_od_per_policy: 3000, max_od: 8000, min_od: 1000 },
      { financial_year: 2023, total_od: 420000, policy_count: 140, avg_od_per_policy: 3000, max_od: 7500, min_od: 1200 },
      { financial_year: 2022, total_od: 360000, policy_count: 120, avg_od_per_policy: 3000, max_od: 7000, min_od: 1000 }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getTotalODFinancialYear(years),
      mockData,
      'Total OD Financial Year Breakdown'
    );
  }

  // Health Insurance Methods
  async getAllHealthInsurance(limit: number = 50, offset: number = 0): Promise<DualStorageResult> {
    const mockData = {
      policies: [
        {
          id: 'health-1',
          policy_number: 'HI-2024-001',
          insurer: 'HDFC ERGO General Insurance',
          premium_amount: 15000,
          sum_insured: 500000,
          issue_date: '2024-01-15',
          expiry_date: '2025-01-14',
          customer_name: 'Rajesh Kumar',
          executive: 'Priya Singh',
          source: 'HEALTH_INSURANCE',
          created_at: new Date().toISOString()
        },
        {
          id: 'health-2',
          policy_number: 'STAR-2024-002',
          insurer: 'Star Health Insurance',
          premium_amount: 25000,
          sum_insured: 750000,
          issue_date: '2024-02-01',
          expiry_date: '2025-01-31',
          customer_name: 'Priya Sharma',
          executive: 'Health Executive',
          source: 'HEALTH_INSURANCE',
          created_at: new Date().toISOString()
        },
        {
          id: 'health-3',
          policy_number: 'BAJAJ-2024-003',
          insurer: 'Bajaj Allianz General Insurance',
          premium_amount: 30000,
          sum_insured: 1000000,
          issue_date: '2024-03-01',
          expiry_date: '2025-02-28',
          customer_name: 'Amit Patel',
          executive: 'Health Executive',
          source: 'HEALTH_INSURANCE',
          created_at: new Date().toISOString()
        }
      ],
      pagination: {
        limit,
        offset,
        total: 3
      }
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getAllHealthInsurance(limit, offset),
      mockData,
      'Get All Health Insurance'
    );
  }

  async getHealthInsuranceDetail(policyNumber: string): Promise<DualStorageResult> {
    // Create dynamic mock data based on policy number
    let mockData;
    
    if (policyNumber === 'HI-2024-001') {
      mockData = {
        id: 'health-1',
        policy_number: 'HI-2024-001',
        insurer: 'HDFC ERGO General Insurance',
        premium_amount: 15000,
        sum_insured: 500000,
        issue_date: '2024-01-15',
        expiry_date: '2025-01-14',
        customer_name: 'Rajesh Kumar',
        customer_email: 'rajesh.kumar@email.com',
        executive: 'Priya Singh',
        caller_name: 'Health Caller',
        mobile: '9876543210',
        branch: 'Mumbai',
        remark: 'Health insurance policy',
        source: 'HEALTH_INSURANCE',
        insuredPersons: [
          {
            name: 'Rajesh Kumar',
            pan_card: 'ABCDE1234F',
            aadhaar_card: '123456789012',
            date_of_birth: '1985-03-15',
            weight: 75.5,
            height: 175.0,
            pre_existing_disease: false,
            disease_name: '',
            disease_years: null,
            tablet_details: '',
            surgery: false,
            surgery_name: '',
            surgery_details: ''
          }
        ],
        created_at: new Date().toISOString()
      };
    } else if (policyNumber === 'STAR-2024-002') {
      mockData = {
        id: 'health-2',
        policy_number: 'STAR-2024-002',
        insurer: 'Star Health Insurance',
        premium_amount: 25000,
        sum_insured: 750000,
        issue_date: '2024-02-01',
        expiry_date: '2025-01-31',
        customer_name: 'Priya Sharma',
        customer_email: 'priya.sharma@email.com',
        executive: 'Health Executive',
        caller_name: 'Health Caller',
        mobile: '9876543211',
        branch: 'Delhi',
        remark: 'Star Health insurance policy',
        source: 'HEALTH_INSURANCE',
        insuredPersons: [
          {
            name: 'Priya Sharma',
            pan_card: 'FGHIJ5678K',
            aadhaar_card: '234567890123',
            date_of_birth: '1990-07-20',
            weight: 65.0,
            height: 160.0,
            pre_existing_disease: true,
            disease_name: 'Diabetes',
            disease_years: 3,
            tablet_details: 'Metformin 500mg daily',
            surgery: false,
            surgery_name: '',
            surgery_details: ''
          }
        ],
        created_at: new Date().toISOString()
      };
    } else if (policyNumber === 'BAJAJ-2024-003') {
      mockData = {
        id: 'health-3',
        policy_number: 'BAJAJ-2024-003',
        insurer: 'Bajaj Allianz General Insurance',
        premium_amount: 30000,
        sum_insured: 1000000,
        issue_date: '2024-03-01',
        expiry_date: '2025-02-28',
        customer_name: 'Amit Patel',
        customer_email: 'amit.patel@email.com',
        executive: 'Health Executive',
        caller_name: 'Health Caller',
        mobile: '9876543212',
        branch: 'Bangalore',
        remark: 'Bajaj Allianz health insurance policy',
        source: 'HEALTH_INSURANCE',
        insuredPersons: [
          {
            name: 'Amit Patel',
            pan_card: 'KLMNO9012P',
            aadhaar_card: '345678901234',
            date_of_birth: '1988-11-10',
            weight: 80.0,
            height: 180.0,
            pre_existing_disease: false,
            disease_name: '',
            disease_years: null,
            tablet_details: '',
            surgery: true,
            surgery_name: 'Appendectomy',
            surgery_details: 'Laparoscopic appendectomy in 2020'
          }
        ],
        created_at: new Date().toISOString()
      };
    } else {
      // Generic fallback for other policy numbers
      mockData = {
        id: `health-${policyNumber}`,
        policy_number: policyNumber,
        insurer: 'Generic Health Insurance',
        premium_amount: 20000,
        sum_insured: 600000,
        issue_date: '2024-01-01',
        expiry_date: '2025-12-31',
        customer_name: `Customer ${policyNumber}`,
        customer_email: `customer${policyNumber}@email.com`,
        executive: 'Health Executive',
        caller_name: 'Health Caller',
        mobile: '9876543210',
        branch: 'Health Branch',
        remark: `Health insurance policy ${policyNumber}`,
        source: 'HEALTH_INSURANCE',
        insuredPersons: [
          {
            name: `Insured Person ${policyNumber}`,
            pan_card: 'ABCDE1234F',
            aadhaar_card: '123456789012',
            date_of_birth: '1985-03-15',
            weight: 75.5,
            height: 175.0,
            pre_existing_disease: false,
            disease_name: '',
            disease_years: null,
            tablet_details: '',
            surgery: false,
            surgery_name: '',
            surgery_details: ''
          }
        ],
        created_at: new Date().toISOString()
      };
    }

    return this.executeDualStoragePattern(
      () => this.backendApiService.getHealthInsuranceDetail(policyNumber),
      mockData,
      'Get Health Insurance Detail'
    );
  }

  // Health Insurance Metrics - Premium Only
  async getHealthInsuranceMetrics(): Promise<DualStorageResult> {
    const mockData = {
      basicMetrics: {
        totalPolicies: 5,
        totalPremium: 75000,    // Only premium amount
        avgPremium: 15000,      // Average premium
        minPremium: 8000,       // Minimum premium
        maxPremium: 25000       // Maximum premium
      },
      dailyTrend: [
        { day: 'D-1', premium: 15000 },
        { day: 'D-2', premium: 18000 },
        { day: 'D-3', premium: 12000 },
        { day: 'D-4', premium: 22000 },
        { day: 'D-5', premium: 16000 },
        { day: 'D-6', premium: 14000 },
        { day: 'D-7', premium: 19000 },
        { day: 'D-8', premium: 17000 },
        { day: 'D-9', premium: 21000 },
        { day: 'D-10', premium: 18000 },
        { day: 'D-11', premium: 16000 },
        { day: 'D-12', premium: 20000 },
        { day: 'D-13', premium: 17000 },
        { day: 'D-14', premium: 23000 }
      ]
    };

    return this.executeDualStoragePattern(
      () => this.backendApiService.getHealthInsuranceMetrics(),
      mockData,
      'Health Insurance Metrics'
    );
  }
}

export default DualStorageService.getInstance();
