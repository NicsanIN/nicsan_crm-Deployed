const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageService = require('../services/storageService');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { authenticateToken, requireOps } = require('../middleware/auth');
const { query } = require('../config/database');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// Upload PDF with manual extras
router.post('/pdf', authenticateToken, requireOps, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required'
      });
    }

    const { insurer } = req.body;
    if (!insurer) {
      return res.status(400).json({
        success: false,
        error: 'Insurer is required'
      });
    }

    // Extract manual extras from form data
    const manualExtras = {};
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('manual_')) {
        const fieldName = key.replace('manual_', '');
        manualExtras[fieldName] = req.body[key];
      }
    });

    // Debug: Log manual extras received
    console.log('🔍 PDF Upload - Manual extras received:', manualExtras);
    console.log('🔍 PDF Upload - Customer name in manual extras:', manualExtras.customerName);

    const uploadData = {
      file: req.file,
      insurer,
      manualExtras
    };

    const result = await storageService.savePDFUpload(uploadData);
    
    // Automatically trigger OpenAI processing after upload
    if (result.success) {
      try {
        console.log('🔄 Auto-triggering OpenAI processing...');
        const processResult = await storageService.processPDF(result.data.uploadId);
        
        if (!processResult.success && processResult.data?.status === 'INSURER_MISMATCH') {
          console.log('⚠️ Insurer mismatch detected, but allowing upload to continue');
          // Log the mismatch but don't fail the upload
          console.log(`Mismatch details: ${processResult.error}`);
        } else {
          console.log('✅ OpenAI processing completed automatically');
        }
      } catch (processError) {
        console.error('⚠️ Auto OpenAI processing failed:', processError.message);
        // Don't fail the upload if OpenAI fails
      }
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to upload PDF'
    });
  }
});

// Process PDF with OpenAI
router.post('/:uploadId/process', authenticateToken, requireOps, async (req, res) => {
  try {
    const result = await storageService.processPDF(req.params.uploadId);
    res.json(result);
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to process PDF'
    });
  }
});

// Get upload status
router.get('/:uploadId/status', authenticateToken, requireOps, async (req, res) => {
  try {
    const upload = await storageService.getUploadStatus(req.params.uploadId);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get upload status'
    });
  }
});

// Get upload by ID
router.get('/:uploadId', authenticateToken, requireOps, async (req, res) => {
  try {
    const upload = await storageService.getUploadStatus(req.params.uploadId);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get upload'
    });
  }
});

// Get all uploads
router.get('/', authenticateToken, requireOps, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(
      'SELECT * FROM pdf_uploads ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get uploads'
    });
  }
});

// Confirm upload as policy
router.post('/:uploadId/confirm', authenticateToken, requireOps, async (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    const { editedData } = req.body;
    
    console.log('🔍 Confirming upload:', uploadId);
    console.log('🔍 Edited data received:', JSON.stringify(editedData, null, 2));
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate upload exists and is in REVIEW status
    const upload = await storageService.getUploadStatus(uploadId);
    
    if (!upload) {
      console.log('❌ Upload not found:', uploadId);
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }
    
    console.log('🔍 Upload status:', upload.status);
    if (upload.status !== 'REVIEW' && upload.status !== 'UPLOADED') {
      console.log('❌ Invalid upload status:', upload.status);
      return res.status(400).json({
        success: false,
        error: 'Upload must be in REVIEW or UPLOADED status to confirm'
      });
    }
    
    // Create policy data - use edited data if provided, otherwise original
    let policyData;
    
    if (editedData && editedData.pdfData && editedData.manualExtras) {
      // Use edited data with field mapping
      policyData = {
        ...editedData.pdfData,
        ...editedData.manualExtras,
        caller_name: editedData.manualExtras.caller_name || editedData.manualExtras.callerName || '', // Map callerName to caller_name
        customer_email: editedData.manualExtras.customerEmail || editedData.manualExtras.customer_email || '',
        ops_executive: editedData.manualExtras.opsExecutive || editedData.manualExtras.ops_executive || '',
        customer_name: editedData.manualExtras.customer_name || editedData.manualExtras.customerName || editedData.pdfData.customer_name || '', // Map customer_name from manual extras or PDF data
        payment_method: editedData.manualExtras.paymentMethod || editedData.manualExtras.payment_method || 'INSURER', // Map paymentMethod to payment_method
        payment_sub_method: editedData.manualExtras.paymentSubMethod || editedData.manualExtras.payment_sub_method || '', // Map paymentSubMethod to payment_sub_method
        customer_cheque_no: editedData.manualExtras.customerChequeNo || editedData.manualExtras.customer_cheque_no || '', // Map customerChequeNo to customer_cheque_no
        our_cheque_no: editedData.manualExtras.ourChequeNo || editedData.manualExtras.our_cheque_no || '', // Map ourChequeNo to our_cheque_no
        customer_paid: editedData.manualExtras.customerPaid || editedData.manualExtras.customer_paid || '', // Map customerPaid to customer_paid
        total_od: editedData.manualExtras.totalOd || editedData.manualExtras.total_od || editedData.pdfData?.total_od || 0, // Map totalOd to total_od
        
        // ✅ ADD: Cashback calculations
        cashback_percentage: (editedData.manualExtras?.cashback && editedData.pdfData?.total_premium) ? 
          ((parseFloat(editedData.manualExtras.cashback) / parseFloat(editedData.pdfData.total_premium)) * 100) : 0,
        cashback_amount: parseFloat(editedData.manualExtras?.cashback) || 0,
        brokerage: parseFloat(editedData.manualExtras?.brokerage) || 0,
        
        // customer_name now comes from PDF extracted data (editedData.pdfData.customer_name)
        source: 'MOTOR_PDF_UPLOAD',
        s3_key: upload.s3_key,
        confidence_score: upload.extracted_data?.extracted_data?.confidence_score || 0.8
      };
      
      console.log('✅ Using edited data for policy creation');
      console.log('🔍 Cashback data being processed:', {
        cashback: editedData.manualExtras?.cashback,
        total_premium: editedData.pdfData?.total_premium,
        cashback_percentage: policyData.cashback_percentage,
        cashback_amount: policyData.cashback_amount,
        brokerage: policyData.brokerage
      });
    } else {
      // Fallback to original data with field mapping
      policyData = {
        ...upload.extracted_data.extracted_data,
        ...upload.extracted_data.manual_extras,
        caller_name: upload.extracted_data.manual_extras?.caller_name || upload.extracted_data.manual_extras?.callerName || '', // Map callerName to caller_name
        customer_name: upload.extracted_data.manual_extras?.customer_name || upload.extracted_data.manual_extras?.customerName || upload.extracted_data.extracted_data?.customer_name || '', // Map customer_name from manual extras or PDF data
        total_od: upload.extracted_data.manual_extras?.totalOd || upload.extracted_data.manual_extras?.total_od || upload.extracted_data.extracted_data?.total_od || 0, // Map totalOd to total_od
        
        // ✅ ADD: Cashback calculations for fallback case
        cashback_percentage: (upload.extracted_data.manual_extras?.cashback && upload.extracted_data.extracted_data?.total_premium) ? 
          ((parseFloat(upload.extracted_data.manual_extras.cashback) / parseFloat(upload.extracted_data.extracted_data.total_premium)) * 100) : 0,
        cashback_amount: parseFloat(upload.extracted_data.manual_extras?.cashback) || 0,
        brokerage: parseFloat(upload.extracted_data.manual_extras?.brokerage) || 0,
        
        // customer_name now comes from PDF extracted data (upload.extracted_data.extracted_data.customer_name)
        source: 'MOTOR_PDF_UPLOAD',
        s3_key: upload.s3_key
      };
      
      console.log('⚠️ Using original data for policy creation (no edited data provided)');
      console.log('🔍 Cashback data being processed (fallback):', {
        cashback: upload.extracted_data.manual_extras?.cashback,
        total_premium: upload.extracted_data.extracted_data?.total_premium,
        cashback_percentage: policyData.cashback_percentage,
        cashback_amount: policyData.cashback_amount,
        brokerage: policyData.brokerage
      });
    }
    
    // Validate policy data
    console.log('🔍 Policy data validation:', {
      policy_number: policyData.policy_number,
      vehicle_number: policyData.vehicle_number,
      caller_name: policyData.caller_name,
      customer_name: policyData.customer_name
    });
    
    if (!policyData.policy_number || !policyData.vehicle_number) {
      console.log('❌ Missing required fields:', {
        policy_number: !!policyData.policy_number,
        vehicle_number: !!policyData.vehicle_number
      });
      return res.status(400).json({
        success: false,
        error: 'Policy number and vehicle number are required'
      });
    }

    // Validate customer email format if provided
    if (policyData.customer_email && policyData.customer_email.trim() !== '') {
      const trimmedEmail = policyData.customer_email.trim();
      if (trimmedEmail.toLowerCase() !== 'n/a') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({
            success: false,
            error: 'Email must be a valid email address or "N/A"'
          });
        }
      }
    }

    // Validate telecaller exists in database
    if (policyData.caller_name) {
      console.log('🔍 Checking telecaller:', policyData.caller_name);
      try {
        const telecallerExists = await query(
          'SELECT id FROM telecallers WHERE name = $1 AND is_active = true',
          [policyData.caller_name]
        );
        console.log('🔍 Telecaller check result:', telecallerExists.rows.length);
        if (telecallerExists.rows.length === 0) {
          console.log('❌ Telecaller not found:', policyData.caller_name);
          return res.status(400).json({
            success: false,
            error: `Telecaller "${policyData.caller_name}" does not exist or is inactive. Please select a valid telecaller or add them to the system first.`
          });
        }
      } catch (dbError) {
        console.error('❌ Database error checking telecaller:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database error while validating telecaller'
        });
      }
    }
    
    // Check for duplicate policy number before saving
    console.log('🔍 Checking for duplicate policy number:', policyData.policy_number);
    try {
      const isDuplicate = await storageService.checkPolicyNumberExists(policyData.policy_number);
      console.log('🔍 Duplicate check result:', isDuplicate);
      if (isDuplicate) {
        console.log('❌ Duplicate policy number found:', policyData.policy_number);
        return res.status(400).json({
          success: false,
          error: `Policy number '${policyData.policy_number}' already exists. Please use a different policy number.`
        });
      }
    } catch (duplicateError) {
      console.error('❌ Error checking duplicate policy number:', duplicateError);
      return res.status(500).json({
        success: false,
        error: 'Database error while checking for duplicate policy number'
      });
    }
    
    // Save policy with the determined data
    const result = await storageService.savePolicy(policyData);
    
    if (result.success) {
      // Update upload status
      await storageService.updateUploadStatus(uploadId, 'COMPLETED');
      
      console.log('✅ Policy created successfully with data source:', editedData ? 'EDITED' : 'ORIGINAL');
      
      // Send immediate response
      res.json({
        success: true,
        data: result.data
      });
      
      // Move notifications to background processing
      setImmediate(async () => {
        try {
          // Email notification (runs in background)
          const customerEmail = policyData.customer_email || policyData.customerEmail;
          if (customerEmail) {
            console.log('📧 Sending policy PDF to customer (background):', customerEmail);
            
            const emailResult = await emailService.sendPolicyPDF(
              customerEmail,
              policyData,
              upload.s3_key,  // Original PDF S3 key
              upload.filename  // Original PDF filename
            );
            
            if (emailResult.success) {
              console.log('✅ PDF sent to customer successfully (background):', emailResult.messageId);
            } else {
              console.error('⚠️ Email sending failed (background):', emailResult.error);
            }
          } else {
            console.log('⚠️ No customer email found, skipping email sending');
          }
          
          // WhatsApp notification (runs in background)
          const customerPhone = policyData.customer_phone || policyData.customerPhone || policyData.mobile || policyData.Mobile;
          if (customerPhone) {
            console.log('📱 Sending policy PDF via WhatsApp to customer (background):', customerPhone);
            
            const whatsappResult = await whatsappService.sendPolicyWhatsApp(
              customerPhone,
              policyData,
              upload.s3_key,  // Original PDF S3 key
              upload.filename  // Original PDF filename
            );
            
            if (whatsappResult.success) {
              console.log('✅ PDF sent via WhatsApp successfully (background):', whatsappResult.textMessageId, whatsappResult.documentMessageId);
            } else {
              console.error('⚠️ WhatsApp sending failed (background):', whatsappResult.error);
            }
          } else {
            console.log('⚠️ No customer phone found, skipping WhatsApp sending');
          }
          
          console.log('✅ Background notifications completed');
        } catch (error) {
          console.error('❌ Background notifications failed:', error);
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Confirm upload error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      uploadId: req.params.uploadId
    });
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to confirm upload'
    });
  }
});

// Get upload for review (with proper structure)
router.get('/:uploadId/review', authenticateToken, requireOps, async (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    
    const upload = await storageService.getUploadForReview(uploadId);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }
    
    res.json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Get upload for review error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get upload for review'
    });
  }
});

// Upload individual document (Aadhaar, PAN, RC)
router.post('/document', authenticateToken, requireOps, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Document file is required'
      });
    }

    const { documentType, insurer, policyNumber, pdf_upload_id } = req.body;
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    if (!insurer) {
      return res.status(400).json({
        success: false,
        error: 'Insurer is required'
      });
    }

    const uploadData = {
      file: req.file,
      insurer,
      documentType,
      policyNumber: policyNumber || 'pending',
      pdf_upload_id
    };

    const result = await storageService.saveAdditionalDocument(uploadData);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to upload document'
    });
  }
});

// Get documents by policy number
router.get('/documents/:policyNumber', authenticateToken, requireOps, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    
    const result = await storageService.getPolicyDocuments(policyNumber);
    
    res.json(result);
  } catch (error) {
    console.error('Get policy documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get policy documents'
    });
  }
});

// Get S3 URL for document download
router.get('/s3-url/:s3Key', authenticateToken, requireOps, async (req, res) => {
  try {
    const { s3Key } = req.params;
    
    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: 'S3 key is required'
      });
    }
    
    const { getS3Url } = require('../config/aws');
    const url = await getS3Url(s3Key);
    
    res.json({
      success: true,
      url: url
    });
  } catch (error) {
    console.error('Get S3 URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get S3 URL'
    });
  }
});

module.exports = router;

