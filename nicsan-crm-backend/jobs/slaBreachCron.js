/**
 * SLA Breach Cron Job
 * Runs every 2 minutes to detect tasks past their deadline.
 * Marks them as SLA_BREACHED so admin/founder can see who breached.
 * Admin manually reassigns via Task Engine Dashboard if needed.
 */
const cron = require('node-cron');
const { query } = require('../config/database');

class SlaBreachCron {
  constructor() {
    this.task = null;
  }

  start() {
    this.task = cron.schedule('*/2 * * * *', async () => {
      await this.processSlaBreaches();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    console.log('✅ SLA Breach Cron started (runs every 2 minutes)');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async processSlaBreaches() {
    try {
      const result = await query(`
        UPDATE tasks
        SET status = 'SLA_BREACHED', updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('ASSIGNED', 'IN_PROGRESS')
          AND sla_deadline IS NOT NULL
          AND sla_deadline < NOW()
        RETURNING id, customer_name, assigned_to
      `);

      if (result.rows.length > 0) {
        console.log(`⚠️ SLA Breach: marked ${result.rows.length} task(s) as SLA_BREACHED`, result.rows.map(r => `#${r.id}`));
      }
    } catch (err) {
      console.error('❌ SLA Breach Cron error:', err);
    }
  }
}

const scheduler = new SlaBreachCron();
module.exports = scheduler;
