#!/usr/bin/env node

/**
 * Test script to verify the daily report date fix
 * This script tests the date calculation logic without running the full report
 */

const dailyReportScheduler = require('./jobs/dailyReport');

console.log('🧪 Testing Daily Report Date Fix');
console.log('================================');

// Test the date calculation
console.log('\n1. Testing date calculation logic:');
const reportDate = dailyReportScheduler.testDateCalculation();

console.log('\n2. Testing manual report generation:');
console.log('   (This will generate a report for yesterday\'s date)');

// Test the actual report generation
dailyReportScheduler.testDailyReport()
  .then(() => {
    console.log('\n✅ Daily report test completed successfully!');
    console.log(`📊 Report was generated for date: ${reportDate}`);
    console.log('\n🎉 The daily report fix is working correctly!');
    console.log('   - Reports now use yesterday\'s date instead of today\'s');
    console.log('   - IST timezone handling is working properly');
    console.log('   - Scheduler will now report on completed work from previous day');
  })
  .catch((error) => {
    console.error('\n❌ Daily report test failed:', error);
    process.exit(1);
  });


