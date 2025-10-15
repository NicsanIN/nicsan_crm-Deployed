const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const { withPrefix } = require('../utils/s3Prefix');

// AWS Configuration (Primary Storage) - Using IAM Role with SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
  // No credentials needed - using IAM Task Role
});

// Textract Configuration - Using IAM Role with SDK v3
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1'
  // No credentials needed - using IAM Task Role
});

// S3 Configuration Logging (for startup sanity checks)
console.log('[S3] bucket:', process.env.AWS_S3_BUCKET);
console.log('[S3] prefix:', process.env.S3_PREFIX || '(none)');
console.log('[S3] region:', process.env.AWS_REGION || 'us-east-1');

// S3 Helper Functions - SDK v3
const uploadToS3 = async (file, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

    const result = await s3Client.send(command);
    const location = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('✅ File uploaded to S3:', location);
    return { Location: location, ...result };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw error;
  }
};

const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    });

    await s3Client.send(command);
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
    case 'PDF_UPLOAD':
      return withPrefix(`data/policies/confirmed/${timestamp}_${randomId}_${policyId}.json`);
    case 'MANUAL_FORM':
      return withPrefix(`data/policies/manual/${timestamp}_${randomId}_${policyId}.json`);
    case 'BULK_ENTRY':
      return withPrefix(`data/policies/bulk/${timestamp}_${randomId}_${policyId}.json`);
    default:
      return withPrefix(`data/policies/other/${timestamp}_${randomId}_${policyId}.json`);
  }
};

// Upload JSON data to S3 - SDK v3
const uploadJSONToS3 = async (data, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        dataType: 'policy'
      }
    });

    const result = await s3Client.send(command);
    const location = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('✅ JSON data uploaded to S3:', location);
    return { Location: location, ...result };
  } catch (error) {
    console.error('❌ S3 JSON upload error:', error);
    throw error;
  }
};

// Get JSON data from S3 - SDK v3
const getJSONFromS3 = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    });

    const result = await s3Client.send(command);
    const data = JSON.parse(await result.Body.transformToString());
    console.log('✅ JSON data retrieved from S3:', key);
    return data;
  } catch (error) {
    console.error('❌ S3 JSON retrieval error:', error);
    throw error;
  }
};

module.exports = {
  s3Client,
  textractClient,
  uploadToS3,
  deleteFromS3,
  getS3Url,
  extractTextFromPDF,
  generateS3Key,
  generatePolicyS3Key,
  uploadJSONToS3,
  getJSONFromS3
};

