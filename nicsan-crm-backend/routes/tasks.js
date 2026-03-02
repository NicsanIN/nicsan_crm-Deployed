const express = require('express');
const router = express.Router();
const multer = require('multer');
const taskService = require('../services/taskService');
const { authenticateToken, requireTelecallerOrAdmin, requireOps, requireFounder, requireFounderOnly } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and image files allowed'), false);
  }
});

// Create task (telecaller or admin) - multipart: fields + previous_policy, rc, kyc
router.post(
  '/',
  authenticateToken,
  requireTelecallerOrAdmin,
  upload.fields([
    { name: 'previous_policy', maxCount: 1 },
    { name: 'rc', maxCount: 1 },
    { name: 'kyc', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const body = req.body;
      const docs = [];
      if (req.files?.previous_policy?.[0]) docs.push({ type: 'PREVIOUS_POLICY', file: req.files.previous_policy[0] });
      if (req.files?.rc?.[0]) docs.push({ type: 'RC', file: req.files.rc[0] });
      if (req.files?.kyc?.[0]) docs.push({ type: 'KYC', file: req.files.kyc[0] });

      const data = {
        customer_name: body.customer_name,
        vehicle_no: body.vehicle_no,
        company: body.company,
        action_type: body.action_type,
        policy_type: body.policy_type,
        product_type: body.product_type,
        phone: body.phone || null,
        email: body.email || null,
        cashback: body.cashback != null ? parseFloat(body.cashback) : null
      };
      const result = await taskService.createTask(userId, data, docs);
      res.status(201).json(result);
    } catch (err) {
      console.error('Create task error:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create task'
      });
    }
  }
);

// My requests (telecaller)
router.get('/my-requests', authenticateToken, requireTelecallerOrAdmin, async (req, res) => {
  try {
    const list = await taskService.getMyRequests(req.user.id);
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('My requests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Assigned to me (executive)
router.get('/assigned', authenticateToken, requireOps, async (req, res) => {
  try {
    const list = await taskService.getAssigned(req.user.id);
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Assigned tasks error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Task summary for founder dashboard (must be before /:id)
router.get('/summary', authenticateToken, requireFounder, async (req, res) => {
  try {
    const summary = await taskService.getTaskSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Task summary error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Executive: get my current status
router.get('/executives/me/status', authenticateToken, requireOps, async (req, res) => {
  try {
    const result = await taskService.getExecutiveStatus(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Get executive status error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to get status' });
  }
});

// Executive: set my availability (must be before /:id)
router.patch('/executives/me/status', authenticateToken, requireOps, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }
    const result = await taskService.updateExecutiveStatus(req.user.id, status);
    res.json(result);
  } catch (err) {
    console.error('Update executive status error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Reassign task (founder only)
router.patch('/:id/reassign', authenticateToken, requireFounderOnly, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { executive_id } = req.body;
    if (!executive_id) {
      return res.status(400).json({ success: false, error: 'executive_id is required' });
    }
    const result = await taskService.reassignTask(taskId, executive_id);
    res.json(result);
  } catch (err) {
    console.error('Reassign task error:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to reassign task' });
  }
});

// Task by id (with documents)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await taskService.getById(parseInt(req.params.id, 10), req.user.id, req.user.role);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start task (executive)
router.post('/:id/start', authenticateToken, requireOps, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const updated = await taskService.startTask(taskId, req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found or not assigned to you' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Start task error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Complete task (executive) - multipart: quote or issued_policy file
router.post(
  '/:id/complete',
  authenticateToken,
  requireOps,
  upload.single('document'),
  async (req, res) => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const documentType = req.body.document_type; // 'QUOTE' | 'ISSUED_POLICY'
      if (!documentType || !['QUOTE', 'ISSUED_POLICY'].includes(documentType)) {
        return res.status(400).json({ success: false, error: 'document_type must be QUOTE or ISSUED_POLICY' });
      }
      const result = await taskService.completeTask(taskId, req.user.id, documentType, req.file);
      res.json(result);
    } catch (err) {
      console.error('Complete task error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
