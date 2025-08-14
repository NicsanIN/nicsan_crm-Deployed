import AWS from 'aws-sdk';
import { s3, textract, s3Config } from '../config/aws';
import pool from '../config/database';
import { PDFUpload, Policy } from '../types';

export class PDFProcessor {
  private static instance: PDFProcessor;

  private constructor() {}

  static getInstance(): PDFProcessor {
    if (!PDFProcessor.instance) {
      PDFProcessor.instance = new PDFProcessor();
    }
    return PDFProcessor.instance;
  }

  /**
   * Generate presigned URL for secure PDF upload
   */
  async generatePresignedUploadUrl(filename: string, userId: string): Promise<string> {
    const timestamp = Date.now();
    const s3Key = `uploads/${timestamp}_${filename}`;
    
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: s3Config.bucketName,
      Key: s3Key,
      Expires: 3600, // 1 hour
      ContentType: 'application/pdf',
      Metadata: {
        originalName: filename,
        uploadedBy: userId,
        timestamp: timestamp.toString()
      }
    });

    return presignedUrl;
  }

  /**
   * Process PDF with AWS Textract
   */
  async processPDFWithTextract(s3Key: string, uploadId: string): Promise<any> {
    try {
      // Start asynchronous document analysis
      const textractParams = {
        DocumentLocation: {
          S3Object: {
            Bucket: s3Config.bucketName,
            Name: s3Key
          }
        },
        FeatureTypes: ['FORMS', 'TABLES'],
        OutputConfig: {
          S3Bucket: s3Config.bucketName,
          S3Prefix: `textract-output/${uploadId}/`
        }
      };

      const result = await textract.startDocumentAnalysis(textractParams).promise();
      
      // Update database with job ID
      await pool.query(
        'UPDATE pdf_uploads SET status = $1, extracted_data = $2 WHERE id = $3',
        ['PROCESSING', { jobId: result.JobId }, uploadId]
      );

      return {
        jobId: result.JobId,
        status: 'PROCESSING'
      };

    } catch (error) {
      console.error('Textract processing failed:', error);
      
      // Update database with error
      await pool.query(
        'UPDATE pdf_uploads SET status = $1, error_message = $2 WHERE id = $3',
        ['FAILED', (error as Error).message, uploadId]
      );

      throw error;
    }
  }

  /**
   * Check Textract job status and get results
   */
  async getTextractResults(jobId: string): Promise<any> {
    try {
      const result = await textract.getDocumentAnalysis({ JobId: jobId }).promise();
      
      if (result.JobStatus === 'SUCCEEDED') {
        return {
          status: 'COMPLETED',
          blocks: result.Blocks,
          documentMetadata: result.DocumentMetadata
        };
      } else if (result.JobStatus === 'IN_PROGRESS') {
        return {
          status: 'PROCESSING',
          progressPercent: (result as any).ProgressPercent || 0
        };
      } else if (result.JobStatus === 'FAILED') {
        return {
          status: 'FAILED',
          statusMessage: result.StatusMessage
        };
      }

      return { status: result.JobStatus };
    } catch (error) {
      console.error('Failed to get Textract results:', error);
      throw error;
    }
  }

  /**
   * Extract policy data from Textract blocks
   */
  extractPolicyData(blocks: any[]): Partial<Policy> {
    const extractedData: Partial<Policy> = {};
    
    if (!blocks) return extractedData;

    // Extract text from blocks
    const textBlocks = blocks.filter(block => block.BlockType === 'LINE');
    const text = textBlocks.map(block => block.Text).join(' ');

    // Extract key-value pairs
    const keyValueBlocks = blocks.filter(block => block.BlockType === 'KEY_VALUE_SET');
    
    keyValueBlocks.forEach(block => {
      if (block.EntityType === 'KEY') {
        const key = block.Key?.Text?.toLowerCase();
        const value = block.Value?.Text;
        
        if (key && value) {
          // Map extracted text to policy fields
          switch (key) {
            case 'policy number':
            case 'policy no':
            case 'policy no.':
              extractedData.policy_number = value;
              break;
            case 'vehicle number':
            case 'vehicle no':
            case 'registration no':
              extractedData.vehicle_number = value;
              break;
            case 'insurer':
            case 'insurance company':
              extractedData.insurer = value;
              break;
            case 'total premium':
            case 'premium amount':
              extractedData.total_premium = parseFloat(value.replace(/[^\d.]/g, ''));
              break;
            case 'issue date':
            case 'start date':
              extractedData.issue_date = value;
              break;
            case 'expiry date':
            case 'end date':
              extractedData.expiry_date = value;
              break;
          }
        }
      }
    });

    // Calculate confidence score based on extracted fields
    const extractedFields = Object.keys(extractedData).length;
    const confidenceScore = Math.min(0.95, 0.3 + (extractedFields * 0.1));

    return {
      ...extractedData,
      source: 'PDF_UPLOAD',
      confidence_score: confidenceScore
    };
  }

  /**
   * Clean up processed PDF files
   */
  async cleanupProcessedPDF(s3Key: string): Promise<void> {
    try {
      await s3.deleteObject({
        Bucket: s3Config.bucketName,
        Key: s3Key
      }).promise();
      
      console.log(`PDF cleaned up: ${s3Key}`);
    } catch (error) {
      console.error('Failed to cleanup PDF:', error);
      // Don't throw error for cleanup failures
    }
  }

  /**
   * Complete PDF processing workflow
   */
  async completeProcessing(uploadId: string, policyData: Partial<Policy>): Promise<void> {
    try {
      // Update upload status
      await pool.query(
        'UPDATE pdf_uploads SET status = $1, extracted_data = $2 WHERE id = $3',
        ['COMPLETED', policyData, uploadId]
      );

      // Create policy record if confidence is high enough
      if (policyData.confidence_score && policyData.confidence_score > 0.7) {
        await pool.query(
          `INSERT INTO policies (
            policy_number, vehicle_number, insurer, product_type, vehicle_type,
            make, model, issue_date, expiry_date, idv, ncb, net_od,
            total_od, net_premium, total_premium, cashback_amount,
            customer_paid, executive, caller_name, mobile, source,
            confidence_score, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
          [
            policyData.policy_number || 'AUTO-' + Date.now(),
            policyData.vehicle_number || 'UNKNOWN',
            policyData.insurer || 'UNKNOWN',
            'AUTO', 'CAR',
            'UNKNOWN', 'UNKNOWN',
            policyData.issue_date || new Date(),
            policyData.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            policyData.idv || 0,
            policyData.ncb || 0,
            policyData.net_od || 0,
            policyData.total_od || 0,
            policyData.net_premium || 0,
            policyData.total_premium || 0,
            policyData.cashback_amount || 0,
            policyData.customer_paid || 0,
            'SYSTEM', 'PDF_EXTRACT', '0000000000',
            'PDF_UPLOAD',
            policyData.confidence_score,
            'system'
          ]
        );
      }

    } catch (error) {
      console.error('Failed to complete processing:', error);
      throw error;
    }
  }
}

export default PDFProcessor.getInstance();
