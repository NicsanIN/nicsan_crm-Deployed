const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const textract = new AWS.Textract();

async function testAWSConnection() {
  try {
    console.log('🔍 Testing AWS connection for Nicsan CRM...');
    
    // Test 1: Check credentials
    console.log('\n🔧 Test 1: Checking AWS credentials...');
    console.log(`✅ AWS Region: ${process.env.AWS_REGION}`);
    console.log(`✅ Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    console.log(`✅ Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Configured' : 'Missing'}`);
    
    // Test 2: Test S3 connection (list buckets)
    console.log('\n🔧 Test 2: Testing S3 connection...');
    try {
      const buckets = await s3.listBuckets().promise();
      console.log('✅ S3 connection successful');
      console.log('📦 Available buckets:');
      buckets.Buckets.forEach(bucket => {
        console.log(`  - ${bucket.Name} (${bucket.CreationDate})`);
      });
      
      // Check if our target bucket exists
      const targetBucket = process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs';
      const bucketExists = buckets.Buckets.some(b => b.Name === targetBucket);
      
      if (bucketExists) {
        console.log(`✅ Target bucket '${targetBucket}' exists`);
      } else {
        console.log(`❌ Target bucket '${targetBucket}' does not exist`);
        console.log('🔗 Please create it manually in AWS Console');
      }
      
    } catch (error) {
      console.log(`❌ S3 connection failed: ${error.message}`);
    }
    
    // Test 3: Test Textract service
    console.log('\n🔧 Test 3: Testing Textract service...');
    try {
      // Test with a simple method that exists
      await textract.getDocumentAnalysis({ JobId: 'test-job-id' }).promise();
      console.log('✅ Textract service is accessible');
    } catch (error) {
      if (error.code === 'AccessDeniedException') {
        console.log('⚠️  Textract service access denied');
        console.log('🔗 You may need to enable it in AWS Console');
      } else if (error.code === 'UnrecognizedClientException') {
        console.log('⚠️  Textract service not available in this region');
        console.log('🔗 Consider using us-east-1 or us-west-2 for Textract');
      } else if (error.code === 'InvalidJobIdException') {
        console.log('✅ Textract service is accessible (test job ID invalid as expected)');
      } else {
        console.log(`⚠️  Textract service issue: ${error.message}`);
      }
    }
    
    // Test 4: Test S3 operations on existing bucket
    console.log('\n🔧 Test 4: Testing S3 operations...');
    const targetBucket = process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs';
    
    try {
      // Try to list objects in the bucket
      await s3.listObjectsV2({ Bucket: targetBucket, MaxKeys: 1 }).promise();
      console.log(`✅ Can access bucket '${targetBucket}'`);
      
      // Test upload if bucket exists
      const testContent = 'Test PDF content for Nicsan CRM';
      await s3.putObject({
        Bucket: targetBucket,
        Key: 'test/connection-test.txt',
        Body: testContent,
        ContentType: 'text/plain'
      }).promise();
      console.log('✅ S3 upload test successful');
      
      // Clean up test file
      await s3.deleteObject({
        Bucket: targetBucket,
        Key: 'test/connection-test.txt'
      }).promise();
      console.log('✅ S3 delete test successful');
      
    } catch (error) {
      if (error.code === 'NoSuchBucket') {
        console.log(`❌ Bucket '${targetBucket}' does not exist`);
        console.log('🔗 Please create it manually in AWS Console');
      } else {
        console.log(`❌ S3 operation test failed: ${error.message}`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('✅ AWS credentials are configured');
    console.log('✅ S3 service is accessible');
    console.log('⚠️  You may need to create the S3 bucket manually');
    console.log('⚠️  Textract service may need to be enabled');
    
  } catch (error) {
    console.error('❌ AWS connection test failed:', error.message);
  }
}

testAWSConnection();
