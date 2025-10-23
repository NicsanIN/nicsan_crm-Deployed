const cron = require('node-cron');
const axios = require('axios');
const emailService = require('../services/emailService');
const { query } = require('../config/database');

/**
 * Daily OD Report Scheduler
 * Runs every day at 9:00 AM IST
 */
class DailyReportScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
  }

  /**
   * Start the daily report scheduler
   */
  start() {
    console.log('🕘 Starting Daily OD Report Scheduler...');
    
    // Schedule daily report at 9:00 AM IST (3:30 AM UTC)
    cron.schedule('30 3 * * *', async () => {
      await this.sendDailyReport();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Also schedule a test run every hour for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      cron.schedule('0 * * * *', async () => {
        console.log('🧪 Development mode: Hourly test run');
        // Uncomment the line below to test daily reports in development
        // await this.sendDailyReport();
      });
    }

    console.log('✅ Daily OD Report Scheduler started');
    console.log('📅 Next report will be sent at 9:00 AM IST');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('🛑 Stopping Daily OD Report Scheduler...');
    cron.destroy();
    console.log('✅ Daily OD Report Scheduler stopped');
  }

  /**
   * Send daily OD report
   */
  async sendDailyReport() {
    if (this.isRunning) {
      console.log('⏳ Daily report is already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();

    try {
      console.log('📊 Generating daily OD report...');
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Generate report data
      const reportData = await this.generateReportData(today);
      
      if (reportData.summary.totalPolicies === 0) {
        console.log('📭 No policies found for today, skipping email report');
        return;
      }

      // Send email
      console.log('📧 Sending daily OD report email...');
      const emailResult = await emailService.sendDailyODReport(reportData);
      
      if (emailResult.success) {
        console.log('✅ Daily OD report sent successfully');
        console.log(`📬 Recipients: ${emailResult.recipients.join(', ')}`);
        console.log(`📧 Message ID: ${emailResult.messageId}`);
      } else {
        console.error('❌ Failed to send daily OD report:', emailResult.error);
      }

    } catch (error) {
      console.error('❌ Daily report generation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate report data for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Report data
   */
  async generateReportData(date) {
    try {
      console.log(`📊 Generating report data for date: ${date}`);
      
      // Query to get branch-wise, vehicle type-wise, rollover/renewal breakdown
      const reportQuery = `
        SELECT 
          COALESCE(branch, 'Unknown') as branch,
          COALESCE(vehicle_type, 'Unknown') as vehicle_type,
          COALESCE(rollover, 'Unknown') as rollover_status,
          COUNT(*) as policy_count,
          SUM(COALESCE(total_od, 0)) as total_od_amount,
          SUM(COALESCE(total_premium, 0)) as total_premium_amount
        FROM policies 
        WHERE DATE(created_at) = $1
        GROUP BY branch, vehicle_type, rollover
        ORDER BY branch, vehicle_type, rollover_status
      `;
      
      const result = await query(reportQuery, [date]);
      
      // Get summary totals
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_policies,
          SUM(COALESCE(total_od, 0)) as total_od,
          SUM(COALESCE(total_premium, 0)) as total_premium,
          COUNT(CASE WHEN rollover = 'Rollover' THEN 1 END) as rollover_count,
          COUNT(CASE WHEN rollover = 'Renewal' THEN 1 END) as renewal_count,
          SUM(CASE WHEN rollover = 'Rollover' THEN COALESCE(total_od, 0) ELSE 0 END) as rollover_od,
          SUM(CASE WHEN rollover = 'Renewal' THEN COALESCE(total_od, 0) ELSE 0 END) as renewal_od
        FROM policies 
        WHERE DATE(created_at) = $1
      `;
      
      const summaryResult = await query(summaryQuery, [date]);
      const summary = summaryResult.rows[0];
      
      // Structure the data for email template
      const reportData = {
        date: date,
        summary: {
          totalPolicies: parseInt(summary.total_policies) || 0,
          totalOD: parseFloat(summary.total_od) || 0,
          totalPremium: parseFloat(summary.total_premium) || 0,
          rolloverCount: parseInt(summary.rollover_count) || 0,
          renewalCount: parseInt(summary.renewal_count) || 0,
          rolloverOD: parseFloat(summary.rollover_od) || 0,
          renewalOD: parseFloat(summary.renewal_od) || 0
        },
        branches: {}
      };
      
      // Group data by branch and vehicle type
      result.rows.forEach(row => {
        const branch = row.branch;
        const vehicleType = row.vehicle_type;
        const rolloverStatus = row.rollover_status;
        
        if (!reportData.branches[branch]) {
          reportData.branches[branch] = {
            branchName: branch,
            vehicleTypes: {},
            totalOD: 0,
            totalPolicies: 0
          };
        }
        
        if (!reportData.branches[branch].vehicleTypes[vehicleType]) {
          reportData.branches[branch].vehicleTypes[vehicleType] = {
            vehicleType: vehicleType,
            rollover: { amount: 0, count: 0 },
            renewal: { amount: 0, count: 0 }
          };
        }
        
        const amount = parseFloat(row.total_od_amount) || 0;
        const count = parseInt(row.policy_count) || 0;
        
        if (rolloverStatus === 'Rollover') {
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.amount = amount;
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.count = count;
        } else if (rolloverStatus === 'Renewal') {
          reportData.branches[branch].vehicleTypes[vehicleType].renewal.amount = amount;
          reportData.branches[branch].vehicleTypes[vehicleType].renewal.count = count;
        }
        
        reportData.branches[branch].totalOD += amount;
        reportData.branches[branch].totalPolicies += count;
      });
      
      // Convert branches object to array for easier template processing
      reportData.branches = Object.values(reportData.branches).map(branch => ({
        ...branch,
        vehicleTypes: Object.values(branch.vehicleTypes)
      }));
      
      // Get daily breakdown data (last 7 days)
      console.log('📊 Fetching daily breakdown data...');
      const dailyBreakdownQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(total_od) as total_od,
          COUNT(*) as policy_count,
          AVG(total_od) as avg_od_per_policy,
          MAX(total_od) as max_od,
          MIN(total_od) as min_od
        FROM policies 
        WHERE created_at >= $1 AND total_od > 0
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dailyResult = await query(dailyBreakdownQuery, [sevenDaysAgo.toISOString().split('T')[0]]);
      
      reportData.dailyBreakdown = dailyResult.rows.map(row => ({
        date: row.date,
        totalOD: parseFloat(row.total_od) || 0,
        policyCount: parseInt(row.policy_count) || 0,
        avgODPerPolicy: parseFloat(row.avg_od_per_policy) || 0,
        maxOD: parseFloat(row.max_od) || 0,
        minOD: parseFloat(row.min_od) || 0
      }));
      
      // Get monthly breakdown data (last 12 months)
      console.log('📊 Fetching monthly breakdown data...');
      const monthlyBreakdownQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(total_od) as total_od,
          COUNT(*) as policy_count,
          AVG(total_od) as avg_od_per_policy,
          MAX(total_od) as max_od,
          MIN(total_od) as min_od
        FROM policies 
        WHERE created_at >= $1 AND total_od > 0
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `;
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const monthlyResult = await query(monthlyBreakdownQuery, [twelveMonthsAgo.toISOString().split('T')[0]]);
      
      reportData.monthlyBreakdown = monthlyResult.rows.map(row => ({
        month: row.month,
        totalOD: parseFloat(row.total_od) || 0,
        policyCount: parseInt(row.policy_count) || 0,
        avgODPerPolicy: parseFloat(row.avg_od_per_policy) || 0,
        maxOD: parseFloat(row.max_od) || 0,
        minOD: parseFloat(row.min_od) || 0
      }));
      
      console.log(`✅ Report data generated successfully`);
      console.log(`📈 Summary: ${reportData.summary.totalPolicies} policies, ₹${reportData.summary.totalOD.toLocaleString('en-IN')} Total OD`);
      console.log(`📊 Daily breakdown: ${reportData.dailyBreakdown.length} days`);
      console.log(`📈 Monthly breakdown: ${reportData.monthlyBreakdown.length} months`);
      
      return reportData;
      
    } catch (error) {
      console.error('❌ Report data generation failed:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      founderEmails: [
        process.env.FOUNDER_EMAIL_1,
        process.env.FOUNDER_EMAIL_2
      ].filter(email => email && email.trim() !== '')
    };
  }

  /**
   * Test the daily report (manual trigger)
   */
  async testDailyReport() {
    console.log('🧪 Testing daily report...');
    await this.sendDailyReport();
  }
}

// Create singleton instance
const dailyReportScheduler = new DailyReportScheduler();

module.exports = dailyReportScheduler;
