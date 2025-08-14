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

async function setupAWS() {
  try {
    console.log('🚀 Setting up AWS services for Nicsan CRM...');
    
    // Step 1: Create S3 Bucket
    console.log('\n🔧 Step 1: Creating S3 bucket...');
    const bucketName = process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs';
    
    try {
      await s3.createBucket({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION || 'ap-south-1'
        }
      }).promise();
      console.log(`✅ S3 bucket '${bucketName}' created successfully!`);
    } catch (error) {
      if (error.code === 'BucketAlreadyExists') {
        console.log(`ℹ️  S3 bucket '${bucketName}' already exists`);
      } else if (error.code === 'IllegalLocationConstraintException') {
        // For us-east-1, remove LocationConstraint
        try {
          await s3.createBucket({
            Bucket: bucketName
          }).promise();
          console.log(`✅ S3 bucket '${bucketName}' created successfully!`);
        } catch (retryError) {
          if (retryError.code === 'BucketAlreadyExists') {
            console.log(`ℹ️  S3 bucket '${bucketName}' already exists`);
          } else {
            throw retryError;
          }
        }
      } else {
        throw error;
      }
    }
    
    // Step 2: Configure S3 bucket for PDF processing
    console.log('\n🔧 Step 2: Configuring S3 bucket...');
    
    // Set bucket policy for PDF processing
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowPDFUploads',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '*'}:root`
          },
          Action: [
            's3:PutObject',
            's3:GetObject',
            's3:DeleteObject'
          ],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    
    try {
      await s3.putBucketPolicy({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy)
      }).promise();
      console.log('✅ S3 bucket policy configured');
    } catch (error) {
      console.log(`⚠️  Could not set bucket policy: ${error.message}`);
    }
    
    // Step 3: Test Textract service
    console.log('\n🔧 Step 3: Testing Textract service...');
    
    try {
      // Test Textract by checking if service is accessible
      await textract.getDocumentAnalysis({ JobId: 'test-job-id' }).promise();
      console.log('✅ Textract service is accessible');
    } catch (error) {
      if (error.code === 'AccessDeniedException') {
        console.log('⚠️  Textract service access denied - you may need to enable it in AWS Console');
        console.log('🔗 Go to: https://console.aws.amazon.com/textract/');
      } else if (error.code === 'UnrecognizedClientException') {
        console.log('⚠️  Textract service not available in this region');
        console.log('🔗 Consider using us-east-1 or us-west-2 for Textract');
      } else if (error.code === 'InvalidJobIdException') {
        console.log('✅ Textract service is accessible (test job ID invalid as expected)');
      } else {
        console.log(`⚠️  Textract service issue: ${error.message}`);
      }
    }
    
    // Step 4: Test S3 operations
    console.log('\n🔧 Step 4: Testing S3 operations...');
    
    try {
      // Test uploading a small test file
      const testContent = 'Test PDF content for Nicsan CRM';
      await s3.putObject({
        Bucket: bucketName,
        Key: 'test/connection-test.txt',
        Body: testContent,
        ContentType: 'text/plain'
      }).promise();
      console.log('✅ S3 upload test successful');
      
      // Clean up test file
      await s3.deleteObject({
        Bucket: bucketName,
        Key: 'test/connection-test.txt'
      }).promise();
      console.log('✅ S3 delete test successful');
      
    } catch (error) {
      console.log(`❌ S3 operation test failed: ${error.message}`);
    }
    
    console.log('\n🎉 AWS setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Enable Textract service in AWS Console if needed');
    console.log('2. Test PDF upload in your application');
    console.log('3. Monitor Textract processing status');
    
  } catch (error) {
    console.error('❌ AWS setup failed:', error.message);
    console.error('Full error:', error);
  }
}

setupAWS();
