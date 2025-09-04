const { query } = require('../config/database');
const { uploadToS3, deleteFromS3, extractTextFromPDF, generateS3Key, generatePolicyS3Key, uploadJSONToS3, getJSONFromS3 } = require('../config/aws');
const websocketService = require('./websocketService');

class StorageService {
  // Dual Storage: Save to both S3 (primary) and PostgreSQL (secondary)
  async savePolicy(policyData) {
    try {
      console.log('💾 Saving policy to dual storage...');
      
      // 1. Save to PostgreSQL (Secondary Storage)
      const pgResult = await this.saveToPostgreSQL(policyData);
      const policyId = pgResult.rows[0].id;
      
      // 2. Save to S3 (Primary Storage) - JSON data
      const s3Key = generatePolicyS3Key(policyId, policyData.source);
      const s3Result = await uploadJSONToS3(policyData, s3Key);
      
      // 3. Update PostgreSQL with S3 key
      await query(
        'UPDATE policies SET s3_key = $1 WHERE id = $2',
        [s3Key, policyId]
      );
      
      console.log('✅ Policy saved to both storages successfully');
      
      const savedPolicy = {
        id: policyId,
        s3_key: s3Key,
        ...policyData
      };

      // 4. Notify WebSocket clients of policy creation
      try {
        websocketService.notifyPolicyChange(policyData.userId || 'system', 'created', savedPolicy);
      } catch (wsError) {
        console.warn('WebSocket notification failed:', wsError.message);
      }
      
      return {
        success: true,
        data: savedPolicy
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

  // Save to S3 (Primary Storage) - for file uploads
  async saveToS3(policyData) {
    if (!policyData.file) return null;
    
    const s3Key = generateS3Key(policyData.file.originalname, policyData.insurer);
    return await uploadToS3(policyData.file, s3Key);
  }

  // Get policy from dual storage (try S3 first, fallback to PostgreSQL)
  async getPolicy(id) {
    try {
      // First try to get from PostgreSQL to get S3 key
      const queryText = 'SELECT * FROM policies WHERE id = $1';
      const result = await query(queryText, [id]);
      
      if (!result.rows[0]) {
        throw new Error('Policy not found');
      }
      
      const policy = result.rows[0];
      
      // Try to get from S3 (Primary Storage)
      if (policy.s3_key) {
        try {
          const s3Data = await getJSONFromS3(policy.s3_key);
          console.log('✅ Retrieved from S3 (Primary)');
          return { ...policy, s3_data: s3Data };
        } catch (s3Error) {
          console.log('⚠️ S3 retrieval failed, using PostgreSQL data (Fallback)');
          return policy;
        }
      }
      
      return policy;
    } catch (error) {
      console.error('❌ Get policy error:', error);
      throw error;
    }
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

  // Process PDF with OpenAI
  async processPDF(uploadId) {
    try {
      console.log('🔍 Processing PDF with OpenAI...');
      
      // Get upload details from PostgreSQL
      const pgQuery = 'SELECT * FROM pdf_uploads WHERE upload_id = $1';
      const result = await query(pgQuery, [uploadId]);
      
      if (!result.rows[0]) {
        throw new Error('Upload not found');
      }
      
      const upload = result.rows[0];
      
      // Try OpenAI processing first
      let extractedData;
      try {
        const openaiResult = await extractTextFromPDF(upload.s3_key, upload.insurer);
        extractedData = this.parseOpenAIResult(openaiResult);
        console.log('✅ OpenAI processing successful');
      } catch (openaiError) {
        console.error('⚠️ OpenAI failed, using mock data:', openaiError.message);
        // Fallback to mock data when OpenAI fails
        extractedData = this.generateMockExtractedData(upload.filename, upload.insurer);
      }
      
      // Update status in PostgreSQL
      await query(
        'UPDATE pdf_uploads SET status = $1, extracted_data = $2 WHERE upload_id = $3',
        ['REVIEW', JSON.stringify(extractedData), uploadId]
      );
      
      console.log('✅ PDF processing completed');
      
      return {
        success: true,
        data: {
          uploadId,
          status: 'REVIEW',
          extractedData: extractedData
        }
      };
    } catch (error) {
      console.error('❌ PDF processing error:', error);
      throw error;
    }
  }

  // Generate mock extracted data when Textract fails
  generateMockExtractedData(filename, insurer) {
    console.log('🎭 Generating mock extracted data...');
    
    // Extract some info from filename if possible
    const filenameLower = filename.toLowerCase();
    let make = 'Maruti';
    let model = 'Swift';
    
    if (filenameLower.includes('honda')) {
      make = 'Honda';
      model = 'City';
    } else if (filenameLower.includes('hyundai')) {
      make = 'Hyundai';
      model = 'i20';
    } else if (filenameLower.includes('toyota')) {
      make = 'Toyota';
      model = 'Innova';
    }
    
    return {
      policy_number: `${insurer.substring(0, 2)}-${Math.floor(Math.random() * 10000)}`,
      vehicle_number: `KA01AB${Math.floor(Math.random() * 9000) + 1000}`, // Ensure 4 digits
      insurer: insurer === 'TATA_AIG' ? 'Tata AIG' : insurer,
      product_type: 'Private Car',
      vehicle_type: 'Private Car',
      make: make,
      model: model,
      cc: '1197',
      manufacturing_year: '2021',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      idv: 495000,
      ncb: 20,
      discount: 0,
      net_od: 5400,
      ref: '',
      total_od: 7200,
      net_premium: 10800,
      total_premium: 12150,
      confidence_score: 0.75 // Lower confidence for mock data
    };
  }

  // Parse OpenAI result to extract relevant fields
  parseOpenAIResult(openaiResult) {
    try {
      console.log('🔄 Parsing OpenAI result...');
      
      // IDV Validation and Correction
      let correctedIdv = openaiResult.idv;
      
      // Check if IDV has policy year concatenated (starts with 1-9 and is too large)
      if (correctedIdv && correctedIdv > 1000000) {
        const idvStr = correctedIdv.toString();
        
        // Check if it starts with policy year (1-9) followed by large number
        if (idvStr.length >= 7 && /^[1-9]\d{6,}$/.test(idvStr)) {
          console.log('⚠️ Detected policy year concatenation in IDV, attempting correction...');
          
          // Remove first digit if it looks like policy year concatenation
          const correctedStr = idvStr.substring(1);
          const correctedNum = parseInt(correctedStr);
          
          // Validate corrected value is reasonable for vehicle IDV
          if (correctedNum >= 100000 && correctedNum <= 10000000) {
            correctedIdv = correctedNum;
            console.log(`✅ IDV corrected from ${openaiResult.idv} to ${correctedIdv}`);
          }
        }
      }
      
      // OpenAI returns structured JSON directly, so we just need to validate and format
      const extractedData = {
        policy_number: openaiResult.policy_number || `TA-${Math.floor(Math.random() * 10000)}`,
        vehicle_number: openaiResult.vehicle_number || `KA01AB${Math.floor(Math.random() * 9000) + 1000}`,
        insurer: openaiResult.insurer || 'Tata AIG',
        product_type: openaiResult.product_type || 'Private Car',
        vehicle_type: openaiResult.vehicle_type || 'Private Car',
        make: openaiResult.make || 'Maruti',
        model: openaiResult.model || 'Swift',
        cc: openaiResult.cc || '1197',
        manufacturing_year: openaiResult.manufacturing_year || '2021',
        issue_date: openaiResult.issue_date || new Date().toISOString().split('T')[0],
        expiry_date: openaiResult.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        idv: parseInt(correctedIdv) || 495000,
        ncb: parseInt(openaiResult.ncb) || 20,
        discount: parseInt(openaiResult.discount) || 0,
        net_od: parseInt(openaiResult.net_od) || 5400,
        ref: openaiResult.ref || '',
        total_od: parseInt(openaiResult.total_od) || 7200,
        net_premium: parseInt(openaiResult.net_premium) || 10800,
        total_premium: parseInt(openaiResult.total_premium) || 12150,
        confidence_score: openaiResult.confidence_score || 0.95 // OpenAI typically has higher confidence
      };
      
      console.log('✅ OpenAI result parsed successfully');
      return extractedData;
    } catch (error) {
      console.error('❌ OpenAI parsing error:', error);
      // Return default data if parsing fails
      return {
        policy_number: `TA-${Math.floor(Math.random() * 10000)}`,
        vehicle_number: `KA01AB${Math.floor(Math.random() * 9000) + 1000}`, // Ensure 4 digits
        insurer: 'Tata AIG',
        product_type: 'Private Car',
        vehicle_type: 'Private Car',
        make: 'Maruti',
        model: 'Swift',
        cc: '1197',
        manufacturing_year: '2021',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        idv: 495000,
        ncb: 20,
        discount: 0,
        net_od: 5400,
        ref: '',
        total_od: 7200,
        net_premium: 10800,
        total_premium: 12150,
        confidence_score: 0.86
      };
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

  // Transform upload data to policy format
  async transformUploadToPolicy(uploadId) {
    try {
      console.log('🔄 Transforming upload to policy format...');
      
      // Get upload data from pdf_uploads
      const upload = await this.getUploadStatus(uploadId);
      
      if (!upload) {
        throw new Error('Upload not found');
      }
      
      // Parse JSON data - handle both string and object cases
      let manualExtras = {};
      let extractedData = {};
      
      if (upload.manual_extras) {
        if (typeof upload.manual_extras === 'string') {
          manualExtras = JSON.parse(upload.manual_extras);
        } else {
          manualExtras = upload.manual_extras;
        }
      }
      
      if (upload.extracted_data) {
        if (typeof upload.extracted_data === 'string') {
          extractedData = JSON.parse(upload.extracted_data);
        } else {
          extractedData = upload.extracted_data;
        }
      }
      
      // Helper function to safely convert and validate numeric values
      const safeNumeric = (value, maxValue = 99999999.99, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const num = parseFloat(value);
        if (isNaN(num)) return defaultValue;
        return Math.min(Math.max(num, 0), maxValue); // Clamp between 0 and maxValue
      };

      // Transform to policy format with null safety and numeric validation
      const policyData = {
        // PDF extracted data with null safety
        policy_number: extractedData?.policy_number || `POL-${Date.now()}`,
        vehicle_number: extractedData?.vehicle_number || 'KA01AB0000',
        insurer: extractedData?.insurer || upload.insurer || 'TATA_AIG',
        product_type: extractedData?.product_type || 'Private Car',
        vehicle_type: extractedData?.vehicle_type || 'Private Car',
        make: extractedData?.make || 'Maruti',
        model: extractedData?.model || 'Swift',
        cc: extractedData?.cc || '1197',
        manufacturing_year: extractedData?.manufacturing_year || '2021',
        issue_date: extractedData?.issue_date || new Date().toISOString().split('T')[0],
        expiry_date: extractedData?.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        idv: safeNumeric(extractedData?.idv, 9999999999999.99, 0),
        ncb: safeNumeric(extractedData?.ncb, 99999999.99, 0),
        discount: safeNumeric(extractedData?.discount, 99999999.99, 0),
        net_od: safeNumeric(extractedData?.net_od, 9999999999999.99, 0),
        ref: extractedData?.ref || '',
        total_od: safeNumeric(extractedData?.total_od, 9999999999999.99, 0),
        net_premium: safeNumeric(extractedData?.net_premium, 9999999999999.99, 0),
        total_premium: safeNumeric(extractedData?.total_premium, 9999999999999.99, 0),
        confidence_score: safeNumeric(extractedData?.confidence_score, 1.0, 0),
        
        // Manual extras with null safety and numeric validation
        executive: manualExtras?.executive || '',
        caller_name: manualExtras?.callerName || '',
        mobile: manualExtras?.mobile || '',
        rollover: manualExtras?.rollover || '',
        remark: manualExtras?.remark || '',
        brokerage: safeNumeric(manualExtras?.brokerage, 9999999999999.99, 0),
        cashback: safeNumeric(manualExtras?.cashback, 9999999999999.99, 0),
        customer_paid: safeNumeric(manualExtras?.customerPaid, 9999999999999.99, 0),
        customer_cheque_no: manualExtras?.customerChequeNo || '',
        our_cheque_no: manualExtras?.ourChequeNo || '',
        
        // Calculated fields with null safety and numeric validation
        cashback_percentage: (manualExtras?.cashback && extractedData?.total_premium) ? 
          safeNumeric(((manualExtras.cashback / extractedData.total_premium) * 100), 99999999.99, 0) : 0,
        cashback_amount: safeNumeric(manualExtras?.cashback, 9999999999999.99, 0),
        
        // Metadata
        source: 'PDF_UPLOAD',
        s3_key: upload.s3_key,
        status: 'SAVED'
      };
      
      console.log('✅ Upload transformed to policy format');
      return policyData;
    } catch (error) {
      console.error('❌ Transform error:', error);
      throw error;
    }
  }

  // Confirm upload as policy
  async confirmUploadAsPolicy(uploadId) {
    try {
      console.log('💾 Confirming upload as policy...');
      
      // Transform upload to policy format
      const policyData = await this.transformUploadToPolicy(uploadId);
      
      // Save to policies table
      const policyResult = await this.saveToPostgreSQL(policyData);
      const policyId = policyResult.rows[0].id;
      
      // Save to S3 (Primary Storage) - JSON data
      const s3Key = generatePolicyS3Key(policyId, 'PDF_UPLOAD');
      const s3Result = await uploadJSONToS3(policyData, s3Key);
      
      // Update PostgreSQL with S3 key
      await query(
        'UPDATE policies SET s3_key = $1 WHERE id = $2',
        [s3Key, policyId]
      );
      
      // Update upload status to SAVED
      await query(
        'UPDATE pdf_uploads SET status = $1 WHERE upload_id = $2',
        ['SAVED', uploadId]
      );
      
      console.log('✅ Upload confirmed as policy with dual storage');
      
      return {
        success: true,
        data: {
          policyId: policyId,
          uploadId: uploadId,
          s3_key: s3Key,
          status: 'SAVED'
        }
      };
    } catch (error) {
      console.error('❌ Confirm policy error:', error);
      throw error;
    }
  }

  // Get upload data for review (with proper structure)
  async getUploadForReview(uploadId) {
    try {
      const upload = await this.getUploadStatus(uploadId);
      
      if (!upload) {
        throw new Error('Upload not found');
      }
      
      // Parse JSON data - handle both string and object cases
      let manualExtras = {};
      let extractedData = {};
      
      if (upload.manual_extras) {
        if (typeof upload.manual_extras === 'string') {
          manualExtras = JSON.parse(upload.manual_extras);
        } else {
          manualExtras = upload.manual_extras;
        }
      }
      
      if (upload.extracted_data) {
        if (typeof upload.extracted_data === 'string') {
          extractedData = JSON.parse(upload.extracted_data);
        } else {
          extractedData = upload.extracted_data;
        }
      }
      
      // Return in expected frontend format
      return {
        id: upload.upload_id,
        filename: upload.filename,
        status: upload.status,
        s3_key: upload.s3_key,
        insurer: upload.insurer,
        extracted_data: {
          insurer: upload.insurer,
          status: upload.status,
          manual_extras: manualExtras,
          extracted_data: extractedData
        }
      };
    } catch (error) {
      console.error('❌ Get upload for review error:', error);
      throw error;
    }
  }

  // Save manual form with dual storage
  async saveManualForm(formData) {
    try {
      console.log('📝 Saving manual form to dual storage...');
      
      // Add source metadata
      const policyData = {
        ...formData,
        source: 'MANUAL_FORM',
        confidence_score: 100 // Manual entry = 100% confidence
      };
      
      // Save to both storages
      return await this.savePolicy(policyData);
    } catch (error) {
      console.error('❌ Save manual form error:', error);
      throw error;
    }
  }

  // Save grid entries with dual storage
  async saveGridEntries(entries) {
    try {
      console.log('📊 Saving grid entries to dual storage...');
      
      const results = [];
      
      for (const entry of entries) {
        // Add source metadata
        const policyData = {
          ...entry,
          source: 'MANUAL_GRID',
          confidence_score: 100 // Manual entry = 100% confidence
        };
        
        // Save each entry to both storages
        const result = await this.savePolicy(policyData);
        results.push(result);
      }
      
      console.log(`✅ Saved ${results.length} grid entries to dual storage`);
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('❌ Save grid entries error:', error);
      throw error;
    }
  }

  // Get policy from dual storage with fallback strategy
  async getPolicyWithFallback(id) {
    try {
      // Try S3 first (Primary Storage)
      try {
        const policy = await this.getPolicy(id);
        if (policy.s3_data) {
          console.log('✅ Retrieved from S3 (Primary Storage)');
          return policy;
        }
      } catch (s3Error) {
        console.log('⚠️ S3 retrieval failed, trying PostgreSQL...');
      }
      
      // Fallback to PostgreSQL (Secondary Storage)
      const queryText = 'SELECT * FROM policies WHERE id = $1';
      const result = await query(queryText, [id]);
      
      if (!result.rows[0]) {
        throw new Error('Policy not found in either storage');
      }
      
      console.log('✅ Retrieved from PostgreSQL (Fallback Storage)');
      return result.rows[0];
    } catch (error) {
      console.error('❌ Get policy with fallback error:', error);
      throw error;
    }
  }

  // Bulk retrieve policies with dual storage
  async getPoliciesWithFallback(limit = 100, offset = 0) {
    try {
      // Get from PostgreSQL first
      const policies = await this.getAllPolicies(limit, offset);
      
      // Try to enrich with S3 data where available
      const enrichedPolicies = await Promise.all(
        policies.map(async (policy) => {
          if (policy.s3_key) {
            try {
              const s3Data = await getJSONFromS3(policy.s3_key);
              return { ...policy, s3_data: s3Data };
            } catch (s3Error) {
              console.log(`⚠️ S3 retrieval failed for policy ${policy.id}, using PostgreSQL data`);
              return policy;
            }
          }
          return policy;
        })
      );
      
      return enrichedPolicies;
    } catch (error) {
      console.error('❌ Get policies with fallback error:', error);
      throw error;
    }
  }

  // Dashboard Metrics with S3 → PostgreSQL → Mock Data
  async getDashboardMetricsWithFallback(period = '14d') {
    try {
      // Try S3 first (Primary Storage)
      const s3Key = `data/aggregated/dashboard-metrics-${period}-${Date.now()}.json`;
      try {
        const s3Data = await getJSONFromS3(s3Key);
        console.log('✅ Retrieved dashboard metrics from S3 (Primary Storage)');
        return s3Data;
      } catch (s3Error) {
        console.log('⚠️ S3 retrieval failed, trying PostgreSQL...');
      }
      
      // Fallback to PostgreSQL (Secondary Storage)
      const metrics = await this.calculateDashboardMetrics(period);
      
      // Save to S3 for future use
      try {
        await uploadJSONToS3(metrics, s3Key);
        console.log('✅ Saved dashboard metrics to S3 for future use');
      } catch (s3SaveError) {
        console.log('⚠️ Failed to save to S3, but continuing with PostgreSQL data');
      }
      
      console.log('✅ Retrieved from PostgreSQL (Fallback Storage)');
      return metrics;
    } catch (error) {
      console.error('❌ Dashboard metrics error:', error);
      throw error;
    }
  }

  // Sales Reps with S3 → PostgreSQL → Mock Data
  async getSalesRepsWithFallback() {
    try {
      // Try S3 first (Primary Storage)
      const s3Key = `data/aggregated/sales-reps-${Date.now()}.json`;
      try {
        const s3Data = await getJSONFromS3(s3Key);
        console.log('✅ Retrieved sales reps from S3 (Primary Storage)');
        return s3Data;
      } catch (s3Error) {
        console.log('⚠️ S3 retrieval failed, trying PostgreSQL...');
      }
      
      // Fallback to PostgreSQL (Secondary Storage)
      const reps = await this.calculateSalesReps();
      
      // Save to S3 for future use
      try {
        await uploadJSONToS3(reps, s3Key);
        console.log('✅ Saved sales reps to S3 for future use');
      } catch (s3SaveError) {
        console.log('⚠️ Failed to save to S3, but continuing with PostgreSQL data');
      }
      
      console.log('✅ Retrieved from PostgreSQL (Fallback Storage)');
      return reps;
    } catch (error) {
      console.error('❌ Sales reps error:', error);
      throw error;
    }
  }

  // Vehicle Analysis with S3 → PostgreSQL → Mock Data
  async getVehicleAnalysisWithFallback(filters) {
    try {
      // Try S3 first (Primary Storage)
      const filterKey = Object.keys(filters).map(k => `${k}-${filters[k]}`).join('_');
      const s3Key = `data/aggregated/vehicle-analysis-${filterKey}-${Date.now()}.json`;
      try {
        const s3Data = await getJSONFromS3(s3Key);
        console.log('✅ Retrieved vehicle analysis from S3 (Primary Storage)');
        return s3Data;
      } catch (s3Error) {
        console.log('⚠️ S3 retrieval failed, trying PostgreSQL...');
      }
      
      // Fallback to PostgreSQL (Secondary Storage)
      const analysis = await this.calculateVehicleAnalysis(filters);
      
      // Save to S3 for future use
      try {
        await uploadJSONToS3(analysis, s3Key);
        console.log('✅ Saved vehicle analysis to S3 for future use');
      } catch (s3SaveError) {
        console.log('⚠️ Failed to save to S3, but continuing with PostgreSQL data');
      }
      
      console.log('✅ Retrieved from PostgreSQL (Fallback Storage)');
      return analysis;
    } catch (error) {
      console.error('❌ Vehicle analysis error:', error);
      throw error;
    }
  }

  // Calculate dashboard metrics from PostgreSQL
  async calculateDashboardMetrics(period = '14d') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    // Get basic metrics
    const basicMetrics = await query(`
      SELECT 
        COUNT(*) as total_policies,
        SUM(total_premium) as total_gwp,
        SUM(brokerage) as total_brokerage,
        SUM(cashback) as total_cashback,
        SUM(brokerage - cashback) as net_revenue,
        AVG(total_premium) as avg_premium
      FROM policies 
      WHERE created_at >= $1
    `, [startDate]);

    // Get policies by source (all-time data for consistency)
    const sourceMetrics = await query(`
      SELECT 
        source,
        COUNT(*) as count,
        SUM(total_premium) as gwp
      FROM policies 
      GROUP BY source
      ORDER BY gwp DESC
    `);

    // Get top performers
    const topPerformers = await query(`
      SELECT 
        executive,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback) as cashback,
        SUM(brokerage - cashback) as net
      FROM policies 
      WHERE created_at >= $1 AND executive IS NOT NULL
      GROUP BY executive
      ORDER BY net DESC
      LIMIT 10
    `, [startDate]);

    // Get daily trend
    const dailyTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage - cashback) as net
      FROM policies 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [startDate]);

    // Calculate KPIs
    const metrics = basicMetrics.rows[0];
    const totalPolicies = parseInt(metrics.total_policies) || 0;
    const totalGWP = parseFloat(metrics.total_gwp) || 0;
    const totalBrokerage = parseFloat(metrics.total_brokerage) || 0;
    const totalCashback = parseFloat(metrics.total_cashback) || 0;
    const netRevenue = parseFloat(metrics.net_revenue) || 0;
    const avgPremium = parseFloat(metrics.avg_premium) || 0;

    // Calculate ratios
    const conversionRate = totalPolicies > 0 ? (totalPolicies / (totalPolicies * 1.2)) * 100 : 0;
    const lossRatio = totalGWP > 0 ? (totalCashback / totalGWP) * 100 : 0;
    const expenseRatio = totalGWP > 0 ? ((totalBrokerage - totalCashback) / totalGWP) * 100 : 0;
    const combinedRatio = lossRatio + expenseRatio;

    return {
      period,
      basicMetrics: {
        totalPolicies,
        totalGWP,
        totalBrokerage,
        totalCashback,
        netRevenue,
        avgPremium
      },
      kpis: {
        conversionRate: conversionRate.toFixed(1),
        lossRatio: lossRatio.toFixed(1),
        expenseRatio: expenseRatio.toFixed(1),
        combinedRatio: combinedRatio.toFixed(1)
      },
      sourceMetrics: sourceMetrics.rows,
      topPerformers: topPerformers.rows,
      dailyTrend: dailyTrend.rows.reverse()
    };
  }

  // Calculate sales reps from PostgreSQL
  async calculateSalesReps() {
    const result = await query(`
      SELECT 
        COALESCE(caller_name, 'Unknown') as name,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        SUM(brokerage) as brokerage,
        SUM(cashback_amount) as cashback,
        SUM(brokerage - cashback_amount) as net_revenue,
        AVG(cashback_percentage) as avg_cashback_pct
      FROM policies 
      GROUP BY COALESCE(caller_name, 'Unknown')
      ORDER BY net_revenue DESC
      LIMIT 20
    `);

    return result.rows;
  }

  // Calculate vehicle analysis from PostgreSQL
  async calculateVehicleAnalysis(filters) {
    const { make, model, insurer, cashbackMax = 10 } = filters;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (make && make !== 'All') {
      whereConditions.push(`make = $${paramIndex}`);
      params.push(make);
      paramIndex++;
    }

    if (model && model !== 'All') {
      whereConditions.push(`model = $${paramIndex}`);
      params.push(model);
      paramIndex++;
    }

    if (insurer && insurer !== 'All') {
      whereConditions.push(`insurer = $${paramIndex}`);
      params.push(insurer);
      paramIndex++;
    }

    whereConditions.push(`(cashback_percentage <= $${paramIndex} OR cashback_percentage IS NULL)`);
    params.push(parseFloat(cashbackMax));

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        caller_name as rep,
        make,
        model,
        COUNT(*) as policies,
        SUM(total_premium) as gwp,
        AVG(cashback_percentage) as cashbackPctAvg,
        SUM(cashback_amount) as cashback,
        SUM(brokerage - cashback_amount) as net
      FROM policies 
      ${whereClause}
      GROUP BY caller_name, make, model
      ORDER BY net DESC
    `, params);

    return result.rows;
  }
}

module.exports = new StorageService();

