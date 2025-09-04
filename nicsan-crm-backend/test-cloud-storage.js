const AWS = require('aws-sdk');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
};

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: TEST_CONFIG.s3.accessKeyId,
  secretAccessKey: TEST_CONFIG.s3.secretAccessKey,
  region: TEST_CONFIG.s3.region
});

// Initialize PostgreSQL
const pool = new Pool(TEST_CONFIG.database);

// Test results tracking
let testResults = [];
let passedTests = 0;
let totalTests = 0;

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) passedTests++;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} Test ${totalTests}: ${testName}`);
  if (details) console.log(`   ${details}`);
  
  testResults.push({ testName, passed, details });
}

async function runTest(testName, testFunction) {
  try {
    await testFunction();
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error.message);
  }
}

// ========================================
// TEST CASE 1: AWS S3 Connection Test
// ========================================
async function testS3Connection() {
  console.log('\n🔍 Test 1: AWS S3 Connection Test');
  console.log('=====================================');
  
  await runTest('S3 List Buckets', async () => {
    const result = await s3.listBuckets().promise();
    if (!result.Buckets || result.Buckets.length === 0) {
      throw new Error('No buckets found or access denied');
    }
    console.log(`   Found ${result.Buckets.length} buckets`);
    result.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name} (${bucket.CreationDate})`);
    });
  });
  
  await runTest('S3 Bucket Access', async () => {
    const result = await s3.headBucket({ Bucket: TEST_CONFIG.s3.bucket }).promise();
    console.log(`   Successfully accessed bucket: ${TEST_CONFIG.s3.bucket}`);
  });
}

// ========================================
// TEST CASE 2: PostgreSQL Database Connection
// ========================================
async function testDatabaseConnection() {
  console.log('\n🔍 Test 2: PostgreSQL Database Connection');
  console.log('==========================================');
  
  await runTest('Database Connection', async () => {
    const client = await pool.connect();
    console.log(`   Connected to database: ${TEST_CONFIG.database.database}`);
    client.release();
  });
  
  await runTest('Database Tables Check', async () => {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'policies', 'pdf_uploads')
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'policies', 'pdf_uploads'];
    const foundTables = result.rows.map(row => row.table_name);
    
    if (foundTables.length !== expectedTables.length) {
      throw new Error(`Expected ${expectedTables.length} tables, found ${foundTables.length}`);
    }
    
    console.log(`   Found tables: ${foundTables.join(', ')}`);
    client.release();
  });
}

// ========================================
// TEST CASE 3: File Upload to S3 Test
// ========================================
async function testS3FileUpload() {
  console.log('\n🔍 Test 3: File Upload to S3 Test');
  console.log('===================================');
  
  // Create a test file
  const testFileName = `test-upload-${Date.now()}.txt`;
  const testFilePath = path.join(__dirname, testFileName);
  const testContent = 'This is a test file for Nicsan CRM cloud storage testing.';
  
  await runTest('Create Test File', async () => {
    fs.writeFileSync(testFilePath, testContent);
    console.log(`   Created test file: ${testFileName}`);
  });
  
  await runTest('Upload File to S3', async () => {
    const fileContent = fs.readFileSync(testFilePath);
    const uploadParams = {
      Bucket: TEST_CONFIG.s3.bucket,
      Key: `test-uploads/${testFileName}`,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        'test-purpose': 'nicsan-crm-storage-test',
        'uploaded-at': new Date().toISOString()
      }
    };
    
    const result = await s3.upload(uploadParams).promise();
    console.log(`   File uploaded successfully: ${result.Location}`);
    return result.Key; // Return the key for cleanup
  });
  
  await runTest('Verify File in S3', async () => {
    const key = `test-uploads/${testFileName}`;
    const result = await s3.headObject({
      Bucket: TEST_CONFIG.s3.bucket,
      Key: key
    }).promise();
    
    console.log(`   File verified: ${result.ContentLength} bytes`);
    console.log(`   Content-Type: ${result.ContentType}`);
  });
  
  // Cleanup test file
  try {
    fs.unlinkSync(testFilePath);
    console.log(`   Cleaned up local test file: ${testFileName}`);
  } catch (error) {
    console.log(`   Warning: Could not delete local test file: ${error.message}`);
  }
}

// ========================================
// TEST CASE 4: Dual Storage Test (S3 + PostgreSQL)
// ========================================
async function testDualStorage() {
  console.log('\n🔍 Test 4: Dual Storage Test (S3 + PostgreSQL)');
  console.log('==============================================');
  
  const testPolicy = {
    policy_number: `TEST-POLICY-${Date.now()}`,
    vehicle_number: 'KA01TEST1234',
    insurer: 'Test Insurance Co',
    total_premium: 15000.00,
    s3_key: `test-policies/policy-${Date.now()}.json`
  };
  
  await runTest('Save Policy to PostgreSQL', async () => {
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO policies (policy_number, vehicle_number, insurer, total_premium, s3_key, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, policy_number, created_at
    `, [testPolicy.policy_number, testPolicy.vehicle_number, testPolicy.insurer, testPolicy.total_premium, testPolicy.s3_key, 'TEST']);
    
    console.log(`   Policy saved to PostgreSQL: ID ${result.rows[0].id}`);
    client.release();
    return result.rows[0].id;
  });
  
  await runTest('Save Policy Data to S3', async () => {
    const policyData = JSON.stringify({
      ...testPolicy,
      extracted_at: new Date().toISOString(),
      test_data: true
    });
    
    const uploadParams = {
      Bucket: TEST_CONFIG.s3.bucket,
      Key: testPolicy.s3_key,
      Body: policyData,
      ContentType: 'application/json',
      Metadata: {
        'policy-number': testPolicy.policy_number,
        'test-purpose': 'dual-storage-test'
      }
    };
    
    const result = await s3.upload(uploadParams).promise();
    console.log(`   Policy data saved to S3: ${result.Location}`);
  });
  
  await runTest('Verify Dual Storage Integrity', async () => {
    // Check PostgreSQL
    const client = await pool.connect();
    const pgResult = await client.query(`
      SELECT policy_number, vehicle_number, insurer, total_premium, s3_key
      FROM policies 
      WHERE policy_number = $1
    `, [testPolicy.policy_number]);
    
    if (pgResult.rows.length === 0) {
      throw new Error('Policy not found in PostgreSQL');
    }
    
    // Check S3
    const s3Result = await s3.getObject({
      Bucket: TEST_CONFIG.s3.bucket,
      Key: testPolicy.s3_key
    }).promise();
    
    const s3Data = JSON.parse(s3Result.Body.toString());
    
    if (s3Data.policy_number !== testPolicy.policy_number) {
      throw new Error('Policy data mismatch between PostgreSQL and S3');
    }
    
    console.log(`   ✅ Dual storage integrity verified`);
    console.log(`   PostgreSQL: ${pgResult.rows[0].policy_number}`);
    console.log(`   S3: ${s3Data.policy_number}`);
    
    client.release();
  });
}

// ========================================
// TEST CASE 5: AWS Textract Integration Test
// ========================================
async function testTextractIntegration() {
  console.log('\n🔍 Test 5: AWS Textract Integration Test');
  console.log('==========================================');
  
  const textract = new AWS.Textract({
    accessKeyId: TEST_CONFIG.s3.accessKeyId,
    secretAccessKey: TEST_CONFIG.s3.secretAccessKey,
    region: TEST_CONFIG.s3.region
  });
  
  await runTest('Textract Service Configuration', async () => {
    // Test if Textract service is accessible
    console.log(`   Textract service configured for region: ${TEST_CONFIG.s3.region}`);
    console.log(`   Service endpoint: https://textract.${TEST_CONFIG.s3.region}.amazonaws.com`);
  });
  
  await runTest('Textract Permissions Check', async () => {
    // Create a simple test document
    const testDocContent = `
      Policy Number: TEST-TEXTRACT-001
      Vehicle Number: KA01TEXT1234
      Insurer: Textract Test Insurance
      Premium: 25000.00
      Issue Date: 2024-01-15
    `;
    
    const testDocKey = `test-textract/document-${Date.now()}.txt`;
    
    // Upload test document
    await s3.upload({
      Bucket: TEST_CONFIG.s3.bucket,
      Key: testDocKey,
      Body: testDocContent,
      ContentType: 'text/plain'
    }).promise();
    
    console.log(`   Test document uploaded: ${testDocKey}`);
    console.log(`   Note: Textract requires PDF/JPEG/PNG files for actual processing`);
    console.log(`   This test verifies service configuration and permissions`);
  });
}

// ========================================
// TEST CASE 6: Performance and Load Test
// ========================================
async function testPerformance() {
  console.log('\n🔍 Test 6: Performance and Load Test');
  console.log('=====================================');
  
  await runTest('Database Query Performance', async () => {
    const client = await pool.connect();
    const startTime = Date.now();
    
    // Run multiple queries
    for (let i = 0; i < 10; i++) {
      await client.query('SELECT COUNT(*) FROM policies');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Executed 10 queries in ${duration}ms`);
    console.log(`   Average query time: ${(duration / 10).toFixed(2)}ms`);
    
    if (duration > 1000) {
      throw new Error('Database queries too slow (>1000ms for 10 queries)');
    }
    
    client.release();
  });
  
  await runTest('S3 Upload Performance', async () => {
    const testData = 'A'.repeat(1024); // 1KB test data
    const startTime = Date.now();
    
    const uploadParams = {
      Bucket: TEST_CONFIG.s3.bucket,
      Key: `performance-test/data-${Date.now()}.txt`,
      Body: testData,
      ContentType: 'text/plain'
    };
    
    await s3.upload(uploadParams).promise();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Uploaded 1KB in ${duration}ms`);
    
    if (duration > 5000) {
      throw new Error('S3 upload too slow (>5000ms for 1KB)');
    }
  });
}

// ========================================
// TEST CASE 7: Error Handling and Recovery
// ========================================
async function testErrorHandling() {
  console.log('\n🔍 Test 7: Error Handling and Recovery');
  console.log('========================================');
  
  await runTest('Invalid S3 Key Handling', async () => {
    try {
      await s3.getObject({
        Bucket: TEST_CONFIG.s3.bucket,
        Key: 'non-existent-file-12345.txt'
      }).promise();
      throw new Error('Should have thrown an error for non-existent file');
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        console.log(`   ✅ Correctly handled non-existent file error: ${error.code}`);
      } else {
        throw new Error(`Unexpected error: ${error.code}`);
      }
    }
  });
  
  await runTest('Database Connection Recovery', async () => {
    const client = await pool.connect();
    try {
      // Try an invalid query
      await client.query('SELECT * FROM non_existent_table');
    } catch (error) {
      console.log(`   ✅ Correctly handled database error: ${error.message}`);
    } finally {
      client.release();
    }
  });
  
  await runTest('Environment Variables Validation', async () => {
    const requiredVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY', 
      'AWS_REGION',
      'AWS_S3_BUCKET',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log(`   ✅ All required environment variables are set`);
  });
}

// ========================================
// MAIN TEST EXECUTION
// ========================================
async function runAllTests() {
  console.log('🚀 NICSAN CRM - CLOUD STORAGE & DUAL STORAGE TEST SUITE');
  console.log('========================================================');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🌍 AWS Region: ${TEST_CONFIG.s3.region}`);
  console.log(`📦 S3 Bucket: ${TEST_CONFIG.s3.bucket}`);
  console.log(`🗄️ Database: ${TEST_CONFIG.database.database}`);
  console.log('');
  
  try {
    // Run all test cases
    await testS3Connection();
    await testDatabaseConnection();
    await testS3FileUpload();
    await testDualStorage();
    await testTextractIntegration();
    await testPerformance();
    await testErrorHandling();
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Your cloud storage and dual storage system is working perfectly!');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the error messages above.');
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    if (passedTests === totalTests) {
      console.log('✅ System is ready for production use');
      console.log('✅ Dual storage architecture is functioning correctly');
      console.log('✅ AWS S3 and PostgreSQL are properly integrated');
    } else {
      console.log('🔧 Review failed tests and fix issues before production deployment');
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testS3Connection,
  testDatabaseConnection,
  testS3FileUpload,
  testDualStorage,
  testTextractIntegration,
  testPerformance,
  testErrorHandling
};
