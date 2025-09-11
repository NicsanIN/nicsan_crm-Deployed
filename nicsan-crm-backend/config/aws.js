const AWS = require('aws-sdk');

// AWS Configuration (Primary Storage)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  signatureVersion: 'v4'
});

// Textract Configuration
const textract = new AWS.Textract({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1' // Use same region as S3
});

// S3 Helper Functions
const uploadToS3 = async (file, key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    console.log('✅ File uploaded to S3:', result.Location);
    return result;
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw error;
  }
};

const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
    console.log('✅ File deleted from S3:', key);
    return true;
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw error;
  }
};

const getS3Url = (key) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// OpenAI Helper Functions (replaces Textract)
const extractTextFromPDF = async (s3Key, insurer = 'TATA_AIG') => {
  try {
    const openaiService = require('../services/openaiService');
    const result = await openaiService.extractTextFromPDF(s3Key, insurer);
    console.log('✅ OpenAI analysis completed');
    return result;
  } catch (error) {
    console.error('❌ OpenAI error:', error);
    throw error;
  }
};

// Generate unique S3 key with insurer detection
const generateS3Key = async (filename, selectedInsurer, fileBuffer) => {
  try {
    // Detect insurer from PDF content
    const insurerDetectionService = require('../services/insurerDetectionService');
    const detectedInsurer = await insurerDetectionService.detectInsurerFromPDF(fileBuffer);
    
    // Use detected insurer if available, otherwise use selected insurer
    const insurer = detectedInsurer !== 'UNKNOWN' ? detectedInsurer : selectedInsurer;
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    
    console.log(`📁 S3 Key: Using ${insurer} for file ${filename} (detected: ${detectedInsurer}, selected: ${selectedInsurer})`);
    
    return `uploads/${insurer}/${timestamp}_${randomId}.${extension}`;
  } catch (error) {
    console.error('❌ Insurer detection failed, using selected insurer:', error);
    // Fallback to selected insurer if detection fails
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    return `uploads/${selectedInsurer}/${timestamp}_${randomId}.${extension}`;
  }
};

// Generate S3 key for confirmed policies
const generatePolicyS3Key = (policyId, source = 'PDF_UPLOAD') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  
  switch (source) {
    case 'PDF_UPLOAD':
      return `data/policies/confirmed/POL${policyId}_${timestamp}_${randomId}.json`;
    case 'MANUAL_FORM':
      return `data/policies/manual/POL${policyId}_${timestamp}_${randomId}.json`;
    case 'MANUAL_GRID':
      return `data/policies/bulk/BATCH${policyId}_${timestamp}_${randomId}.json`;
    default:
      return `data/policies/other/POL${policyId}_${timestamp}_${randomId}.json`;
  }
};

// Upload JSON data to S3
const uploadJSONToS3 = async (data, key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        dataType: 'policy'
      }
    };

    const result = await s3.upload(params).promise();
    console.log('✅ JSON data uploaded to S3:', result.Location);
    return result;
  } catch (error) {
    console.error('❌ S3 JSON upload error:', error);
    throw error;
  }
};

// Get JSON data from S3
const getJSONFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };

    const result = await s3.getObject(params).promise();
    const data = JSON.parse(result.Body.toString());
    console.log('✅ JSON data retrieved from S3:', key);
    return data;
  } catch (error) {
    console.error('❌ S3 JSON retrieval error:', error);
    throw error;
  }
};

module.exports = {
  s3,
  textract,
  uploadToS3,
  deleteFromS3,
  getS3Url,
  extractTextFromPDF,
  generateS3Key,
  generatePolicyS3Key,
  uploadJSONToS3,
  getJSONFromS3
};

