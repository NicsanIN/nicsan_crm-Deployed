/**
 * Script to Trigger WhatsApp Message for Policy
 */

require('dotenv').config();
const { query } = require('./config/database');
const whatsappService = require('./services/whatsappService');

const POLICY_NUMBER = '62051130720555';

async function triggerWhatsApp() {
  console.log('📱 Triggering WhatsApp Message for Policy:', POLICY_NUMBER);
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get policy data
    console.log('\n📋 Step 1: Fetching Policy Data...');
    const policyQuery = `
      SELECT 
        id,
        policy_number,
        mobile,
        customer_phone,
        customer_name,
        vehicle_number,
        make,
        model,
        issue_date,
        expiry_date,
        total_premium,
        s3_key,
        source
      FROM policies 
      WHERE policy_number = $1
    `;
    
    const policyResult = await query(policyQuery, [POLICY_NUMBER]);
    
    if (policyResult.rows.length === 0) {
      console.log('❌ Policy not found!');
      return;
    }
    
    const policy = policyResult.rows[0];
    console.log('✅ Policy Data:');
    console.log('   Customer Name:', policy.customer_name);
    console.log('   Policy Number:', policy.policy_number);
    console.log('   Vehicle:', policy.make, policy.model);
    console.log('   Registration:', policy.vehicle_number);
    console.log('   Premium:', policy.total_premium);
    
    // Step 2: Extract phone number
    console.log('\n📱 Step 2: Extracting Phone Number...');
    const customerPhone = policy.customer_phone 
      || policy.customerPhone 
      || policy.mobile 
      || policy.Mobile;
    
    if (!customerPhone) {
      console.log('❌ No phone number found in policy record!');
      console.log('   Available fields:');
      console.log('     customer_phone:', policy.customer_phone || 'NULL');
      console.log('     mobile:', policy.mobile || 'NULL');
      return;
    }
    
    console.log('✅ Phone Number Found:', customerPhone);
    
    // Format phone number (add +91 if not present)
    const formattedPhone = customerPhone.startsWith('+') 
      ? customerPhone 
      : `+91${customerPhone}`;
    
    console.log('   Formatted:', formattedPhone);
    
    // Step 3: Get PDF S3 key
    console.log('\n📎 Step 3: Looking up PDF...');
    let pdfS3Key = policy.s3_key;
    let pdfFilename = null;
    
    // If s3_key points to JSON, try to find the actual PDF
    if (pdfS3Key && pdfS3Key.endsWith('.json')) {
      console.log('   S3 key points to JSON file, searching for PDF...');
      const pdfLookup = await whatsappService.getPdfS3KeyFromDatabase(POLICY_NUMBER);
      
      if (pdfLookup.success) {
        pdfS3Key = pdfLookup.s3Key;
        pdfFilename = pdfLookup.filename;
        console.log('   ✅ PDF Found:', pdfFilename);
        console.log('   S3 Key:', pdfS3Key);
      } else {
        console.log('   ⚠️ PDF not found via database lookup');
        console.log('   Will send text message only');
        pdfS3Key = null;
      }
    } else if (pdfS3Key) {
      // Try to extract filename from s3_key or use default
      pdfFilename = pdfS3Key.split('/').pop() || `Policy_${POLICY_NUMBER}.pdf`;
      console.log('   Using S3 key from policy:', pdfS3Key);
    }
    
    // Step 4: Prepare policy data object
    console.log('\n📦 Step 4: Preparing Policy Data Object...');
    const policyData = {
      customer_name: policy.customer_name,
      policy_number: policy.policy_number,
      vehicle_number: policy.vehicle_number,
      make: policy.make,
      model: policy.model,
      issue_date: policy.issue_date,
      expiry_date: policy.expiry_date,
      total_premium: parseFloat(policy.total_premium) || 0,
      mobile: policy.mobile,
      customer_phone: policy.customer_phone,
      customerPhone: policy.customerPhone,
    };
    
    console.log('✅ Policy Data Prepared');
    
    // Step 5: Send WhatsApp
    console.log('\n🚀 Step 5: Sending WhatsApp Message...');
    console.log('   To:', formattedPhone);
    console.log('   Policy:', POLICY_NUMBER);
    console.log('   PDF S3 Key:', pdfS3Key || 'Not available (text only)');
    
    const result = await whatsappService.sendPolicyWhatsApp(
      formattedPhone,
      policyData,
      pdfS3Key,
      pdfFilename
    );
    
    // Step 6: Display results
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULT');
    console.log('='.repeat(80));
    
    if (result.success) {
      console.log('✅ WhatsApp Message Sent Successfully!');
      console.log('   Text Message ID:', result.textMessageId || 'N/A');
      console.log('   Document Message ID:', result.documentMessageId || 'N/A');
      console.log('   Message:', result.message || 'Sent successfully');
    } else {
      console.log('❌ WhatsApp Message Failed!');
      console.log('   Error:', result.error);
      console.log('\n🔍 Troubleshooting:');
      console.log('   1. Check WhatsApp API credentials');
      console.log('   2. Verify phone number format:', formattedPhone);
      console.log('   3. Check rate limits');
      console.log('   4. Review error details above');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the script
triggerWhatsApp();

