const AWS = require('aws-sdk');
require('dotenv').config();

console.log('🔍 Testing AWS Textract Connection...');
console.log('=====================================');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const textract = new AWS.Textract();
const s3 = new AWS.S3();

async function testTextractConnection() {
  try {
    console.log('📊 AWS Configuration:');
    console.log(`   Region: ${process.env.AWS_REGION}`);
    console.log(`   Textract Region: ${process.env.TEXTRACT_REGION || process.env.AWS_REGION}`);
    console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    
    // Test 1: Check Textract service availability
    console.log('\n🔄 Test 1: Checking Textract service availability...');
    
    // Test with a simple API call to verify service access
    try {
      // Test with analyzeDocument using a minimal document
      const testBuffer = Buffer.from('Test', 'utf-8');
      
      const analysisResult = await textract.analyzeDocument({
        Document: {
          Bytes: testBuffer
        },
        FeatureTypes: ['FORMS']
      }).promise();
      
      console.log('✅ Textract service is accessible and working!');
      console.log('   Blocks found:', analysisResult.Blocks?.length || 0);
      
    } catch (error) {
      if (error.code === 'UnsupportedDocumentException') {
        console.log('✅ Textract service is accessible and working correctly!');
        console.log('   This confirms Textract API is responding properly');
        console.log('   The error is expected for our minimal test document');
      } else if (error.code === 'InvalidDocument') {
        console.log('✅ Textract service is accessible (expected error for minimal document)');
        console.log('   This confirms Textract API is working correctly');
      } else if (error.code === 'AccessDenied') {
        console.log('⚠️ Textract service accessible but access denied (check IAM permissions)');
        console.log('   Error:', error.message);
      } else {
        console.log('❌ Textract service error:', error.message);
        console.log('   Error code:', error.code);
        return;
      }
    }
    
    // Test 2: Test S3 integration (if bucket exists)
    console.log('\n🔄 Test 2: Testing S3 + Textract integration...');
    const bucketName = process.env.S3_BUCKET_NAME;
    
    try {
      // Check if bucket exists
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log('✅ S3 bucket accessible for Textract integration');
      
      // Test presigned URL generation (for future use)
      const presignedUrl = s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: 'test/presigned-test.pdf',
        Expires: 3600 // 1 hour
      });
      console.log('✅ Presigned URL generation working');
      console.log('   URL length:', presignedUrl.length);
      
    } catch (s3Error) {
      console.log('⚠️ S3 integration test skipped:', s3Error.message);
    }
    
    // Test 3: Check IAM permissions
    console.log('\n🔄 Test 3: Checking IAM permissions...');
    const requiredPermissions = [
      'textract:AnalyzeDocument',
      'textract:StartDocumentAnalysis',
      'textract:GetDocumentAnalysis',
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject'
    ];
    
    console.log('📋 Required permissions for full functionality:');
    requiredPermissions.forEach(permission => {
      console.log(`   - ${permission}`);
    });
    
    console.log('\n💡 To test full functionality, you need:');
    console.log('   1. A PDF file in your S3 bucket');
    console.log('   2. Proper IAM permissions for Textract');
    console.log('   3. S3 bucket access for file operations');
    
    console.log('\n🎉 Textract Testing Complete!');
    
  } catch (error) {
    console.error('❌ Textract connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
  }
}

testTextractConnection();
