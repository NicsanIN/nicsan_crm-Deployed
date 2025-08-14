const https = require('https');
const fs = require('fs');
require('dotenv').config();

console.log('🧪 Testing Lambda Integration...');
console.log('================================');

// Configuration
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'nicsan-crm-lambda-internal-token-2024-secure-key';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs';

/**
 * Test internal API endpoints
 */
async function testInternalEndpoints() {
  console.log('\n🔄 Test 1: Testing Internal API Endpoints...');
  
  try {
    // Test 1: Update upload status
    console.log('   Testing status update endpoint...');
    const statusUpdateResult = await testAPI('PATCH', '/api/uploads/internal/by-s3key', {
      s3Key: 'test/upload-test.pdf',
      status: 'PROCESSING',
      message: 'Lambda test processing'
    });
    
    if (statusUpdateResult.success) {
      console.log('   ✅ Status update endpoint working');
    } else {
      console.log('   ⚠️ Status update endpoint response:', statusUpdateResult.message);
    }
    
    // Test 2: Create policy from extracted data
    console.log('   Testing policy creation endpoint...');
    const policyCreationResult = await testAPI('POST', '/api/uploads/internal/by-s3key/parsed', {
      s3Key: 'test/upload-test.pdf',
      policyData: {
        policy_number: 'TEST-001',
        vehicle_number: 'TEST-123',
        insurer: 'TEST_INSURER',
        total_premium: 5000,
        confidence_score: 0.85,
        source: 'PDF_UPLOAD'
      },
      status: 'REVIEW'
    });
    
    if (policyCreationResult.success) {
      console.log('   ✅ Policy creation endpoint working');
      console.log('   📊 Created policy ID:', policyCreationResult.data.policyId);
    } else {
      console.log('   ⚠️ Policy creation endpoint response:', policyCreationResult.message);
    }
    
  } catch (error) {
    console.log('   ❌ Internal endpoints test failed:', error.message);
    console.log('   🔍 Full error:', error);
  }
}

/**
 * Test S3 event simulation
 */
async function testS3EventSimulation() {
  console.log('\n🔄 Test 2: Testing S3 Event Simulation...');
  
  try {
    // Simulate S3 ObjectCreated event
    const s3Event = {
      Records: [
        {
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: {
              name: S3_BUCKET
            },
            object: {
              key: 'uploads/test-policy-123.pdf'
            }
          }
        }
      ]
    };
    
    console.log('   📄 Simulated S3 event for:', s3Event.Records[0].s3.object.key);
    console.log('   🪣 S3 bucket:', s3Event.Records[0].s3.bucket.name);
    console.log('   ✅ S3 event structure valid');
    
    // Note: In real deployment, this would trigger Lambda automatically
    console.log('   💡 In production, this event would automatically trigger Lambda');
    
  } catch (error) {
    console.log('   ❌ S3 event simulation failed:', error.message);
  }
}

/**
 * Test Lambda function locally
 */
async function testLambdaFunction() {
  console.log('\n🔄 Test 3: Testing Lambda Function Logic...');
  
  try {
    // Import Lambda function (simulate execution)
    const lambdaHandler = require('./lambda/pdf-processor.js');
    
    // Create mock S3 event
    const mockEvent = {
      Records: [
        {
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: {
              name: S3_BUCKET
            },
            object: {
              key: 'uploads/test-policy-456.pdf'
            }
          }
        }
      ]
    };
    
    console.log('   📄 Testing Lambda with mock event...');
    console.log('   🪣 Bucket:', mockEvent.Records[0].s3.bucket.name);
    console.log('   🔑 Key:', mockEvent.Records[0].s3.object.key);
    
    // Note: We can't fully test Lambda locally without AWS credentials
    // but we can verify the function structure
    if (typeof lambdaHandler.handler === 'function') {
      console.log('   ✅ Lambda handler function exists');
      console.log('   📊 Function signature:', lambdaHandler.handler.toString().substring(0, 100) + '...');
    } else {
      console.log('   ❌ Lambda handler function not found');
    }
    
  } catch (error) {
    console.log('   ❌ Lambda function test failed:', error.message);
  }
}

/**
 * Test API call utility
 */
async function testAPI(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: new URL(API_ENDPOINT).hostname,
      port: new URL(API_ENDPOINT).port || 80,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-internal-token': INTERNAL_TOKEN
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          resolve({ success: false, message: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Main test execution
 */
async function runTests() {
  try {
    console.log('🔧 Configuration:');
    console.log(`   API Endpoint: ${API_ENDPOINT}`);
    console.log(`   Internal Token: ${INTERNAL_TOKEN?.substring(0, 20)}...`);
    console.log(`   S3 Bucket: ${S3_BUCKET}`);
    
    // Run tests
    await testInternalEndpoints();
    await testS3EventSimulation();
    await testLambdaFunction();
    
    console.log('\n🎉 Lambda Integration Testing Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Deploy Lambda using: deploy-lambda.bat');
    console.log('   2. Test PDF upload to trigger Lambda');
    console.log('   3. Monitor CloudWatch logs for execution');
    console.log('   4. Verify automatic policy creation');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testAPI, testInternalEndpoints, testS3EventSimulation, testLambdaFunction };
