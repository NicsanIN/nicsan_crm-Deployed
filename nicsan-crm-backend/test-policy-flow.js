#!/usr/bin/env node

/**
 * Test Complete Policy Flow with Email Integration
 * 
 * This script tests the complete flow:
 * 1. PDF Upload
 * 2. AI Processing
 * 3. Policy Confirmation
 * 4. Email Sending
 * 
 * It simulates the real user workflow to ensure everything works end-to-end.
 */

const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  testPDF: path.join(__dirname, 'test-policy.pdf'),
  testToken: process.env.TEST_TOKEN || 'your-test-jwt-token'
};

console.log('🧪 Testing Complete Policy Flow with Email Integration');
console.log('=====================================================\n');

/**
 * Create a test PDF file
 */
function createTestPDF() {
  console.log('📄 Creating test PDF file...');
  
  // Create a simple test PDF content (this is a minimal PDF structure)
  const pdfContent = Buffer.from(`
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Policy Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF
  `);
  
  fs.writeFileSync(TEST_CONFIG.testPDF, pdfContent);
  console.log('✅ Test PDF created:', TEST_CONFIG.testPDF);
}

/**
 * Test 1: PDF Upload
 */
async function testPDFUpload() {
  console.log('\n📤 Test 1: PDF Upload');
  console.log('----------------------');
  
  try {
    // Create test PDF if it doesn't exist
    if (!fs.existsSync(TEST_CONFIG.testPDF)) {
      createTestPDF();
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(TEST_CONFIG.testPDF));
    formData.append('insurer', 'TATA_AIG');
    formData.append('manual_customer_name', 'John Doe');
    formData.append('manual_customer_email', TEST_CONFIG.testEmail);
    formData.append('manual_policy_number', 'TA-TEST-12345');
    formData.append('manual_vehicle_number', 'KA01AB1234');
    formData.append('manual_make', 'Maruti');
    formData.append('manual_model', 'Swift');
    formData.append('manual_issue_date', '2024-01-15');
    formData.append('manual_expiry_date', '2025-01-14');
    formData.append('manual_total_premium', '12150');
    formData.append('manual_caller_name', 'Test Caller');
    formData.append('manual_ops_executive', 'Test Ops');
    
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/api/upload/pdf`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${TEST_CONFIG.testToken}`
        },
        timeout: 30000
      }
    );
    
    if (response.data.success) {
      console.log('✅ PDF upload successful');
      console.log(`   Upload ID: ${response.data.data.uploadId}`);
      console.log(`   Status: ${response.data.data.status}`);
      return response.data.data.uploadId;
    } else {
      console.log('❌ PDF upload failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ PDF upload error:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
    return null;
  }
}

/**
 * Test 2: Check Upload Status
 */
async function testUploadStatus(uploadId) {
  console.log('\n📊 Test 2: Check Upload Status');
  console.log('-----------------------------');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/api/upload/${uploadId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.testToken}`
        }
      }
    );
    
    if (response.data.success) {
      const upload = response.data.data;
      console.log('✅ Upload status retrieved');
      console.log(`   Status: ${upload.status}`);
      console.log(`   Insurer: ${upload.insurer}`);
      console.log(`   S3 Key: ${upload.s3_key}`);
      console.log(`   Filename: ${upload.filename}`);
      
      if (upload.extracted_data) {
        console.log('   Extracted Data: Available');
      }
      
      return upload;
    } else {
      console.log('❌ Upload status check failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Upload status error:', error.message);
    return null;
  }
}

/**
 * Test 3: Wait for AI Processing
 */
async function testAIProcessing(uploadId) {
  console.log('\n🤖 Test 3: Wait for AI Processing');
  console.log('----------------------------------');
  
  try {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const response = await axios.get(
        `${TEST_CONFIG.baseUrl}/api/upload/${uploadId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.testToken}`
          }
        }
      );
      
      if (response.data.success) {
        const upload = response.data.data;
        console.log(`   Attempt ${attempts + 1}: Status = ${upload.status}`);
        
        if (upload.status === 'REVIEW') {
          console.log('✅ AI processing completed');
          console.log('   Status: REVIEW (ready for confirmation)');
          return upload;
        } else if (upload.status === 'PROCESSING') {
          console.log('   Status: PROCESSING (waiting...)');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          attempts++;
        } else {
          console.log(`   Status: ${upload.status}`);
          return upload;
        }
      } else {
        console.log('❌ Status check failed:', response.data.error);
        return null;
      }
    }
    
    console.log('⚠️ AI processing timeout after 10 attempts');
    return null;
  } catch (error) {
    console.log('❌ AI processing error:', error.message);
    return null;
  }
}

/**
 * Test 4: Policy Confirmation (with Email)
 */
async function testPolicyConfirmation(uploadId) {
  console.log('\n✅ Test 4: Policy Confirmation (with Email)');
  console.log('-------------------------------------------');
  
  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/api/upload/${uploadId}/confirm`,
      {
        editedData: {
          pdfData: {
            policy_number: 'TA-TEST-12345',
            vehicle_number: 'KA01AB1234',
            make: 'Maruti',
            model: 'Swift',
            issue_date: '2024-01-15',
            expiry_date: '2025-01-14',
            total_premium: 12150
          },
          manualExtras: {
            customer_name: 'John Doe',
            customer_email: TEST_CONFIG.testEmail,
            caller_name: 'Test Caller',
            ops_executive: 'Test Ops'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Policy confirmation successful');
      console.log(`   Policy ID: ${response.data.data.id}`);
      console.log(`   Policy Number: ${response.data.data.policy_number}`);
      console.log(`   Customer Email: ${TEST_CONFIG.testEmail}`);
      console.log('   📧 Email should have been sent to customer');
      return response.data.data;
    } else {
      console.log('❌ Policy confirmation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Policy confirmation error:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
    return null;
  }
}

/**
 * Test 5: Verify Email Configuration
 */
async function testEmailConfiguration() {
  console.log('\n📧 Test 5: Verify Email Configuration');
  console.log('--------------------------------------');
  
  try {
    const emailService = require('./services/emailService');
    const isValid = await emailService.testEmailConfiguration();
    
    if (isValid) {
      console.log('✅ Email configuration is valid');
      console.log('   SMTP settings are properly configured');
      return true;
    } else {
      console.log('❌ Email configuration is invalid');
      console.log('   Please check your SMTP settings');
      return false;
    }
  } catch (error) {
    console.log('❌ Email configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test 6: Send Test Email
 */
async function testSendTestEmail() {
  console.log('\n📧 Test 6: Send Test Email');
  console.log('---------------------------');
  
  try {
    const emailService = require('./services/emailService');
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
 * Main test runner
 */
async function runCompleteFlowTest() {
  console.log('Starting complete policy flow test...\n');
  
  const results = {
    emailConfig: false,
    testEmail: false,
    pdfUpload: false,
    uploadStatus: false,
    aiProcessing: false,
    policyConfirmation: false
  };
  
  // Test email configuration first
  results.emailConfig = await testEmailConfiguration();
  results.testEmail = await testSendTestEmail();
  
  if (!results.emailConfig) {
    console.log('\n❌ Email configuration failed. Please check your SMTP settings.');
    return false;
  }
  
  // Test complete flow
  const uploadId = await testPDFUpload();
  if (!uploadId) {
    console.log('\n❌ PDF upload failed. Cannot continue with flow test.');
    return false;
  }
  
  results.pdfUpload = true;
  
  const upload = await testUploadStatus(uploadId);
  if (!upload) {
    console.log('\n❌ Upload status check failed.');
    return false;
  }
  
  results.uploadStatus = true;
  
  const processedUpload = await testAIProcessing(uploadId);
  if (!processedUpload) {
    console.log('\n❌ AI processing failed.');
    return false;
  }
  
  results.aiProcessing = true;
  
  const policy = await testPolicyConfirmation(uploadId);
  if (!policy) {
    console.log('\n❌ Policy confirmation failed.');
    return false;
  }
  
  results.policyConfirmation = true;
  
  // Summary
  console.log('\n📊 Complete Flow Test Results');
  console.log('=============================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Complete flow test passed! Email integration is working correctly.');
    console.log(`📧 Check ${TEST_CONFIG.testEmail} for the policy PDF email.`);
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration and logs.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCompleteFlowTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteFlowTest,
  testPDFUpload,
  testUploadStatus,
  testAIProcessing,
  testPolicyConfirmation,
  testEmailConfiguration,
  testSendTestEmail
};
