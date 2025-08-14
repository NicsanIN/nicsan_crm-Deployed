const AWS = require('aws-sdk');
require('dotenv').config();

console.log('🔍 Testing AWS S3 Connection...');
console.log('================================');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

async function testS3Connection() {
  try {
    console.log('📊 AWS Configuration:');
    console.log(`   Region: ${process.env.AWS_REGION}`);
    console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`);
    console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    
    // Test 1: List buckets
    console.log('\n🔄 Test 1: Listing S3 buckets...');
    const buckets = await s3.listBuckets().promise();
    console.log('✅ Successfully listed buckets:');
    buckets.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
    });
    
    // Test 2: Check specific bucket
    const bucketName = process.env.S3_BUCKET_NAME;
    console.log(`\n🔄 Test 2: Checking bucket '${bucketName}'...`);
    
    try {
      const bucketExists = await s3.headBucket({ Bucket: bucketName }).promise();
      console.log('✅ Bucket exists and is accessible');
      
      // Test 3: List objects in bucket
      console.log('\n🔄 Test 3: Listing objects in bucket...');
      const objects = await s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 5 }).promise();
      console.log(`✅ Found ${objects.Contents?.length || 0} objects in bucket`);
      
      if (objects.Contents && objects.Contents.length > 0) {
        objects.Contents.forEach(obj => {
          console.log(`   - ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`);
        });
      }
      
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log('❌ Bucket does not exist');
        console.log('💡 Creating bucket...');
        
        try {
          await s3.createBucket({
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION
            }
          }).promise();
          console.log('✅ Bucket created successfully!');
        } catch (createError) {
          console.log('❌ Failed to create bucket:', createError.message);
        }
      } else {
        console.log('❌ Error accessing bucket:', error.message);
      }
    }
    
    // Test 4: Test file upload (small test file)
    console.log('\n🔄 Test 4: Testing file upload...');
    const testContent = 'This is a test file for Nicsan CRM';
    const testKey = 'test/connection-test.txt';
    
    try {
      await s3.upload({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }).promise();
      console.log('✅ Test file uploaded successfully!');
      
      // Clean up test file
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
      console.log('✅ Test file cleaned up');
      
    } catch (uploadError) {
      console.log('❌ File upload failed:', uploadError.message);
    }
    
    console.log('\n🎉 S3 Testing Complete!');
    
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
  }
}

testS3Connection();


