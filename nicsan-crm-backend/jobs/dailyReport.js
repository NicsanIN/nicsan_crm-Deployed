const cron = require('node-cron');
const axios = require('axios');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { query } = require('../config/database');

/**
 * Daily OD Report Scheduler
 * Runs every day at 10:30 AM IST
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
    
    // Schedule daily report at 10:30 AM IST (5:00 AM UTC)
    cron.schedule('0 5 * * *', async () => {
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
    console.log('📅 Next report will be sent at 10:30 AM IST');
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
      console.log('📊 Generating daily OD reports...');
      
      // Get yesterday's date for reporting (report on completed business day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      // 1. Send overall report to founders (existing functionality)
      console.log('📊 Generating overall report for founders...');
      const overallReportData = await this.generateReportData(yesterdayString);
      
      if (overallReportData.summary.totalPolicies > 0) {
        console.log('📧 Sending overall daily OD report to founders...');
        const founderEmailResult = await emailService.sendDailyODReport(overallReportData);
        
        if (founderEmailResult.success) {
          console.log('✅ Overall daily OD report sent to founders successfully');
          console.log(`📬 Founder Recipients: ${founderEmailResult.recipients.join(', ')}`);
          console.log(`📧 Founder Message ID: ${founderEmailResult.messageId}`);
        } else {
          console.error('❌ Failed to send overall daily OD report to founders:', founderEmailResult.error);
        }
      } else {
        console.log('📭 No policies found for yesterday, skipping founder email report');
      }

      // 2. Send branch-specific reports to branch heads (email)
      console.log('📊 Generating branch-specific reports...');
      await this.sendBranchReports(yesterdayString);

      // 3. Send overall WhatsApp report to founders
      if (overallReportData.summary.totalPolicies > 0) {
        console.log('📱 Sending overall WhatsApp report to founders...');
        await this.sendOverallReportWhatsApp(overallReportData);
      } else {
        console.log('📭 No policies found, skipping WhatsApp reports');
      }

      // 4. Send branch-wise WhatsApp reports to branch heads
      if (overallReportData.summary.totalPolicies > 0) {
        console.log('📱 Sending branch-wise WhatsApp reports to branch heads...');
        await this.sendBranchReportsWhatsApp(overallReportData);
      } else {
        console.log('📭 No policies found, skipping branch WhatsApp reports');
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
          COUNT(CASE WHEN UPPER(rollover) = 'ROLLOVER' THEN 1 END) as rollover_count,
          COUNT(CASE WHEN UPPER(rollover) = 'RENEWAL' THEN 1 END) as renewal_count,
          SUM(CASE WHEN UPPER(rollover) = 'ROLLOVER' THEN COALESCE(total_od, 0) ELSE 0 END) as rollover_od,
          SUM(CASE WHEN UPPER(rollover) = 'RENEWAL' THEN COALESCE(total_od, 0) ELSE 0 END) as renewal_od
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
        
        if (rolloverStatus && rolloverStatus.toUpperCase() === 'ROLLOVER') {
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.amount = amount;
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.count = count;
        } else if (rolloverStatus && rolloverStatus.toUpperCase() === 'RENEWAL') {
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
        process.env.FOUNDER_EMAIL_2,
        process.env.FOUNDER_EMAIL_3
      ].filter(email => email && email.trim() !== ''),
      founderWhatsAppNumbers: [
        process.env.FOUNDER_WHATSAPP_1,
        process.env.FOUNDER_WHATSAPP_2,
        process.env.FOUNDER_WHATSAPP_3
      ].filter(phone => phone && phone.trim() !== '')
    };
  }

  /**
   * Send branch-specific reports to branch heads
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async sendBranchReports(date) {
    try {
      const branches = ['MYSORE', 'BANASHANKARI', 'ADUGODI'];
      
      for (const branch of branches) {
        console.log(`📊 Generating ${branch} branch report...`);
        
        // Generate branch-specific report data
        const branchReportData = await this.generateBranchReportData(date, branch);
        
        if (branchReportData.summary.totalPolicies > 0) {
          console.log(`📧 Sending ${branch} branch report...`);
          const branchEmailResult = await emailService.sendBranchODReport(branchReportData, branch);
          
          if (branchEmailResult.success) {
            console.log(`✅ ${branch} branch report sent successfully`);
            console.log(`📬 ${branch} Recipients: ${branchEmailResult.recipients.join(', ')}`);
            console.log(`📧 ${branch} Message ID: ${branchEmailResult.messageId}`);
          } else {
            console.error(`❌ Failed to send ${branch} branch report:`, branchEmailResult.error);
          }
        } else {
          console.log(`📭 No policies found for ${branch} branch yesterday, skipping email report`);
        }
      }
      
    } catch (error) {
      console.error('❌ Branch reports generation failed:', error);
    }
  }

  /**
   * Generate branch-specific report data
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} branch - Branch name
   * @returns {Object} Branch-specific report data
   */
  async generateBranchReportData(date, branch) {
    try {
      console.log(`📊 Generating ${branch} branch report data for date: ${date}`);
      
      // Query to get branch-specific, vehicle type-wise, rollover-only breakdown
      const reportQuery = `
        SELECT 
          COALESCE(branch, 'Unknown') as branch,
          COALESCE(vehicle_type, 'Unknown') as vehicle_type,
          COALESCE(rollover, 'Unknown') as rollover_status,
          COUNT(*) as policy_count,
          SUM(COALESCE(total_od, 0)) as total_od_amount,
          SUM(COALESCE(total_premium, 0)) as total_premium_amount
        FROM policies 
        WHERE DATE(created_at) = $1 AND branch = $2 AND rollover = 'Rollover'
        GROUP BY branch, vehicle_type, rollover
        ORDER BY branch, vehicle_type, rollover_status
      `;
      
      const result = await query(reportQuery, [date, branch]);
      
      // Get branch-specific summary totals (rollover only)
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_policies,
          SUM(COALESCE(total_od, 0)) as total_od,
          SUM(COALESCE(total_premium, 0)) as total_premium,
          COUNT(CASE WHEN UPPER(rollover) = 'ROLLOVER' THEN 1 END) as rollover_count,
          SUM(CASE WHEN UPPER(rollover) = 'ROLLOVER' THEN COALESCE(total_od, 0) ELSE 0 END) as rollover_od
        FROM policies 
        WHERE DATE(created_at) = $1 AND branch = $2 AND UPPER(rollover) = 'ROLLOVER'
      `;
      
      const summaryResult = await query(summaryQuery, [date, branch]);
      const summary = summaryResult.rows[0];
      
      // Structure the data for email template (rollover only)
      const reportData = {
        date: date,
        branch: branch,
        summary: {
          totalPolicies: parseInt(summary.total_policies) || 0,
          totalOD: parseFloat(summary.total_od) || 0,
          totalPremium: parseFloat(summary.total_premium) || 0,
          rolloverCount: parseInt(summary.rollover_count) || 0,
          rolloverOD: parseFloat(summary.rollover_od) || 0
        },
        branches: {}
      };
      
      // Group data by vehicle type (only for this branch)
      result.rows.forEach(row => {
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
        
        if (rolloverStatus && rolloverStatus.toUpperCase() === 'ROLLOVER') {
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.amount = amount;
          reportData.branches[branch].vehicleTypes[vehicleType].rollover.count = count;
        } else if (rolloverStatus && rolloverStatus.toUpperCase() === 'RENEWAL') {
          reportData.branches[branch].vehicleTypes[vehicleType].renewal.amount = amount;
          reportData.branches[branch].vehicleTypes[vehicleType].renewal.count = count;
        }
        
        reportData.branches[branch].totalOD += amount;
        reportData.branches[branch].totalPolicies += count;
      });
      
      // Convert branches object to array for easier template processing
      reportData.branches = Object.values(reportData.branches).map(branchData => ({
        ...branchData,
        vehicleTypes: Object.values(branchData.vehicleTypes)
      }));
      
      // Get branch-specific daily breakdown data (last 7 days)
      console.log(`📊 Fetching ${branch} branch daily breakdown data...`);
      const dailyBreakdownQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(total_od) as total_od,
          COUNT(*) as policy_count,
          AVG(total_od) as avg_od_per_policy,
          MAX(total_od) as max_od,
          MIN(total_od) as min_od
        FROM policies 
        WHERE created_at >= $1 AND total_od > 0 AND branch = $2 AND UPPER(rollover) = 'ROLLOVER'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dailyResult = await query(dailyBreakdownQuery, [sevenDaysAgo.toISOString().split('T')[0], branch]);
      
      reportData.dailyBreakdown = dailyResult.rows.map(row => ({
        date: row.date,
        totalOD: parseFloat(row.total_od) || 0,
        policyCount: parseInt(row.policy_count) || 0,
        avgODPerPolicy: parseFloat(row.avg_od_per_policy) || 0,
        maxOD: parseFloat(row.max_od) || 0,
        minOD: parseFloat(row.min_od) || 0
      }));
      
      // Get branch-specific monthly breakdown data (last 12 months)
      console.log(`📊 Fetching ${branch} branch monthly breakdown data...`);
      const monthlyBreakdownQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(total_od) as total_od,
          COUNT(*) as policy_count,
          AVG(total_od) as avg_od_per_policy,
          MAX(total_od) as max_od,
          MIN(total_od) as min_od
        FROM policies 
        WHERE created_at >= $1 AND total_od > 0 AND branch = $2 AND UPPER(rollover) = 'ROLLOVER'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `;
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const monthlyResult = await query(monthlyBreakdownQuery, [twelveMonthsAgo.toISOString().split('T')[0], branch]);
      
      reportData.monthlyBreakdown = monthlyResult.rows.map(row => ({
        month: row.month,
        totalOD: parseFloat(row.total_od) || 0,
        policyCount: parseInt(row.policy_count) || 0,
        avgODPerPolicy: parseFloat(row.avg_od_per_policy) || 0,
        maxOD: parseFloat(row.max_od) || 0,
        minOD: parseFloat(row.min_od) || 0
      }));
      
      console.log(`✅ ${branch} branch report data generated successfully`);
      console.log(`📈 ${branch} Summary: ${reportData.summary.totalPolicies} policies, ₹${reportData.summary.totalOD.toLocaleString('en-IN')} Total OD`);
      console.log(`📊 ${branch} Daily breakdown: ${reportData.dailyBreakdown.length} days`);
      console.log(`📈 ${branch} Monthly breakdown: ${reportData.monthlyBreakdown.length} months`);
      
      return reportData;
      
    } catch (error) {
      console.error(`❌ ${branch} branch report data generation failed:`, error);
      throw error;
    }
  }

  /**
   * Send overall WhatsApp report to founders
   * @param {Object} overallReportData - Overall report data with all branches
   */
  async sendOverallReportWhatsApp(overallReportData) {
    try {
      // Get founder WhatsApp numbers from environment
      const founderWhatsAppNumbers = [
        process.env.FOUNDER_WHATSAPP_1,
        process.env.FOUNDER_WHATSAPP_2,
        process.env.FOUNDER_WHATSAPP_3
      ]
        .filter(phone => phone && phone.trim() !== '')
        .filter((phone, index, self) => self.indexOf(phone) === index); // Remove duplicates

      if (founderWhatsAppNumbers.length === 0) {
        console.log('⚠️ No founder WhatsApp numbers configured, skipping overall WhatsApp report');
        return;
      }

      console.log(`📱 Found ${founderWhatsAppNumbers.length} founder WhatsApp number(s) for overall report`);

      // Prepare template parameters for overall report
      const parameters = this.prepareOverallTemplateParameters(overallReportData);

      // Send to each founder
      for (const founderPhone of founderWhatsAppNumbers) {
        try {
          // Send template message without header image (as per user request)
          const result = await whatsappService.sendTemplateMessage(
            founderPhone,
            'daily_od_report_overall', // Template name for overall report
            parameters,
            null // No header image
          );

          if (result.success) {
            console.log(`✅ Overall WhatsApp report sent to ${founderPhone} (Message ID: ${result.messageId})`);
          } else {
            console.error(`❌ Failed to send overall WhatsApp report to ${founderPhone}:`, result.error);
          }

          // Rate limit delay (1 second between messages)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error sending overall WhatsApp report to ${founderPhone}:`, error.message);
        }
      }

      console.log('✅ Overall WhatsApp reports sent to founders');

    } catch (error) {
      console.error('❌ Overall WhatsApp reports failed:', error);
    }
  }

  /**
   * Prepare template parameters for overall WhatsApp report
   * @param {Object} reportData - Overall report data with all branches
   * @returns {Array} Array of template parameters
   */
  prepareOverallTemplateParameters(reportData) {
    // Format currency (remove ₹ symbol, will be in template)
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0).replace('₹', '');
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // Format ALL branches with their vehicle types as single text string
    // Note: WhatsApp parameters cannot have newlines, tabs, or more than 4 consecutive spaces
    // Using better formatting with clearer separators for readability
    const branchesText = reportData.branches
      .map((branch, branchIndex) => {
        // Format vehicle types for this branch
        const vehicleTypesText = branch.vehicleTypes
          .map((vehicleType, vtIndex) => {
            const rolloverAmount = formatCurrency(vehicleType.rollover?.amount || 0);
            const rolloverCount = vehicleType.rollover?.count || 0;
            const renewalAmount = formatCurrency(vehicleType.renewal?.amount || 0);
            const renewalCount = vehicleType.renewal?.count || 0;
            
            // Format with better spacing
            return `🚗 ${vehicleType.vehicleType || 'Unknown'}: Rollover ₹${rolloverAmount} (${rolloverCount} policies) | Renewal ₹${renewalAmount} (${renewalCount} policies)`;
          })
          .join(' '); // Single space between vehicle types

        // Format branch with clearer structure - each branch on its own "line" visually
        const branchHeader = `🏢 ${branch.branchName}: Total ₹${formatCurrency(branch.totalOD)} (${branch.totalPolicies} policies)`;
        const vehicleSection = vehicleTypesText.length > 0 ? `- ${vehicleTypesText}` : '';
        return `${branchHeader} ${vehicleSection}`.trim();
      })
      .join(' '); // Space separator - template formatting will handle layout

    return [
      formatDate(reportData.date),                           // {{1}} - Date
      (reportData.summary.totalPolicies || 0).toString(),    // {{2}} - Total Policies (All Branches)
      formatCurrency(reportData.summary.totalOD || 0),        // {{3}} - Total OD (All Branches)
      (reportData.summary.rolloverCount || 0).toString(),    // {{4}} - Rollover Count
      formatCurrency(reportData.summary.rolloverOD || 0),    // {{5}} - Rollover OD
      (reportData.summary.renewalCount || 0).toString(),      // {{6}} - Renewal Count
      formatCurrency(reportData.summary.renewalOD || 0),     // {{7}} - Renewal OD
      reportData.branches.length.toString(),                  // {{8}} - Number of Branches
      branchesText || 'No branches'                           // {{9}} - All Branches Details
    ];
  }

  /**
   * Send branch-wise WhatsApp reports to branch heads
   * @param {Object} overallReportData - Overall report data with branches
   */
  async sendBranchReportsWhatsApp(overallReportData) {
    try {
      // Get branches from report data
      const branches = overallReportData.branches || [];

      if (branches.length === 0) {
        console.log('⚠️ No branches found in report data, skipping branch WhatsApp reports');
        return;
      }

      // Loop through branches
      for (const branchData of branches) {
        // Skip if branch has no policies
        if (!branchData.totalPolicies || branchData.totalPolicies === 0) {
          console.log(`⏭️ Skipping ${branchData.branchName} branch - no policies`);
          continue;
        }

        // Get branch head WhatsApp number for this branch
        const branchHeadWhatsApp = this.getBranchHeadWhatsApp(branchData.branchName);

        if (!branchHeadWhatsApp) {
          console.log(`⚠️ No WhatsApp number configured for ${branchData.branchName} branch head, skipping`);
          continue;
        }

        console.log(`📱 Preparing WhatsApp report for ${branchData.branchName} branch to branch head (Rollover only)...`);

        // Prepare template parameters (ROLLOVER ONLY for branch heads)
        const parameters = this.prepareBranchTemplateParametersRolloverOnly(overallReportData, branchData);

        try {
          // Send template message without header image (as per user request)
          const result = await whatsappService.sendTemplateMessage(
            branchHeadWhatsApp,
            'daily_od_report_branch', // Template name created in Meta
            parameters,
            null // No header image
          );

          if (result.success) {
            console.log(`✅ WhatsApp report sent to ${branchData.branchName} branch head (${branchHeadWhatsApp}) for ${branchData.branchName} branch (Message ID: ${result.messageId})`);
          } else {
            console.error(`❌ Failed to send WhatsApp report to ${branchData.branchName} branch head:`, result.error);
          }

          // Rate limit delay (1 second between messages)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error sending WhatsApp report to ${branchData.branchName} branch head:`, error.message);
        }
      }

      console.log('✅ Branch-wise WhatsApp reports sent to branch heads');

    } catch (error) {
      console.error('❌ Branch-wise WhatsApp reports failed:', error);
    }
  }

  /**
   * Get branch head WhatsApp number from environment variables
   * @param {string} branch - Branch name
   * @returns {string|null} Branch head WhatsApp number
   */
  getBranchHeadWhatsApp(branch) {
    const branchWhatsApp = {
      'MYSORE': process.env.MYSORE_BRANCH_HEAD_WHATSAPP,
      'BANASHANKARI': process.env.BANASHANKARI_BRANCH_HEAD_WHATSAPP,
      'ADUGODI': process.env.ADUGODI_BRANCH_HEAD_WHATSAPP
    };
    
    return branchWhatsApp[branch] || null;
  }

  /**
   * Prepare template parameters for branch WhatsApp report (ROLLOVER ONLY for branch heads)
   * @param {Object} reportData - Overall report data
   * @param {Object} branchData - Branch-specific data
   * @returns {Array} Array of template parameters
   */
  prepareBranchTemplateParametersRolloverOnly(reportData, branchData) {
    // Format currency (remove ₹ symbol, will be in template)
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0).replace('₹', '');
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // Format ALL vehicle types with ROLLOVER ONLY (no renewal data)
    // Note: WhatsApp parameters cannot have newlines, tabs, or more than 4 consecutive spaces
    const vehicleTypesText = branchData.vehicleTypes
      .map(vehicleType => {
        const rolloverAmount = formatCurrency(vehicleType.rollover?.amount || 0);
        const rolloverCount = vehicleType.rollover?.count || 0;

        // Only show rollover data (matching email format for branch heads)
        return `🚗 ${vehicleType.vehicleType || 'Unknown'}: Rollover ₹${rolloverAmount} (${rolloverCount} policies)`;
      })
      .join(' | '); // Use pipe separator between vehicle types

    // Calculate branch summary (ROLLOVER ONLY)
    const branchRolloverCount = branchData.vehicleTypes.reduce((sum, vt) => sum + (vt.rollover?.count || 0), 0);
    const branchRolloverOD = branchData.vehicleTypes.reduce((sum, vt) => sum + (vt.rollover?.amount || 0), 0);

    // Calculate total policies and OD from rollover data only (matching email format)
    // Note: branchData.totalPolicies includes both rollover and renewal, but for branch heads we show rollover only
    const rolloverOnlyTotalPolicies = branchRolloverCount;
    const rolloverOnlyTotalOD = branchRolloverOD;

    return [
      branchData.branchName || 'Unknown',              // {{1}} - Branch Name
      formatDate(reportData.date),                     // {{2}} - Date
      rolloverOnlyTotalPolicies.toString(),             // {{3}} - Branch Total Policies (Rollover only)
      formatCurrency(rolloverOnlyTotalOD),             // {{4}} - Branch Total OD (Rollover only)
      branchRolloverCount.toString(),                   // {{5}} - Branch Rollover Count
      formatCurrency(branchRolloverOD),                // {{6}} - Branch Rollover OD
      vehicleTypesText || 'No vehicle types'          // {{7}} - Vehicle Types (Rollover only)
    ];
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
