import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// S3 Configuration
export const s3 = new AWS.S3({
  region: process.env.S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  params: {
    Bucket: process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs'
  }
});

// Textract Configuration
export const textract = new AWS.Textract({
  region: process.env.TEXTRACT_REGION || process.env.AWS_REGION || 'ap-south-1',
  apiVersion: '2018-06-27'
});

// Textract service test function
export const testTextractService = async () => {
  try {
    // Test Textract by checking if service is accessible (without actual processing)
    // Use a simple method that exists on the Textract client
    await textract.getDocumentAnalysis({ JobId: 'test-job-id' }).promise();
    return { success: true, message: 'Textract service is accessible' };
  } catch (error: any) {
    if (error.code === 'AccessDeniedException') {
      return { success: false, message: 'Textract service access denied - enable in AWS Console' };
    } else if (error.code === 'UnrecognizedClientException') {
      return { success: false, message: 'Textract service not available in this region' };
    } else if (error.code === 'InvalidJobIdException') {
      // This is expected for a test job ID, but means Textract service is accessible
      return { success: true, message: 'Textract service is accessible (test job ID invalid as expected)' };
    } else {
      return { success: false, message: `Textract service issue: ${error.message}` };
    }
  }
};

// S3 bucket configuration
export const s3Config = {
  bucketName: process.env.S3_BUCKET_NAME || 'nicsan-crm-pdfs',
  region: process.env.S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(','),
};

// File upload validation
export const validateFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > s3Config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${s3Config.maxFileSize / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!s3Config.allowedFileTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Only PDF files are supported.`
    };
  }

  return { valid: true };
};

export default {
  s3,
  textract,
  s3Config,
  validateFile
};
