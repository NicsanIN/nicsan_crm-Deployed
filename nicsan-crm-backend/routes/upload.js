const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageService = require('../services/storageService');
const { authenticateToken, requireOps } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
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

    const uploadData = {
      file: req.file,
      insurer,
      manualExtras
    };

    const result = await storageService.savePDFUpload(uploadData);
    res.status(201).json(result);
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to upload PDF'
    });
  }
});

// Process PDF with Textract
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

module.exports = router;

