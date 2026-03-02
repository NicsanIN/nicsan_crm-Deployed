/**
 * Task assignment engine: picks an available executive for a new task.
 * Filters by status=AVAILABLE, active_tasks < task_limit; sorts by load then avg_response_time.
 */
const { query } = require('../config/database');

const SLA_MINUTES_QUOTE = parseInt(process.env.TASK_SLA_MINUTES_QUOTE, 10) || 5;
const SLA_MINUTES_ISSUE = parseInt(process.env.TASK_SLA_MINUTES_ISSUE, 10) || 10;

/**
 * Find best available executive for the task.
 * @param {Object} task - { action_type: 'QUOTE'|'ISSUE_POLICY', company?: string }
 * @returns {Promise<{ userId: number, name: string } | null>}
 */
async function findAvailableExecutive(task) {
  try {
    const actionType = task.action_type || 'QUOTE';
    const company = (task.company || '').toUpperCase().replace(/\s+/g, '_');

    const sql = `
      WITH exec_stats AS (
        SELECT
          u.id,
          u.name,
          COALESCE(u.avg_response_time_ms, 999999) AS avg_rt,
          (SELECT COUNT(*) FROM tasks t
           WHERE t.assigned_to = u.id
             AND t.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_tasks
        FROM users u
        WHERE u.role = 'ops'
          AND (u.is_active IS NULL OR u.is_active = true)
          AND (u.status = 'AVAILABLE')
          AND COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status IN ('ASSIGNED', 'IN_PROGRESS')), 0) < COALESCE(u.task_limit, 10)
      )
      SELECT id, name
      FROM exec_stats
      ORDER BY active_tasks ASC, avg_rt ASC
      LIMIT 1
    `;
    const result = await query(sql, []);

    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return { userId: row.id, name: row.name };
  } catch (err) {
    console.error('❌ Assignment engine error:', err);
    return null;
  }
}

/**
 * Get SLA deadline from now.
 * @param {string} actionType - 'QUOTE' | 'ISSUE_POLICY'
 * @returns {Date}
 */
function getSlaDeadline(actionType) {
  const minutes = actionType === 'ISSUE_POLICY' ? SLA_MINUTES_ISSUE : SLA_MINUTES_QUOTE;
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

/**
 * Assign task to an available executive; returns assigned user id and sla_deadline, or null.
 * @param {number} taskId
 * @param {Object} task - { action_type, company }
 * @returns {Promise<{ assigned_to: number, assigned_at: Date, sla_deadline: Date, executiveName: string } | null>}
 */
async function assignTask(taskId, task) {
  const executive = await findAvailableExecutive(task);
  if (!executive) {
    return null;
  }
  const sla_deadline = getSlaDeadline(task.action_type);
  const assigned_at = new Date();

  await query(
    `UPDATE tasks SET assigned_to = $1, assigned_at = $2, sla_deadline = $3, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
    [executive.userId, assigned_at, sla_deadline, taskId]
  );

  return {
    assigned_to: executive.userId,
    assigned_at,
    sla_deadline,
    executiveName: executive.name
  };
}

module.exports = {
  findAvailableExecutive,
  getSlaDeadline,
  assignTask
};
