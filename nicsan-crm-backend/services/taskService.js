/**
 * Task service: create, list, get, start, complete tasks; task document uploads to S3.
 */
const { query } = require('../config/database');
const { uploadToS3, getS3Url } = require('../config/aws');
const { withPrefix } = require('../utils/s3Prefix');
const assignmentEngine = require('./assignmentEngine');
const websocketService = require('./websocketService');

const DOCUMENT_TYPES = ['PREVIOUS_POLICY', 'RC', 'KYC', 'QUOTE', 'ISSUED_POLICY'];

function sanitizeForS3Path(name) {
  return (name || 'unknown')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 50) || 'unknown';
}

function toTaskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    telecaller_id: row.telecaller_id,
    assigned_to: row.assigned_to,
    customer_name: row.customer_name,
    vehicle_no: row.vehicle_no,
    company: row.company,
    action_type: row.action_type,
    policy_type: row.policy_type,
    product_type: row.product_type,
    phone: row.phone,
    email: row.email,
    cashback: row.cashback != null ? parseFloat(row.cashback) : null,
    status: row.status,
    sla_deadline: row.sla_deadline,
    assigned_at: row.assigned_at,
    first_pickup_at: row.first_pickup_at,
    completed_at: row.completed_at,
    response_time_ms: row.response_time_ms,
    resolution_time_ms: row.resolution_time_ms,
    reassignment_count: row.reassignment_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Validate create-task payload. Throws with message if invalid.
 */
function validateCreateTask(data, documentTypesPresent) {
  const { customer_name, vehicle_no, company, action_type, policy_type, product_type } = data;
  if (!customer_name || !vehicle_no || !company || !action_type || !policy_type || !product_type) {
    throw new Error('customer_name, vehicle_no, company, action_type, policy_type, and product_type are required.');
  }
  if (!['QUOTE', 'ISSUE_POLICY'].includes(action_type)) {
    throw new Error('action_type must be QUOTE or ISSUE_POLICY.');
  }
  if (!['RENEWAL', 'ROLLOVER'].includes(policy_type)) {
    throw new Error('policy_type must be RENEWAL or ROLLOVER.');
  }
  const hasPrevOrRc = documentTypesPresent.includes('PREVIOUS_POLICY') || documentTypesPresent.includes('RC');
  if (!hasPrevOrRc) {
    throw new Error('At least one of PREVIOUS_POLICY or RC document is required.');
  }
  if (action_type === 'ISSUE_POLICY') {
    const { phone, email, cashback } = data;
    if (!phone || !email) {
      throw new Error('phone and email are required for ISSUE_POLICY.');
    }
    if (cashback == null || cashback === '' || (typeof cashback === 'number' && isNaN(cashback))) {
      throw new Error('cashback is required for ISSUE_POLICY.');
    }
    if (!documentTypesPresent.includes('KYC')) {
      throw new Error('KYC document is required for ISSUE_POLICY.');
    }
  }
}

/**
 * Create task + optional documents; run assignment; emit task_assigned.
 * @param {number} telecallerId - user id of telecaller
 * @param {Object} data - task fields
 * @param {Array<{ type: string, file: { buffer, mimetype, originalname } }>} documents
 * @returns {Promise<{ success: boolean, data: object }>}
 */
async function createTask(telecallerId, data, documents = []) {
  const documentTypesPresent = documents.map(d => d.type).filter(Boolean);
  validateCreateTask(data, documentTypesPresent);

  const {
    customer_name, vehicle_no, company, action_type, policy_type, product_type,
    phone, email, cashback
  } = data;

  const insertResult = await query(
    `INSERT INTO tasks (
      telecaller_id, customer_name, vehicle_no, company, action_type, policy_type, product_type,
      phone, email, cashback, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
    RETURNING id, telecaller_id, assigned_to, customer_name, vehicle_no, company, action_type, policy_type, product_type,
      phone, email, cashback, status, sla_deadline, assigned_at, first_pickup_at, completed_at,
      response_time_ms, resolution_time_ms, reassignment_count, created_at, updated_at`,
    [
      telecallerId, customer_name, vehicle_no, company, action_type, policy_type, product_type,
      phone || null, email || null, cashback != null && cashback !== '' ? cashback : null
    ]
  );
  const task = insertResult.rows[0];
  const taskId = task.id;

  const safeCustomer = sanitizeForS3Path(customer_name);
  for (const doc of documents) {
    if (!doc.file || !doc.type || !DOCUMENT_TYPES.includes(doc.type)) continue;
    const key = withPrefix(`tasks/${safeCustomer}/${taskId}_${doc.type}_${Date.now()}.pdf`);
    await uploadToS3(
      { buffer: doc.file.buffer, mimetype: doc.file.mimetype || 'application/pdf', originalname: doc.file.originalname || 'doc.pdf' },
      key
    );
    await query(
      `INSERT INTO task_documents (task_id, document_type, s3_key, uploaded_by) VALUES ($1, $2, $3, $4)`,
      [taskId, doc.type, key, telecallerId]
    );
  }

  const assignment = await assignmentEngine.assignTask(taskId, {
    action_type: task.action_type,
    company: task.company
  });

  let finalTask = toTaskRow(task);
  if (assignment) {
    finalTask.assigned_to = assignment.assigned_to;
    finalTask.assigned_at = assignment.assigned_at;
    finalTask.sla_deadline = assignment.sla_deadline;
    finalTask.status = 'ASSIGNED';
    try {
      websocketService.broadcastToUser(assignment.assigned_to, 'task_assigned', {
        taskId,
        task: { ...finalTask, executiveName: assignment.executiveName },
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('task_assigned emit failed:', e.message);
    }
  }

  const rows = await query(
    `SELECT id, telecaller_id, assigned_to, customer_name, vehicle_no, company, action_type, policy_type, product_type,
      phone, email, cashback, status, sla_deadline, assigned_at, first_pickup_at, completed_at,
      response_time_ms, resolution_time_ms, reassignment_count, created_at, updated_at
     FROM tasks WHERE id = $1`,
    [taskId]
  );
  finalTask = toTaskRow(rows.rows[0]);

  return { success: true, data: finalTask };
}

/**
 * List tasks created by telecaller.
 */
async function getMyRequests(telecallerId) {
  const result = await query(
    `SELECT t.id, t.telecaller_id, t.assigned_to, t.customer_name, t.vehicle_no, t.company, t.action_type, t.policy_type, t.product_type,
      t.phone, t.email, t.cashback, t.status, t.sla_deadline, t.assigned_at, t.first_pickup_at, t.completed_at,
      t.response_time_ms, t.resolution_time_ms, t.reassignment_count, t.created_at, t.updated_at,
      u.name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.telecaller_id = $1
     ORDER BY t.created_at DESC`,
    [telecallerId]
  );
  return result.rows.map(r => ({
    ...toTaskRow(r),
    assigned_to_name: r.assigned_to_name || null
  }));
}

/**
 * List tasks assigned to executive (not completed/cancelled).
 */
async function getAssigned(executiveId) {
  const result = await query(
    `SELECT t.id, t.telecaller_id, t.assigned_to, t.customer_name, t.vehicle_no, t.company, t.action_type, t.policy_type, t.product_type,
      t.phone, t.email, t.cashback, t.status, t.sla_deadline, t.assigned_at, t.first_pickup_at, t.completed_at,
      t.response_time_ms, t.resolution_time_ms, t.reassignment_count, t.created_at, t.updated_at
     FROM tasks t
     WHERE t.assigned_to = $1 AND t.status IN ('ASSIGNED', 'IN_PROGRESS')
     ORDER BY t.assigned_at ASC`,
    [executiveId]
  );
  return result.rows.map(toTaskRow);
}

/**
 * Get task by id; include document list with download URLs.
 */
async function getById(taskId, requestingUserId, requestingRole) {
  const taskResult = await query(
    `SELECT t.id, t.telecaller_id, t.assigned_to, t.customer_name, t.vehicle_no, t.company, t.action_type, t.policy_type, t.product_type,
      t.phone, t.email, t.cashback, t.status, t.sla_deadline, t.assigned_at, t.first_pickup_at, t.completed_at,
      t.response_time_ms, t.resolution_time_ms, t.reassignment_count, t.created_at, t.updated_at,
      u1.name AS telecaller_name, u2.name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users u1 ON u1.id = t.telecaller_id
     LEFT JOIN users u2 ON u2.id = t.assigned_to
     WHERE t.id = $1`,
    [taskId]
  );
  if (taskResult.rows.length === 0) return null;
  const task = taskResult.rows[0];
  const allowed =
    task.telecaller_id === requestingUserId ||
    task.assigned_to === requestingUserId ||
    ['founder', 'admin', 'ops'].includes(requestingRole);
  if (!allowed) return null;

  const docResult = await query(
    `SELECT id, task_id, document_type, s3_key, uploaded_by, uploaded_at FROM task_documents WHERE task_id = $1 ORDER BY uploaded_at`,
    [taskId]
  );
  const docs = docResult.rows;
  const docsWithUrls = await Promise.all(
    docs.map(async (d) => {
      let download_url = null;
      if (d.s3_key) {
        try {
          download_url = await getS3Url(d.s3_key);
        } catch (e) {
          console.warn('S3 signed URL failed for', d.s3_key, e.message);
        }
      }
      return {
        id: d.id,
        document_type: d.document_type,
        s3_key: d.s3_key,
        uploaded_at: d.uploaded_at,
        download_url
      };
    })
  );

  return {
    ...toTaskRow(task),
    telecaller_name: task.telecaller_name,
    assigned_to_name: task.assigned_to_name,
    documents: docsWithUrls
  };
}

/**
 * Start task (executive picks up).
 */
async function startTask(taskId, executiveId) {
  const result = await query(
    `UPDATE tasks SET status = 'IN_PROGRESS', first_pickup_at = COALESCE(first_pickup_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND assigned_to = $2 AND status = 'ASSIGNED'
     RETURNING *`,
    [taskId, executiveId]
  );
  if (result.rows.length === 0) return null;
  const task = result.rows[0];
  if (task.assigned_at) {
    const responseTimeMs = Date.now() - new Date(task.assigned_at).getTime();
    await query(`UPDATE tasks SET response_time_ms = $1 WHERE id = $2`, [responseTimeMs, taskId]);
  }
  return toTaskRow({ ...task, response_time_ms: task.response_time_ms });
}

/**
 * Complete task: add QUOTE or ISSUED_POLICY doc, set status COMPLETED, notify telecaller.
 */
async function completeTask(taskId, executiveId, documentType, file) {
  if (!['QUOTE', 'ISSUED_POLICY'].includes(documentType)) {
    throw new Error('documentType must be QUOTE or ISSUED_POLICY.');
  }
  const taskResult = await query(
    `SELECT id, action_type, telecaller_id, assigned_to, status, customer_name FROM tasks WHERE id = $1 AND assigned_to = $2`,
    [taskId, executiveId]
  );
  if (taskResult.rows.length === 0) throw new Error('Task not found or not assigned to you.');
  const task = taskResult.rows[0];
  if (task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS') {
    throw new Error('Task is not in a completable state.');
  }
  const validDocForAction =
    (task.action_type === 'QUOTE' && documentType === 'QUOTE') ||
    (task.action_type === 'ISSUE_POLICY' && documentType === 'ISSUED_POLICY');
  if (!validDocForAction) {
    throw new Error(`${task.action_type} task requires ${task.action_type === 'QUOTE' ? 'QUOTE' : 'ISSUED_POLICY'} document.`);
  }

  if (file && file.buffer) {
    const safeCustomer = sanitizeForS3Path(task.customer_name);
    const key = withPrefix(`tasks/${safeCustomer}/${taskId}_${documentType}_${Date.now()}.pdf`);
    await uploadToS3(
      { buffer: file.buffer, mimetype: file.mimetype || 'application/pdf', originalname: file.originalname || 'doc.pdf' },
      key
    );
    await query(
      `INSERT INTO task_documents (task_id, document_type, s3_key, uploaded_by) VALUES ($1, $2, $3, $4)`,
      [taskId, documentType, key, executiveId]
    );
  }

  const completed_at = new Date();
  const assignedAtResult = await query(`SELECT assigned_at FROM tasks WHERE id = $1`, [taskId]);
  const assigned_at = assignedAtResult.rows[0]?.assigned_at;
  const resolution_time_ms = assigned_at ? completed_at.getTime() - new Date(assigned_at).getTime() : null;

  await query(
    `UPDATE tasks SET status = 'COMPLETED', completed_at = $1, resolution_time_ms = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
    [completed_at, resolution_time_ms, taskId]
  );

  const updated = await query(
    `SELECT * FROM tasks WHERE id = $1`,
    [taskId]
  );
  const taskRow = toTaskRow(updated.rows[0]);
  try {
    websocketService.broadcastToUser(task.telecaller_id, 'task_completed', {
      taskId,
      task: taskRow,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('task_completed emit failed:', e.message);
  }
  return { success: true, data: taskRow };
}

/**
 * Get current executive status for the logged-in ops user.
 */
async function getExecutiveStatus(userId) {
  const result = await query(
    `SELECT status FROM users WHERE id = $1 AND role = 'ops'`,
    [userId]
  );
  if (result.rows.length === 0) return { success: true, data: { status: 'OFFLINE' } };
  const status = result.rows[0].status || 'OFFLINE';
  const valid = ['AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE'];
  const normalized = valid.includes(status) ? status : 'OFFLINE';
  return { success: true, data: { status: normalized } };
}

/**
 * Update executive status (AVAILABLE, BUSY, BREAK, OFFLINE).
 */
async function updateExecutiveStatus(userId, status) {
  const valid = ['AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE'];
  if (!valid.includes(status)) {
    throw new Error('status must be one of: AVAILABLE, BUSY, BREAK, OFFLINE.');
  }
  await query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = 'ops'`,
    [status, userId]
  );
  return { success: true, status };
}

/**
 * Reassign task to another executive (founder/admin override).
 * @param {number} taskId
 * @param {number} executiveId - target ops user id
 * @returns {Promise<{ success: boolean, data: object }>}
 */
async function reassignTask(taskId, executiveId) {
  const execId = parseInt(executiveId, 10);
  if (!execId || isNaN(execId)) {
    throw new Error('executive_id is required and must be a valid number.');
  }

  const taskResult = await query(
    `SELECT id, action_type, assigned_to, status FROM tasks WHERE id = $1`,
    [taskId]
  );
  if (taskResult.rows.length === 0) {
    throw new Error('Task not found.');
  }
  const task = taskResult.rows[0];
  const reassignable = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SLA_BREACHED'];
  if (!reassignable.includes(task.status)) {
    throw new Error(`Task cannot be reassigned (status: ${task.status}).`);
  }

  const execResult = await query(
    `SELECT id, name FROM users WHERE id = $1 AND role = 'ops' AND (is_active IS NULL OR is_active = true)`,
    [execId]
  );
  if (execResult.rows.length === 0) {
    throw new Error('Target executive not found or is not an active ops user.');
  }
  const executiveName = execResult.rows[0].name;

  const sla_deadline = assignmentEngine.getSlaDeadline(task.action_type);
  const assigned_at = new Date();

  await query(
    `UPDATE tasks SET assigned_to = $1, assigned_at = $2, sla_deadline = $3, status = 'ASSIGNED',
      reassignment_count = COALESCE(reassignment_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [execId, assigned_at, sla_deadline, taskId]
  );

  const updated = await query(
    `SELECT * FROM tasks WHERE id = $1`,
    [taskId]
  );
  const taskRow = toTaskRow(updated.rows[0]);

  try {
    websocketService.broadcastToUser(execId, 'task_assigned', {
      taskId,
      task: { ...taskRow, executiveName },
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('task_assigned emit failed:', e.message);
  }

  return { success: true, data: taskRow };
}

/**
 * Summary for admin/founder dashboard (today's tasks only).
 */
async function getTaskSummary() {
  const [counts, recent] = await Promise.all([
    query(
      `SELECT status, COUNT(*) AS count FROM tasks WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day' GROUP BY status`
    ),
    query(
      `SELECT t.id, t.customer_name, t.vehicle_no, t.company, t.action_type, t.status, t.created_at, u.name AS assigned_to_name
       FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.created_at >= CURRENT_DATE AND t.created_at < CURRENT_DATE + INTERVAL '1 day'
       ORDER BY t.created_at DESC LIMIT 50`
    )
  ]);
  const byStatus = {};
  counts.rows.forEach(r => { byStatus[r.status] = parseInt(r.count, 10); });
  const total = counts.rows.reduce((s, r) => s + parseInt(r.count, 10), 0);
  const pending = (byStatus.PENDING || 0) + (byStatus.ASSIGNED || 0) + (byStatus.IN_PROGRESS || 0);
  const completed = byStatus.COMPLETED || 0;
  const slaBreached = byStatus.SLA_BREACHED || 0;
  const slaRate = total > 0 ? (completed / (completed + slaBreached || 1) * 100).toFixed(1) : 100;
  return {
    total,
    pending,
    completed,
    sla_breached: slaBreached,
    sla_compliance_percent: parseFloat(slaRate),
    by_status: byStatus,
    recent: recent.rows
  };
}

module.exports = {
  createTask,
  getMyRequests,
  getAssigned,
  getById,
  getExecutiveStatus,
  startTask,
  completeTask,
  reassignTask,
  updateExecutiveStatus,
  getTaskSummary,
  toTaskRow,
  DOCUMENT_TYPES
};
