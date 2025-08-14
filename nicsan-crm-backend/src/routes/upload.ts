import { Router } from 'express';
import multer from 'multer';
import pool from '../config/database';
import { authenticateToken, requireAnyRole, AuthenticatedRequest } from '../middleware/auth';
import { s3, textract, s3Config, validateFile } from '../config/aws';
import { createError } from '../middleware/errorHandler';
import { PDFUpload, ApiResponse } from '../types';
import PDFProcessor from '../services/pdf-processor';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: s3Config.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (s3Config.allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  },
});

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAnyRole);

// Generate presigned URL for secure upload
router.post('/presigned-url', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { filename } = req.body;
    const userId = req.user?.userId;

    if (!filename) {
      return next(createError('Filename is required', 400));
    }

    const presignedUrl = await PDFProcessor.generatePresignedUploadUrl(filename, userId!);
    
    res.json({
      success: true,
      message: 'Presigned URL generated successfully',
      data: {
        presignedUrl,
        expiresIn: 3600, // 1 hour
        fields: {
          'Content-Type': 'application/pdf'
        }
      }
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// Upload PDF and process with Textract
router.post('/pdf', upload.single('pdf'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const file = req.file;
    const userId = req.user?.userId;
    const metadata = req.body;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return next(createError(validation.error!, 400));
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `policy_${timestamp}_${file.originalname}`;
    const s3Key = `uploads/${filename}`;

    // Upload to S3
    const s3Params = {
      Bucket: s3Config.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId!,
        ...metadata
      }
    };

    const s3Result = await s3.upload(s3Params).promise();

    // Save upload record to database
    const uploadResult = await pool.query(
      `INSERT INTO pdf_uploads (
        filename, original_name, s3_key, s3_url, file_size, mime_type, status, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        filename,
        file.originalname,
        s3Key,
        s3Result.Location,
        file.size,
        file.mimetype,
        'UPLOADED',
        userId
      ]
    );

    const pdfUpload: PDFUpload = uploadResult.rows[0];

    // For event-driven processing, just return success
    // Lambda will handle the processing automatically
    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully. Processing automatically...',
      data: {
        uploadId: pdfUpload.id,
        filename: pdfUpload.filename,
        status: pdfUpload.status,
        s3Url: pdfUpload.s3_url,
        note: 'Lambda will process this PDF automatically'
      }
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// INTERNAL ENDPOINTS FOR LAMBDA COMMUNICATION
// These endpoints are protected by internal token, not JWT

// Middleware to validate internal token
const validateInternalToken = (req: any, res: any, next: any) => {
  const internalToken = req.headers['x-internal-token'];
  
  if (!internalToken || internalToken !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid internal token' 
    });
  }
  
  next();
};

// Update upload status by S3 key (called by Lambda)
router.patch('/internal/by-s3key', validateInternalToken, async (req, res, next) => {
  try {
    const { s3Key, status, ...data } = req.body;
    
    if (!s3Key || !status) {
      return next(createError('s3Key and status are required', 400));
    }
    
    // Find upload by S3 key
    const uploadResult = await pool.query(
      'SELECT * FROM pdf_uploads WHERE s3_key = $1',
      [s3Key]
    );
    
    if (uploadResult.rows.length === 0) {
      return next(createError('Upload not found', 404));
    }
    
    const upload = uploadResult.rows[0];
    
    // Update status and additional data
    const updateResult = await pool.query(
      `UPDATE pdf_uploads SET 
        status = $1, 
        extracted_data = COALESCE(extracted_data, '{}'::jsonb) || $2::jsonb,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, JSON.stringify(data), upload.id]
    );
    
    res.json({
      success: true,
      message: 'Upload status updated successfully',
      data: updateResult.rows[0]
    } as ApiResponse<any>);
    
  } catch (error) {
    next(error);
  }
});

// Create policy from extracted data (called by Lambda)
router.post('/internal/by-s3key/parsed', validateInternalToken, async (req, res, next) => {
  try {
    const { s3Key, policyData, status } = req.body;
    
    if (!s3Key || !policyData) {
      return next(createError('s3Key and policyData are required', 400));
    }
    
    // Find upload by S3 key
    const uploadResult = await pool.query(
      'SELECT * FROM pdf_uploads WHERE s3_key = $1',
      [s3Key]
    );
    
    if (uploadResult.rows.length === 0) {
      return next(createError('Upload not found', 404));
    }
    
    const upload = uploadResult.rows[0];
    
    // Create policy record if confidence is high enough
    let policyId = null;
    if (policyData.confidence_score && policyData.confidence_score > 0.7) {
      const policyResult = await pool.query(
        `INSERT INTO policies (
          policy_number, vehicle_number, insurer, product_type, vehicle_type,
          make, model, issue_date, expiry_date, idv, ncb, net_od,
          total_od, net_premium, total_premium, cashback_amount,
          customer_paid, executive, caller_name, mobile, source,
          confidence_score, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING id`,
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
      
      policyId = policyResult.rows[0].id;
    }
    
    // Update upload with policy ID and status
    await pool.query(
      `UPDATE pdf_uploads SET 
        status = $1,
        extracted_data = COALESCE(extracted_data, '{}'::jsonb) || $2::jsonb,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status || 'REVIEW', JSON.stringify({ policyId, ...policyData }), upload.id]
    );
    
    res.json({
      success: true,
      message: 'Policy created from extracted data successfully',
      data: {
        uploadId: upload.id,
        policyId,
        status: status || 'REVIEW',
        extractedData: policyData
      }
    } as ApiResponse<any>);
    
  } catch (error) {
    next(error);
  }
});

// Check Textract processing status
router.get('/status/:uploadId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user?.userId;

    // Get upload record
    const uploadResult = await pool.query(
      'SELECT * FROM pdf_uploads WHERE id = $1 AND uploaded_by = $2',
      [uploadId, userId]
    );

    if (uploadResult.rows.length === 0) {
      return next(createError('Upload not found', 404));
    }

    const upload = uploadResult.rows[0];
    
    res.json({
      success: true,
      message: 'Upload status retrieved',
      data: {
        status: upload.status,
        extractedData: upload.extracted_data,
        policyId: upload.extracted_data?.policyId
      }
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

// Get all uploads for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM pdf_uploads WHERE uploaded_by = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status as string);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
    params.push(parseInt(limit as string).toString(), parseInt(offset as string).toString());

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      message: 'Uploads retrieved successfully',
      data: result.rows
    } as ApiResponse<PDFUpload[]>);

  } catch (error) {
    next(error);
  }
});

// Delete upload (admin only)
router.delete('/:uploadId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user?.userId;

    // Get upload record
    const uploadResult = await pool.query(
      'SELECT * FROM pdf_uploads WHERE id = $1 AND uploaded_by = $2',
      [uploadId, userId]
    );

    if (uploadResult.rows.length === 0) {
      return next(createError('Upload not found', 404));
    }

    const upload = uploadResult.rows[0];

    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: s3Config.bucketName,
        Key: upload.s3_key
      }).promise();
    } catch (s3Error) {
      console.error('Failed to delete from S3:', s3Error);
    }

    // Delete from database
    await pool.query('DELETE FROM pdf_uploads WHERE id = $1', [uploadId]);

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    } as ApiResponse<any>);

  } catch (error) {
    next(error);
  }
});

export default router;
