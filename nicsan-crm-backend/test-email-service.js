#!/usr/bin/env node

/**
 * Test Email Service Configuration and Functionality
 * 
 * This script tests the email service integration to ensure:
 * 1. Email configuration is valid
 * 2. Test emails can be sent
 * 3. Policy PDF emails work correctly
 * 4. Error handling works properly
 */

const emailService = require('./services/emailService');
const AWS = require('aws-sdk');
require('dotenv').config();

// Initialize AWS S3 for testing
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Test configuration
const TEST_CONFIG = {
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  s3Bucket: process.env.AWS_S3_BUCKET,
  testS3Key: 'local-staging/test/test-policy.pdf' // You can create this test file
};

console.log('🧪 Testing Email Service Integration');
console.log('=====================================\n');

/**
 * Test 1: Email Configuration
 */
async function testEmailConfiguration() {
  console.log('📧 Test 1: Email Configuration');
  console.log('--------------------------------');
  
  try {
    const isValid = await emailService.testEmailConfiguration();
    
    if (isValid) {
      console.log('✅ Email configuration is valid');
      console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
      console.log(`   SMTP Port: ${process.env.SMTP_PORT || 587}`);
      console.log(`   SMTP User: ${process.env.SMTP_USER || 'Not configured'}`);
      return true;
    } else {
      console.log('❌ Email configuration is invalid');
      return false;
    }
  } catch (error) {
    console.log('❌ Email configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Send Test Email
 */
async function testSendEmail() {
  console.log('\n📧 Test 2: Send Test Email');
  console.log('---------------------------');
  
  try {
    const result = await emailService.sendTestEmail(TEST_CONFIG.testEmail);
    
    if (result.success) {
      console.log('✅ Test email sent successfully');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${TEST_CONFIG.testEmail}`);
      return true;
    } else {
      console.log('❌ Test email failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
    return false;
  }
}

/**
 * Test 3: S3 Connection
 */
async function testS3Connection() {
  console.log('\n☁️ Test 3: S3 Connection');
  console.log('-------------------------');
  
  try {
    const params = {
      Bucket: TEST_CONFIG.s3Bucket,
      MaxKeys: 1
    };
    
    const result = await s3.listObjectsV2(params).promise();
    console.log('✅ S3 connection successful');
    console.log(`   Bucket: ${TEST_CONFIG.s3Bucket}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    return true;
  } catch (error) {
    console.log('❌ S3 connection failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Policy PDF Email (Mock Data)
 */
async function testPolicyPDFEmail() {
  console.log('\n📄 Test 4: Policy PDF Email (Mock Data)');
  console.log('----------------------------------------');
  
  try {
    // Mock policy data
    const mockPolicyData = {
      customer_name: 'John Doe',
      customer_email: TEST_CONFIG.testEmail,
      policy_number: 'TA-TEST-12345',
      vehicle_number: 'KA01AB1234',
      make: 'Maruti',
      model: 'Swift',
      issue_date: '2024-01-15',
      expiry_date: '2025-01-14',
      total_premium: 12150
    };
    
    // Mock S3 key (you can create a test PDF file)
    const mockS3Key = TEST_CONFIG.testS3Key;
    const mockFilename = 'test-policy.pdf';
    
    console.log('📧 Sending mock policy PDF email...');
    console.log(`   Customer: ${mockPolicyData.customer_name}`);
    console.log(`   Email: ${mockPolicyData.customer_email}`);
    console.log(`   Policy: ${mockPolicyData.policy_number}`);
    console.log(`   S3 Key: ${mockS3Key}`);
    
    const result = await emailService.sendPolicyPDF(
      mockPolicyData.customer_email,
      mockPolicyData,
      mockS3Key,
      mockFilename
    );
    
    if (result.success) {
      console.log('✅ Policy PDF email sent successfully');
      console.log(`   Message ID: ${result.messageId}`);
      return true;
    } else {
      console.log('❌ Policy PDF email failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Policy PDF email error:', error.message);
    return false;
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling() {
  console.log('\n⚠️ Test 5: Error Handling');
  console.log('--------------------------');
  
  try {
    // Test with invalid email
    const result = await emailService.sendPolicyPDF(
      'invalid-email',
      { customer_name: 'Test User' },
      'non-existent-s3-key',
      'test.pdf'
    );
    
    if (!result.success) {
      console.log('✅ Error handling works correctly');
      console.log(`   Error: ${result.error}`);
      return true;
    } else {
      console.log('❌ Error handling test failed - should have failed');
      return false;
    }
  } catch (error) {
    console.log('✅ Error handling works correctly');
    console.log(`   Caught error: ${error.message}`);
    return true;
  }
}

/**
 * Test 6: Environment Variables
 */
function testEnvironmentVariables() {
  console.log('\n🔧 Test 6: Environment Variables');
  console.log('----------------------------------');
  
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('\n✅ All required environment variables are configured');
  } else {
    console.log('\n❌ Some environment variables are missing');
    console.log('   Please check your .env file');
  }
  
  return allPresent;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('Starting email service tests...\n');
  
  const results = {
    emailConfig: false,
    testEmail: false,
    s3Connection: false,
    policyPDF: false,
    errorHandling: false,
    environment: false
  };
  
  // Run all tests
  results.environment = testEnvironmentVariables();
  results.emailConfig = await testEmailConfiguration();
  results.testEmail = await testSendEmail();
  results.s3Connection = await testS3Connection();
  results.policyPDF = await testPolicyPDFEmail();
  results.errorHandling = await testErrorHandling();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Email service is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testEmailConfiguration,
  testSendEmail,
  testS3Connection,
  testPolicyPDFEmail,
  testErrorHandling,
  testEnvironmentVariables
};
