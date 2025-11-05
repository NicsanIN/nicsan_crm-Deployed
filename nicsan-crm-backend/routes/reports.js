const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireFounder } = require('../middleware/auth');
const emailService = require('../services/emailService');
const dailyReportScheduler = require('../jobs/dailyReport');
const weeklyRolloverReportScheduler = require('../jobs/weeklyRolloverReport');
const storageService = require('../services/storageService');

/**
 * Get yesterday's date in IST timezone for daily reports
 * @returns {string} Yesterday's date in YYYY-MM-DD format
 */
function getYesterdayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  const yesterday = new Date(istTime);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Get daily Total OD report data
router.get('/daily-od-report', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { date } = req.query;
    // Default to yesterday's date for daily reports (since we report on completed work)
    const reportDate = date || getYesterdayIST();
    
    console.log(`📊 Generating daily OD report for date: ${reportDate}`);
    
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
    
    const result = await query(reportQuery, [reportDate]);
    
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
    
    const summaryResult = await query(summaryQuery, [reportDate]);
    const summary = summaryResult.rows[0];
    
    // Structure the data for email template
    const reportData = {
      date: reportDate,
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
    
    console.log(`✅ Daily OD report generated successfully`);
    console.log(`📈 Summary: ${reportData.summary.totalPolicies} policies, ₹${reportData.summary.totalOD.toLocaleString('en-IN')} Total OD`);
    
    res.json({
      success: true,
      data: reportData
    });
    
  } catch (error) {
    console.error('❌ Daily OD report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily OD report'
    });
  }
});

// Send daily OD report via email
router.post('/send-daily-od-report', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { date } = req.body;
    // Default to yesterday's date for daily reports (since we report on completed work)
    const reportDate = date || getYesterdayIST();
    
    console.log(`📧 Sending daily OD report email for date: ${reportDate}`);
    
    // Get report data
    const reportResponse = await fetch(`${req.protocol}://${req.get('host')}/api/reports/daily-od-report?date=${reportDate}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (!reportResponse.ok) {
      throw new Error('Failed to generate report data');
    }
    
    const reportResult = await reportResponse.json();
    
    if (!reportResult.success) {
      throw new Error(reportResult.error || 'Failed to generate report data');
    }
    
    // Send email
    const emailResult = await emailService.sendDailyODReport(reportResult.data);
    
    if (emailResult.success) {
      console.log('✅ Daily OD report email sent successfully');
      res.json({
        success: true,
        message: 'Daily OD report sent successfully'
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
    
  } catch (error) {
    console.error('❌ Send daily OD report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send daily OD report'
    });
  }
});

// Test WhatsApp reports (for manual testing)
router.post('/test-whatsapp-reports', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`📱 Testing WhatsApp reports for date: ${reportDate}`);
    
    // Generate report data
    const reportData = await dailyReportScheduler.generateReportData(reportDate);
    
    if (reportData.summary.totalPolicies === 0) {
      return res.json({
        success: false,
        message: 'No policies found for the selected date',
        date: reportDate
      });
    }
    
    // Send WhatsApp reports
    console.log('📱 Sending WhatsApp reports...');
    await dailyReportScheduler.sendBranchReportsWhatsApp(reportData);
    
    res.json({
      success: true,
      message: 'WhatsApp reports sent successfully',
      date: reportDate,
      summary: {
        totalPolicies: reportData.summary.totalPolicies,
        totalOD: reportData.summary.totalOD,
        branches: reportData.branches.map(b => ({
          name: b.branchName,
          policies: b.totalPolicies,
          totalOD: b.totalOD
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Test WhatsApp reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp reports'
    });
  }
});

// Test weekly rollover report (email + WhatsApp) - for manual testing
router.post('/test-weekly-rollover-report', authenticateToken, requireFounder, async (req, res) => {
  try {
    const { weekStart, weekEnd, branch } = req.body;
    
    // If no dates provided, calculate previous week
    let calculatedWeekStart, calculatedWeekEnd;
    if (!weekStart || !weekEnd) {
      const { weekStart: start, weekEnd: end } = weeklyRolloverReportScheduler.calculatePreviousWeek();
      calculatedWeekStart = start;
      calculatedWeekEnd = end;
    } else {
      calculatedWeekStart = weekStart;
      calculatedWeekEnd = weekEnd;
    }
    
    console.log(`🧪 Testing weekly rollover report for week: ${calculatedWeekStart} to ${calculatedWeekEnd}`);
    
    // If branch specified, test only that branch, otherwise test all branches
    const branches = branch ? [branch] : ['MYSORE', 'BANASHANKARI', 'ADUGODI'];
    
    const results = [];
    
    for (const branchName of branches) {
      try {
        console.log(`📊 Generating ${branchName} branch weekly rollover report...`);
        
        // Generate branch-specific weekly rollover data
        const reportData = await storageService.calculateWeeklyRolloverReps(
          calculatedWeekStart, 
          calculatedWeekEnd, 
          branchName
        );
        
        if (reportData.reps.length === 0) {
          results.push({
            branch: branchName,
            success: false,
            message: 'No rollover policies found for this week',
            weekStart: calculatedWeekStart,
            weekEnd: calculatedWeekEnd
          });
          continue;
        }
        
        // Send email report
        console.log(`📧 Sending ${branchName} branch weekly rollover email report...`);
        const emailResult = await emailService.sendWeeklyRolloverReport(reportData, branchName);
        
        // Send WhatsApp report
        console.log(`📱 Sending ${branchName} branch weekly rollover WhatsApp report...`);
        await weeklyRolloverReportScheduler.sendWeeklyRolloverWhatsApp(reportData, branchName);
        
        results.push({
          branch: branchName,
          success: true,
          email: emailResult.success ? {
            sent: true,
            recipients: emailResult.recipients,
            messageId: emailResult.messageId
          } : {
            sent: false,
            error: emailResult.error
          },
          whatsapp: {
            sent: true
          },
          data: {
            weekStart: reportData.weekStart,
            weekEnd: reportData.weekEnd,
            totalTelecallers: reportData.reps.length,
            totalPolicies: reportData.total,
            telecallers: reportData.reps.map(rep => ({
              name: rep.name,
              converted: rep.converted
            }))
          }
        });
        
      } catch (error) {
        console.error(`❌ Error processing ${branchName} branch:`, error);
        results.push({
          branch: branchName,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Weekly rollover report test completed',
      weekPeriod: {
        start: calculatedWeekStart,
        end: calculatedWeekEnd
      },
      results: results
    });
    
  } catch (error) {
    console.error('❌ Test weekly rollover report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send weekly rollover report'
    });
  }
});

module.exports = router;
