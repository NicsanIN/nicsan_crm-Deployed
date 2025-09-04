// Frontend Database Service for PostgreSQL Fallback
// Implements direct database access for data retrieval when S3 fails

import { authUtils } from './api';

// Environment variables
const DB_API_BASE_URL = import.meta.env.VITE_DB_API_BASE_URL || 'http://localhost:3001/api';
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

class DatabaseService {
  private static instance: DatabaseService;
  private isServiceAvailable: boolean = false;

  private constructor() {
    this.checkDatabaseAvailability();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async checkDatabaseAvailability(): Promise<void> {
    try {
      const token = authUtils.getToken();
      if (!token) {
        this.isAvailable = false;
        return;
      }

      const baseUrl = DB_API_BASE_URL.replace('/api', '');
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      this.isServiceAvailable = response.ok;
      
      if (ENABLE_DEBUG) {
        console.log('🔍 Database availability check:', this.isServiceAvailable);
      }
    } catch (error) {
      this.isServiceAvailable = false;
      if (ENABLE_DEBUG) {
        console.error('❌ Database availability check failed:', error);
      }
    }
  }

  private async makeDatabaseRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const token = authUtils.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${DB_API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
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
        source: 'POSTGRESQL_DATABASE'
      };
    } catch (error) {
      throw new Error(`Database request failed: ${error}`);
    }
  }

  // Get dashboard metrics from database
  async getDashboardMetricsFromDB(): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest('/dashboard/metrics');
      
      if (ENABLE_DEBUG) {
        console.log('✅ Dashboard metrics retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get dashboard metrics from database: ${error}`);
    }
  }

  // Get sales reps data from database
  async getSalesRepsFromDB(): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest('/dashboard/sales-reps');
      
      if (ENABLE_DEBUG) {
        console.log('✅ Sales reps retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get sales reps from database: ${error}`);
    }
  }

  // Get sales explorer data from database
  async getSalesExplorerFromDB(): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest('/dashboard/sales-explorer');
      
      if (ENABLE_DEBUG) {
        console.log('✅ Sales explorer retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get sales explorer from database: ${error}`);
    }
  }

  // Get data sources from database
  async getDataSourcesFromDB(): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest('/dashboard/data-sources');
      
      if (ENABLE_DEBUG) {
        console.log('✅ Data sources retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get data sources from database: ${error}`);
    }
  }

  // Get policy detail from database
  async getPolicyDetailFromDB(policyId: string): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest(`/policies/${policyId}`);
      
      if (ENABLE_DEBUG) {
        console.log('✅ Policy detail retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get policy detail from database: ${error}`);
    }
  }

  // Get all policies from database
  async getAllPoliciesFromDB(): Promise<any> {
    try {
      const result = await this.makeDatabaseRequest('/policies');
      
      if (ENABLE_DEBUG) {
        console.log('✅ All policies retrieved from database');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get all policies from database: ${error}`);
    }
  }

  // Check if database service is available
  isAvailable(): boolean {
    return this.isServiceAvailable;
  }

  // Refresh database availability
  async refreshAvailability(): Promise<void> {
    await this.checkDatabaseAvailability();
  }
}

export default DatabaseService;
