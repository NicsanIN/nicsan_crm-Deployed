require('dotenv').config({ path: '../.env' }); // Load environment variables from root .env
const { sendPolicyWhatsApp, sendTestWhatsApp, testWhatsAppConfiguration } = require('./services/whatsappService');
const AWS = require('aws-sdk');

// Configure S3 for testing PDF download
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

let testResults = [];
let passedTests = 0;
let totalTests = 0;

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) passedTests++;

  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);

  testResults.push({ testName, passed, details });
}

async function runTest(testName, testFunction) {
  console.log(`\n${testName}`);
  console.log('----------------------------------');
  try {
    await testFunction();
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error.message);
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'
  ];
  let allConfigured = true;
  console.log('🔧 Test 6: Environment Variables');
  console.log('----------------------------------');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`❌ ${varName}: Missing`);
      allConfigured = false;
    } else {
      console.log(`✅ ${varName}: Configured`);
    }
  });
  if (!allConfigured) {
    throw new Error('Some environment variables are missing\n   Please check your .env file');
  }
  console.log('\n✅ All required environment variables are configured');
}

async function testWhatsAppConfig() {
  const result = await testWhatsAppConfiguration();
  if (!result.success) {
    throw new Error(result.error);
  }
  console.log(`   Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
  console.log(`   Business Account ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`);
  console.log(`   Display Name: ${result.phoneNumber}`);
}

async function testSendWhatsApp() {
  const testPhoneNumber = process.env.TEST_PHONE || '+919876543210';
  const result = await sendTestWhatsApp(testPhoneNumber);
  if (!result.success) {
    throw new Error(result.error);
  }
  console.log(`   Message ID: ${result.messageId}`);
  console.log(`   Sent to: ${testPhoneNumber}`);
}

async function testS3Connection() {
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Region: ${region}`);
  } catch (error) {
    throw new Error(`S3 connection failed: ${error.message}`);
  }
}

async function testPolicyWhatsApp() {
  const mockPolicyData = {
    customer_name: 'John Doe',
    customer_phone: process.env.TEST_PHONE || '+919876543210',
    policy_number: 'TA-TEST-12345',
    vehicle_number: 'KA01TEST1234',
    make: 'Maruti',
    model: 'Swift',
    issue_date: '2025-01-01',
    expiry_date: '2026-01-01',
    total_premium: 15000
  };
  const mockS3Key = 'local-staging/test/test-policy.pdf'; // This key should exist for a full pass
  const mockFilename = 'test-policy.pdf';

  console.log('📱 Sending mock policy via WhatsApp...');
  console.log(`   Customer: ${mockPolicyData.customer_name}`);
  console.log(`   Phone: ${mockPolicyData.customer_phone}`);
  console.log(`   Policy: ${mockPolicyData.policy_number}`);
  console.log(`   S3 Key: ${mockS3Key}`);

  const result = await sendPolicyWhatsApp(
    mockPolicyData.customer_phone,
    mockPolicyData,
    mockS3Key,
    mockFilename
  );

  if (!result.success) {
    throw new Error(result.error);
  }
}

async function testErrorHandling() {
  const invalidPhone = 'invalid-phone';
  const nonExistentS3Key = 'non-existent-s3-key';
  const mockPolicyData = {
    customer_name: 'Error Test',
    customer_phone: invalidPhone,
    policy_number: 'ERR-TEST-001',
    make: 'Test',
    model: 'Error',
    issue_date: '2025-01-01',
    expiry_date: '2026-01-01',
    total_premium: 1000
  };

  console.log('📱 Sending policy to: invalid-phone');
  console.log('📄 PDF S3 Key: non-existent-s3-key');

  const result = await sendPolicyWhatsApp(
    invalidPhone,
    mockPolicyData,
    nonExistentS3Key,
    'error.pdf'
  );

  if (result.success) {
    throw new Error('WhatsApp should have failed for invalid S3 key/phone');
  }
  console.log(`✅ Error handling works correctly`);
  console.log(`   Error: ${result.error}`);
}

async function runTests() {
  console.log('🧪 Testing WhatsApp Service Integration');
  console.log('=====================================');

  console.log('\nStarting WhatsApp service tests...\n');

  await runTest('📱 Test 1: WhatsApp Configuration', testWhatsAppConfig);
  await runTest('📱 Test 2: Send Test WhatsApp', testSendWhatsApp);
  await runTest('☁️ Test 3: S3 Connection', testS3Connection);
  await runTest('📄 Test 4: Policy WhatsApp (Mock Data)', testPolicyWhatsApp);
  await runTest('⚠️ Test 5: Error Handling', testErrorHandling);
  await runTest('🔧 Test 6: Environment Variables', testEnvironmentVariables);

  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.testName.split(': ')[0]}`);
  });

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! WhatsApp service is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration.');
    process.exit(1); // Exit with error code if tests fail
  }
}

if (require.main === module) {
  runTests();
}
