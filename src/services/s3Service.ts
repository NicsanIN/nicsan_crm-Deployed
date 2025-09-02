// Frontend S3 Service for Cloud Storage Retrieval
// Implements direct S3 access for data retrieval

import { authUtils } from './api';

// Environment variables
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const AWS_S3_BUCKET = import.meta.env.VITE_AWS_S3_BUCKET || 'nicsan-crm-data';
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// AWS SDK configuration
declare global {
  interface Window {
    AWS: any;
  }
}

class S3Service {
  private static instance: S3Service;
  private s3: any = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeAWS();
  }

  static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  private async initializeAWS() {
    try {
      // For now, we'll simulate S3 service as unavailable
      // In a real implementation, you would load the AWS SDK here
      this.isInitialized = false;
      this.s3 = null;
      
      if (ENABLE_DEBUG) {
        console.log('⚠️ S3 Service initialized in fallback mode (AWS SDK not loaded)');
      }
    } catch (error) {
      console.error('❌ S3 Service initialization failed:', error);
      this.isInitialized = false;
      this.s3 = null;
    }
  }

  // Get JSON data from S3
  async getJSONFromS3(key: string): Promise<any> {
    try {
      if (!this.isInitialized || !this.s3) {
        throw new Error('S3 service not initialized');
      }

      const params = {
        Bucket: AWS_S3_BUCKET,
        Key: key
      };

      const result = await this.s3.getObject(params).promise();
      const data = JSON.parse(result.Body.toString());
      
      if (ENABLE_DEBUG) {
        console.log('✅ JSON data retrieved from S3:', key);
      }
      
      return data;
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('❌ S3 JSON retrieval error:', error);
      }
      throw error;
    }
  }

  // Get dashboard metrics from S3
  async getDashboardMetricsFromS3(): Promise<any> {
    try {
      const key = 'data/dashboard/metrics.json';
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard metrics from S3: ${error}`);
    }
  }

  // Get sales reps data from S3
  async getSalesRepsFromS3(): Promise<any> {
    try {
      const key = 'data/dashboard/sales-reps.json';
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get sales reps from S3: ${error}`);
    }
  }

  // Get sales explorer data from S3
  async getSalesExplorerFromS3(): Promise<any> {
    try {
      const key = 'data/dashboard/sales-explorer.json';
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get sales explorer from S3: ${error}`);
    }
  }

  // Get data sources from S3
  async getDataSourcesFromS3(): Promise<any> {
    try {
      const key = 'data/dashboard/data-sources.json';
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get data sources from S3: ${error}`);
    }
  }

  // Get policy detail from S3
  async getPolicyDetailFromS3(policyId: string): Promise<any> {
    try {
      const key = `data/policies/${policyId}.json`;
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get policy detail from S3: ${error}`);
    }
  }

  // Get all policies from S3
  async getAllPoliciesFromS3(): Promise<any> {
    try {
      const key = 'data/policies/all-policies.json';
      const data = await this.getJSONFromS3(key);
      
      return {
        success: true,
        data: data,
        source: 'S3_CLOUD_STORAGE'
      };
    } catch (error) {
      throw new Error(`Failed to get all policies from S3: ${error}`);
    }
  }

  // Check if S3 service is available
  isAvailable(): boolean {
    return this.isInitialized && this.s3 !== null;
  }
}

export default S3Service;
