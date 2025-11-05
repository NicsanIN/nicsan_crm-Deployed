const cron = require('node-cron');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const storageService = require('../services/storageService');

/**
 * Weekly Rollover Report Scheduler
 * Runs every Monday at 10:00 AM IST
 * Sends simplified rollover report (telecaller name + converted policies) to branch heads
 */
class WeeklyRolloverReportScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
  }

  /**
   * Start the weekly rollover report scheduler
   */
  start() {
    console.log('🕘 Starting Weekly Rollover Report Scheduler...');
    
    // Schedule weekly report on Monday at 10:00 AM IST (4:30 AM UTC)
    cron.schedule('30 4 * * 1', async () => {
      await this.sendWeeklyRolloverReport();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    console.log('✅ Weekly Rollover Report Scheduler started');
    console.log('📅 Next report will be sent on Monday at 10:00 AM IST');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('🛑 Stopping Weekly Rollover Report Scheduler...');
    // Note: cron.destroy() is not available, scheduler will continue
    console.log('✅ Weekly Rollover Report Scheduler stopped');
  }

  /**
   * Send weekly rollover report to branch heads
   */
  async sendWeeklyRolloverReport() {
    if (this.isRunning) {
      console.log('⏳ Weekly rollover report is already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();

    try {
      console.log('📊 Generating weekly rollover reports...');
      
      // Calculate previous week (Monday to Sunday)
      const { weekStart, weekEnd } = this.calculatePreviousWeek();
      
      console.log(`📅 Week period: ${weekStart} to ${weekEnd}`);
      
      // Branches to send reports to
      const branches = ['MYSORE', 'BANASHANKARI', 'ADUGODI'];
      
      // Send reports to each branch head
      for (const branch of branches) {
        try {
          console.log(`📊 Generating ${branch} branch weekly rollover report...`);
          
          // Generate branch-specific weekly rollover data
          const reportData = await storageService.calculateWeeklyRolloverReps(weekStart, weekEnd, branch);
          
          if (reportData.reps.length > 0) {
            // Send email report
            console.log(`📧 Sending ${branch} branch weekly rollover email report...`);
            const emailResult = await emailService.sendWeeklyRolloverReport(reportData, branch);
            
            if (emailResult.success) {
              console.log(`✅ ${branch} branch weekly rollover email sent successfully`);
              console.log(`📬 ${branch} Recipients: ${emailResult.recipients.join(', ')}`);
            } else {
              console.error(`❌ Failed to send ${branch} branch weekly rollover email:`, emailResult.error);
            }
            
            // Send WhatsApp report
            console.log(`📱 Sending ${branch} branch weekly rollover WhatsApp report...`);
            await this.sendWeeklyRolloverWhatsApp(reportData, branch);
            
          } else {
            console.log(`📭 No rollover policies found for ${branch} branch for the week, skipping report`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${branch} branch weekly rollover report:`, error);
        }
      }
      
      console.log('✅ Weekly rollover reports completed');
      
    } catch (error) {
      console.error('❌ Weekly rollover report generation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Calculate previous week (Monday to Sunday)
   * @returns {Object} { weekStart, weekEnd } in YYYY-MM-DD format
   */
  calculatePreviousWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to go back to previous Monday
    // If today is Monday (1), go back 7 days to previous Monday
    // If today is Sunday (0), go back 6 days to previous Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToPreviousMonday = daysToMonday + 7; // Go to previous week's Monday
    
    // Calculate previous Sunday (end of previous week)
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - daysToMonday - 1); // Previous Sunday
    
    // Calculate previous Monday (start of previous week)
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6); // Previous Monday
    
    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    };
  }

  /**
   * Send weekly rollover WhatsApp report to branch head
   * @param {Object} reportData - Weekly rollover report data
   * @param {string} branch - Branch name
   */
  async sendWeeklyRolloverWhatsApp(reportData, branch) {
    try {
      // Get branch head WhatsApp number
      const branchHeadWhatsApp = this.getBranchHeadWhatsApp(branch);
      
      if (!branchHeadWhatsApp) {
        console.log(`⚠️ No WhatsApp number configured for ${branch} branch head, skipping WhatsApp report`);
        return;
      }
      
      console.log(`📱 Preparing WhatsApp report for ${branch} branch head...`);
      
      // Prepare template parameters
      const parameters = this.prepareWhatsAppTemplateParameters(reportData, branch);
      
      try {
        // Send template message
        const result = await whatsappService.sendTemplateMessage(
          branchHeadWhatsApp,
          'weekly_rollover_report_branch1', // Template name (needs to be created in Meta)
          parameters,
          null // No header image
        );
        
        if (result.success) {
          console.log(`✅ WhatsApp report sent to ${branch} branch head (${branchHeadWhatsApp}) (Message ID: ${result.messageId})`);
        } else {
          console.error(`❌ Failed to send WhatsApp report to ${branch} branch head:`, result.error);
        }
        
        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error sending WhatsApp report to ${branch} branch head:`, error.message);
      }
      
    } catch (error) {
      console.error(`❌ Weekly rollover WhatsApp report failed for ${branch}:`, error);
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
   * Prepare WhatsApp template parameters
   * @param {Object} reportData - Weekly rollover report data
   * @param {string} branch - Branch name
   * @returns {Array} Array of template parameters
   */
  prepareWhatsAppTemplateParameters(reportData, branch) {
    // Format week period
    const formatWeekPeriod = (start, end) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const endFormatted = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    };
    
    const weekPeriod = formatWeekPeriod(reportData.weekStart, reportData.weekEnd);
    const totalPolicies = reportData.total.toString();
    
    // Format each telecaller as separate parameter (one per line in template)
    // Support up to 10 telecallers
    const maxTelecallers = 10;
    const telecallerParams = [];
    
    for (let i = 0; i < Math.min(reportData.reps.length, maxTelecallers); i++) {
      const rep = reportData.reps[i];
      telecallerParams.push(`${rep.name} - ${rep.converted} policies`);
    }
    
    // Pad with empty strings if less than maxTelecallers (WhatsApp requires all parameters)
    while (telecallerParams.length < maxTelecallers) {
      telecallerParams.push(''); // Empty string for unused slots
    }
    
    return [
      branch,                    // {{1}} - Branch Name
      weekPeriod,                // {{2}} - Week Period
      totalPolicies,             // {{3}} - Total Policies
      ...telecallerParams        // {{4}} to {{13}} - Individual telecallers (one per line)
    ];
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun
    };
  }

  /**
   * Test the weekly rollover report (manual trigger)
   */
  async testWeeklyRolloverReport() {
    console.log('🧪 Testing weekly rollover report...');
    await this.sendWeeklyRolloverReport();
  }
}

// Create singleton instance
const weeklyRolloverReportScheduler = new WeeklyRolloverReportScheduler();

module.exports = weeklyRolloverReportScheduler;

