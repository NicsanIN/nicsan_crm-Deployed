/**
 * Script to manually trigger WhatsApp overall report for founders
 * Usage: node trigger-founder-whatsapp.js [date]
 * Example: node trigger-founder-whatsapp.js 2025-10-30
 */

require('dotenv').config();
const dailyReportScheduler = require('./jobs/dailyReport');

async function triggerFounderWhatsApp() {
  console.log('🧪 Starting Founder WhatsApp Report Trigger...\n');

  // Get date from command line or use today
  const args = process.argv.slice(2);
  let reportDate;
  
  if (args.length > 0) {
    reportDate = args[0];
    console.log(`📅 Using provided date: ${reportDate}\n`);
  } else {
    // Use today's date
    const today = new Date();
    reportDate = today.toISOString().split('T')[0];
    console.log(`📅 Using today's date: ${reportDate}`);
    console.log(`   (To use a specific date, run: node trigger-founder-whatsapp.js YYYY-MM-DD)\n`);
  }

  try {
    // Check founder WhatsApp numbers
    const founderWhatsAppNumbers = [
      process.env.FOUNDER_WHATSAPP_1,
      process.env.FOUNDER_WHATSAPP_2,
      process.env.FOUNDER_WHATSAPP_3
    ]
      .filter(phone => phone && phone.trim() !== '')
      .filter((phone, index, self) => self.indexOf(phone) === index); // Remove duplicates

    if (founderWhatsAppNumbers.length === 0) {
      console.error('❌ No founder WhatsApp numbers configured!');
      console.error('   Please set FOUNDER_WHATSAPP_1, FOUNDER_WHATSAPP_2, or FOUNDER_WHATSAPP_3 in .env file');
      process.exit(1);
    }

    console.log(`📱 Found ${founderWhatsAppNumbers.length} founder WhatsApp number(s):`);
    founderWhatsAppNumbers.forEach((phone, index) => {
      console.log(`   ${index + 1}. ${phone}`);
    });
    console.log('');

    // Generate report data
    console.log(`📊 Generating report data for ${reportDate}...\n`);
    const reportData = await dailyReportScheduler.generateReportData(reportDate);

    if (reportData.summary.totalPolicies === 0) {
      console.log('⚠️  No policies found for the selected date.');
      console.log('   However, we can still test the WhatsApp sending functionality...\n');
      
      // Create mock data for testing
      console.log('📝 Creating mock test data to verify WhatsApp sending...\n');
      reportData.branches = [
        {
          branchName: 'MYSORE',
          totalPolicies: 5,
          totalOD: 500000,
          vehicleTypes: [
            {
              vehicleType: 'Private Car',
              rollover: { amount: 300000, count: 3 },
              renewal: { amount: 200000, count: 2 }
            }
          ]
        },
        {
          branchName: 'ADUGODI',
          totalPolicies: 3,
          totalOD: 300000,
          vehicleTypes: [
            {
              vehicleType: 'Private Car',
              rollover: { amount: 200000, count: 2 },
              renewal: { amount: 100000, count: 1 }
            }
          ]
        }
      ];
      reportData.summary.totalPolicies = 8;
      reportData.summary.totalOD = 800000;
      reportData.summary.rolloverCount = 5;
      reportData.summary.rolloverOD = 500000;
      reportData.summary.renewalCount = 3;
      reportData.summary.renewalOD = 300000;
      
      console.log('📊 Using Mock Test Data:');
      console.log(`   Total Policies: ${reportData.summary.totalPolicies}`);
      console.log(`   Total OD: ₹${reportData.summary.totalOD.toLocaleString('en-IN')}`);
      console.log(`   Branches: ${reportData.branches.length}`);
      reportData.branches.forEach(branch => {
        console.log(`   - ${branch.branchName}: ${branch.totalPolicies} policies, ₹${branch.totalOD.toLocaleString('en-IN')}`);
      });
      console.log('');
    } else {
      console.log(`✅ Report Data Generated:`);
      console.log(`   Total Policies: ${reportData.summary.totalPolicies}`);
      console.log(`   Total OD: ₹${reportData.summary.totalOD.toLocaleString('en-IN')}`);
      console.log(`   Rollover: ${reportData.summary.rolloverCount} policies (₹${reportData.summary.rolloverOD.toLocaleString('en-IN')})`);
      console.log(`   Renewal: ${reportData.summary.renewalCount} policies (₹${reportData.summary.renewalOD.toLocaleString('en-IN')})`);
      console.log(`   Branches: ${reportData.branches.length}`);
      reportData.branches.forEach(branch => {
        console.log(`   - ${branch.branchName}: ${branch.totalPolicies} policies, ₹${branch.totalOD.toLocaleString('en-IN')}`);
      });
      console.log('');
    }

    // Send overall WhatsApp report to founders
    console.log('📱 Sending overall WhatsApp report to founders...\n');
    await dailyReportScheduler.sendOverallReportWhatsApp(reportData);

    console.log('\n✅ Test completed!');
    console.log('   Check your WhatsApp messages to verify the report was sent to founders.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
triggerFounderWhatsApp();

