require('dotenv').config();
const { query } = require('./config/database');

async function checkManualExtras() {
  try {
    console.log('🔍 Checking where manual extras are stored...\n');
    
    // Check pdf_uploads table
    const result = await query('SELECT upload_id, filename, insurer, status, manual_extras FROM pdf_uploads ORDER BY created_at DESC LIMIT 3');
    
    console.log('📊 PDF Uploads with Manual Extras:');
    console.log('====================================');
    
    if (result.rows.length === 0) {
      console.log('❌ No uploads found in pdf_uploads table');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`\n📄 Upload ${index + 1}:`);
        console.log(`   ID: ${row.upload_id}`);
        console.log(`   File: ${row.filename}`);
        console.log(`   Insurer: ${row.insurer}`);
        console.log(`   Status: ${row.status}`);
        
        if (row.manual_extras) {
          const manualData = JSON.parse(row.manual_extras);
          console.log(`   ✏️ Manual Extras:`);
          Object.entries(manualData).forEach(([key, value]) => {
            if (value) {
              console.log(`      ${key}: ${value}`);
            }
          });
        } else {
          console.log(`   ❌ No manual extras found`);
        }
      });
    }
    
    // Check policies table
    console.log('\n📋 Checking policies table...');
    const policiesResult = await query('SELECT policy_number, executive, caller_name, mobile, brokerage, cashback FROM policies ORDER BY created_at DESC LIMIT 3');
    
    if (policiesResult.rows.length === 0) {
      console.log('❌ No policies found in policies table');
    } else {
      console.log('✅ Policies with manual data:');
      policiesResult.rows.forEach((row, index) => {
        console.log(`\n📋 Policy ${index + 1}:`);
        console.log(`   Policy Number: ${row.policy_number}`);
        console.log(`   Executive: ${row.executive}`);
        console.log(`   Caller: ${row.caller_name}`);
        console.log(`   Mobile: ${row.mobile}`);
        console.log(`   Brokerage: ${row.brokerage}`);
        console.log(`   Cashback: ${row.cashback}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkManualExtras();
