// src/services/S3Service.ts
// Frontend S3 Service for Cloud Storage Retrieval (with simple prefix support)

import { authUtils } from './api';

// === Env ===
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const AWS_S3_BUCKET = import.meta.env.VITE_AWS_S3_BUCKET || 'nicsan-crm-pdfs';
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Prefix: prod="" | staging="staging/"
const RAW_PREFIX = (import.meta.env.VITE_S3_PREFIX || '').trim();
const S3_PREFIX = RAW_PREFIX ? RAW_PREFIX.replace(/^\/+/, '').replace(/\/+$/, '') + '/' : '';

// Helper to prepend the prefix
const withPrefix = (path: string) => `${S3_PREFIX}${path}`;

declare global {
  interface Window { AWS: any }
}

class S3Service {
  private static instance: S3Service;
  private s3: any = null;
  private isInitialized = false;

  private constructor() {
    this.initializeAWS();
  }

  static getInstance(): S3Service {
    if (!S3Service.instance) S3Service.instance = new S3Service();
    return S3Service.instance;
  }

  private async initializeAWS() {
    try {
      // NOTE: Fallback mode (AWS SDK not loaded on frontend)
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

  // Core JSON getter (expects initialized AWS SDK; will throw in fallback)
  private async getJSONFromS3(key: string): Promise<any> {
    try {
      if (!this.isInitialized || !this.s3) {
        throw new Error('S3 service not initialized');
      }

      const params = { Bucket: AWS_S3_BUCKET, Key: key };
      const result = await this.s3.getObject(params).promise();
      const data = JSON.parse(result.Body.toString());

      if (ENABLE_DEBUG) console.log('✅ JSON from S3:', key);
      return data;
    } catch (error) {
      if (ENABLE_DEBUG) console.error('❌ S3 JSON retrieval error:', key, error);
      throw error;
    }
  }

  // === Public helpers (now all keys are prefixed) ===
  async getDashboardMetricsFromS3() {
    const key = withPrefix('data/dashboard/metrics.json');
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  async getSalesRepsFromS3() {
    const key = withPrefix('data/dashboard/sales-reps.json');
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  async getSalesExplorerFromS3() {
    const key = withPrefix('data/dashboard/sales-explorer.json');
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  async getDataSourcesFromS3() {
    const key = withPrefix('data/dashboard/data-sources.json');
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  async getPolicyDetailFromS3(policyId: string) {
    const key = withPrefix(`data/policies/${policyId}.json`);
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  async getAllPoliciesFromS3() {
    const key = withPrefix('data/policies/all-policies.json');
    const data = await this.getJSONFromS3(key);
    return { success: true, data, source: 'S3_CLOUD_STORAGE' };
  }

  isAvailable(): boolean {
    return this.isInitialized && this.s3 !== null;
  }
}

export default S3Service;
