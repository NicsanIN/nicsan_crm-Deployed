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

const getS3Url = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 3600 // URL expires in 1 hour
    };
    
    const url = await s3.getSignedUrl('getObject', params);
    return url;
  } catch (error) {
    console.error('❌ S3 signed URL generation error:', error);
    throw error;
  }
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
const generateS3Key = async (filename, selectedInsurer, fileBuffer, documentType = 'policy') => {
  try {
    let insurer = selectedInsurer;
    
    // Only detect insurer for policy documents
    if (documentType === 'policy') {
      try {
        const insurerDetectionService = require('../services/insurerDetectionService');
        const detectedInsurer = await insurerDetectionService.detectInsurerFromPDF(fileBuffer);
        
        // Use detected insurer if available, otherwise use selected insurer
        insurer = detectedInsurer !== 'UNKNOWN' ? detectedInsurer : selectedInsurer;
        
        console.log(`📁 S3 Key: Using ${insurer} for policy file ${filename} (detected: ${detectedInsurer}, selected: ${selectedInsurer})`);
      } catch (detectionError) {
        console.log(`📁 S3 Key: Insurer detection failed for ${filename}, using selected insurer: ${selectedInsurer}`);
      }
    } else {
      console.log(`📁 S3 Key: Using ${insurer} for ${documentType} file ${filename}`);
    }
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    
    // Document type folder mapping
    const folderMapping = {
      'policy': 'policy_documents',
      'aadhaar': 'aadhaar_cards',
      'pancard': 'pan_cards',
      'rc': 'rc_documents'
    };
    
    const folder = folderMapping[documentType] || 'documents';
    
    // Add environment prefix for staging
    const envPrefix = process.env.ENVIRONMENT === 'staging' ? 'local-staging/' : '';
    return `${envPrefix}uploads/${insurer}/${folder}/${timestamp}_${randomId}.${extension}`;
  } catch (error) {
    console.error('❌ S3 key generation failed, using fallback:', error);
    // Fallback to selected insurer if detection fails
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    const envPrefix = process.env.ENVIRONMENT === 'staging' ? 'local-staging/' : '';
    
    const folderMapping = {
      'policy': 'policy_documents',
      'aadhaar': 'aadhaar_cards',
      'pancard': 'pan_cards',
      'rc': 'rc_documents'
    };
    
    const folder = folderMapping[documentType] || 'documents';
    return `${envPrefix}uploads/${selectedInsurer}/${folder}/${timestamp}_${randomId}.${extension}`;
  }
};

// Generate S3 key for confirmed policies
const generatePolicyS3Key = (policyId, source = 'PDF_UPLOAD') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  
  // Add environment prefix for staging
  const envPrefix = process.env.ENVIRONMENT === 'staging' ? 'local-staging/' : '';
  
  switch (source) {
    case 'MOTOR_MANUAL_FORM':
      return `${envPrefix}data/policies/motor/manual/POL${policyId}_${timestamp}_${randomId}.json`;
    case 'HEALTH_MANUAL_FORM':
      return `${envPrefix}data/policies/health/manual/POL${policyId}_${timestamp}_${randomId}.json`;
    case 'MOTOR_MANUAL_GRID':
      return `${envPrefix}data/policies/motor/bulk/BATCH${policyId}_${timestamp}_${randomId}.json`;
    case 'HEALTH_MANUAL_GRID':
      return `${envPrefix}data/policies/health/bulk/BATCH${policyId}_${timestamp}_${randomId}.json`;
    case 'MOTOR_PDF_UPLOAD':
      return `${envPrefix}data/policies/motor/confirmed/POL${policyId}_${timestamp}_${randomId}.json`;
    case 'HEALTH_PDF_UPLOAD':
      return `${envPrefix}data/policies/health/confirmed/POL${policyId}_${timestamp}_${randomId}.json`;
    default:
      return `${envPrefix}data/policies/other/POL${policyId}_${timestamp}_${randomId}.json`;
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

