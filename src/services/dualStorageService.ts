// Dual Storage Service - Implements Backend API → Mock Data fallback pattern
// This is the core service that all pages will use for identical data flow

import BackendApiService from './backendApiService';
import S3Service from './s3Service';
import DatabaseService from './databaseService';

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
  private s3Service: S3Service;
  private databaseService: DatabaseService;

  private constructor() {
    this.backendApiService = BackendApiService.getInstance();
    this.s3Service = S3Service.getInstance();
    this.databaseService = DatabaseService.getInstance();
  }

  static getInstance(): DualStorageService {
    if (!DualStorageService.instance) {
      DualStorageService.instance = new DualStorageService();
    }
    return DualStorageService.instance;
  }

  // Core dual storage pattern: Backend API → Mock Data
  private async executeDualStoragePattern<T>(
    backendMethod: () => Promise<T>,
    mockData: T,
    // operationName: string
  ): Promise<DualStorageResult> {
    
    if (ENABLE_DEBUG) {
    }

    // Step 1: Try Backend API (Primary Storage)
    try {
      if (this.backendApiService.isAvailable()) {
        const result = await backendMethod();
        
        if (ENABLE_DEBUG) {
        }
        
        
        // Extract the data from the BackendApiService response
        const actualData = (result as any).data || result;
        
        
        return {
          success: true,
          data: actualData,
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
      { success: true, data: mockData, source: 'mock' },
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
      { success: true, data: mockData, source: 'mock' },
      'Sales Reps'
    );
  }

  // Sales Explorer with dual storage
  async getSalesExplorer(): Promise<DualStorageResult> {
    const mockData = [
      { rep: 'Asha', make: 'Maruti', model: 'Swift', policies: 12, gwp: 130000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
      { rep: 'Asha', make: 'Hyundai', model: 'i20', policies: 10, gwp: 130000, cashbackPctAvg: 1.9, cashback: 2500, net: 17500 },
      { rep: 'Vikram', make: 'Hyundai', model: 'i20', policies: 9, gwp: 115000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 },
      { rep: 'Meera', make: 'Maruti', model: 'Baleno', policies: 11, gwp: 125000, cashbackPctAvg: 0.9, cashback: 1100, net: 17800 }
    ];

    return this.executeDualStoragePattern(
      () => this.backendApiService.getSalesExplorer(),
      { success: true, data: mockData, source: 'mock' },
      'Sales Explorer'
    );
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
      { success: true, data: mockData, source: 'mock' },
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
      { success: true, data: mockData, source: 'mock' },
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
      { success: true, data: mockData, source: 'mock' },
      'All Policies'
    );
  }

  // Get storage status
  getStorageStatus(): { s3: boolean; database: boolean } {
    return {
      s3: this.s3Service.isAvailable(),
      database: this.databaseService.isAvailable()
    };
  }

  // Refresh storage availability
  async refreshStorageStatus(): Promise<void> {
    await this.databaseService.refreshAvailability();
  }
}

export default DualStorageService.getInstance();
