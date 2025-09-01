const { query } = require('../config/database');
const { uploadToS3, deleteFromS3, extractTextFromPDF, generateS3Key } = require('../config/aws');

class StorageService {
  // Dual Storage: Save to both S3 (primary) and PostgreSQL (secondary)
  async savePolicy(policyData) {
    try {
      console.log('💾 Saving policy to dual storage...');
      
      // 1. Save to PostgreSQL (Secondary Storage)
      const pgResult = await this.saveToPostgreSQL(policyData);
      
      // 2. Save to S3 (Primary Storage) - if there's a file
      let s3Result = null;
      if (policyData.file) {
        s3Result = await this.saveToS3(policyData);
      }
      
      console.log('✅ Policy saved to both storages successfully');
      
      return {
        success: true,
        data: {
          id: pgResult.rows[0].id,
          s3_key: s3Result?.Key || null,
          ...policyData
        }
      };
    } catch (error) {
      console.error('❌ Dual storage save error:', error);
      throw error;
    }
  }

  // Save to PostgreSQL (Secondary Storage)
  async saveToPostgreSQL(policyData) {
    const {
      policy_number, vehicle_number, insurer, product_type, vehicle_type,
      make, model, cc, manufacturing_year, issue_date, expiry_date,
      idv, ncb, discount, net_od, ref, total_od, net_premium, total_premium,
      cashback_percentage, cashback_amount, customer_paid, customer_cheque_no,
      our_cheque_no, executive, caller_name, mobile, rollover, remark,
      brokerage, cashback, source, s3_key, confidence_score
    } = policyData;

    const queryText = `
      INSERT INTO policies (
        policy_number, vehicle_number, insurer, product_type, vehicle_type,
        make, model, cc, manufacturing_year, issue_date, expiry_date,
        idv, ncb, discount, net_od, ref, total_od, net_premium, total_premium,
        cashback_percentage, cashback_amount, customer_paid, customer_cheque_no,
        our_cheque_no, executive, caller_name, mobile, rollover, remark,
        brokerage, cashback, source, s3_key, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
      RETURNING *
    `;

    const values = [
      policy_number, vehicle_number, insurer, product_type, vehicle_type,
      make, model, cc, manufacturing_year, issue_date, expiry_date,
      idv, ncb, discount, net_od, ref, total_od, net_premium, total_premium,
      cashback_percentage, cashback_amount, customer_paid, customer_cheque_no,
      our_cheque_no, executive, caller_name, mobile, rollover, remark,
      brokerage, cashback, source, s3_key, confidence_score
    ];

    return await query(queryText, values);
  }

  // Save to S3 (Primary Storage)
  async saveToS3(policyData) {
    if (!policyData.file) return null;
    
    const s3Key = generateS3Key(policyData.file.originalname, policyData.insurer);
    return await uploadToS3(policyData.file, s3Key);
  }

  // Get policy from PostgreSQL (for queries)
  async getPolicy(id) {
    const queryText = 'SELECT * FROM policies WHERE id = $1';
    const result = await query(queryText, [id]);
    return result.rows[0];
  }

  // Get all policies from PostgreSQL
  async getAllPolicies(limit = 100, offset = 0) {
    const queryText = 'SELECT * FROM policies ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(queryText, [limit, offset]);
    return result.rows;
  }

  // Save PDF upload to both storages
  async savePDFUpload(uploadData) {
    try {
      console.log('📄 Saving PDF upload to dual storage...');
      
      const { file, insurer, manualExtras } = uploadData;
      
      // 1. Upload to S3 (Primary Storage)
      const s3Key = generateS3Key(file.originalname, insurer);
      const s3Result = await uploadToS3(file, s3Key);
      
      // 2. Save metadata to PostgreSQL (Secondary Storage)
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const pgQuery = `
        INSERT INTO pdf_uploads (upload_id, filename, s3_key, insurer, status, manual_extras)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const pgResult = await query(pgQuery, [
        uploadId,
        file.originalname,
        s3Key,
        insurer,
        'UPLOADED',
        JSON.stringify(manualExtras || {})
      ]);
      
      console.log('✅ PDF upload saved to both storages');
      
      return {
        success: true,
        data: {
          uploadId,
          s3Key,
          filename: file.originalname,
          status: 'UPLOADED'
        }
      };
    } catch (error) {
      console.error('❌ PDF upload save error:', error);
      throw error;
    }
  }

  // Process PDF with Textract
  async processPDF(uploadId) {
    try {
      console.log('🔍 Processing PDF with Textract...');
      
      // Get upload details from PostgreSQL
      const pgQuery = 'SELECT * FROM pdf_uploads WHERE upload_id = $1';
      const result = await query(pgQuery, [uploadId]);
      
      if (!result.rows[0]) {
        throw new Error('Upload not found');
      }
      
      const upload = result.rows[0];
      
      // Process with Textract
      const textractResult = await extractTextFromPDF(upload.s3_key);
      
      // Update status in PostgreSQL
      await query(
        'UPDATE pdf_uploads SET status = $1, extracted_data = $2 WHERE upload_id = $3',
        ['PROCESSING', JSON.stringify(textractResult), uploadId]
      );
      
      console.log('✅ PDF processing completed');
      
      return {
        success: true,
        data: {
          uploadId,
          status: 'PROCESSING',
          extractedData: textractResult
        }
      };
    } catch (error) {
      console.error('❌ PDF processing error:', error);
      throw error;
    }
  }

  // Get upload status
  async getUploadStatus(uploadId) {
    const queryText = 'SELECT * FROM pdf_uploads WHERE upload_id = $1';
    const result = await query(queryText, [uploadId]);
    return result.rows[0];
  }

  // Delete from both storages
  async deletePolicy(policyId) {
    try {
      // Get policy to find S3 key
      const policy = await this.getPolicy(policyId);
      
      // Delete from PostgreSQL
      await query('DELETE FROM policies WHERE id = $1', [policyId]);
      
      // Delete from S3 if exists
      if (policy.s3_key) {
        await deleteFromS3(policy.s3_key);
      }
      
      console.log('✅ Policy deleted from both storages');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();

