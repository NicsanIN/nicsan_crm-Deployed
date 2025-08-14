const AWS = require('aws-sdk');
const https = require('https');

// Configure AWS
const textract = new AWS.Textract({ region: process.env.AWS_REGION });
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

// API endpoint for internal updates
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

/**
 * Lambda function triggered by S3 ObjectCreated events
 * Processes PDFs with Textract and updates the API
 */
exports.handler = async (event) => {
  console.log('🔍 Lambda triggered by S3 event:', JSON.stringify(event, null, 2));
  
  try {
    // Process each S3 event
    for (const record of event.Records) {
      if (record.eventName === 'ObjectCreated:Put') {
        await processPDFUpload(record);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'PDF processing completed successfully' })
    };
    
  } catch (error) {
    console.error('❌ Lambda execution failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Process a single PDF upload
 */
async function processPDFUpload(record) {
  const bucketName = record.s3.bucket.name;
  const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`📄 Processing PDF: ${s3Key} from bucket: ${bucketName}`);
  
  try {
    // Step 1: Mark upload as PROCESSING
    await updateUploadStatus(s3Key, 'PROCESSING', { message: 'Lambda processing started' });
    
    // Step 2: Start Textract analysis
    const textractJobId = await startTextractAnalysis(bucketName, s3Key);
    console.log(`🔍 Textract job started: ${textractJobId}`);
    
    // Step 3: Poll Textract until completion
    const textractResult = await pollTextractCompletion(textractJobId);
    console.log(`✅ Textract completed with ${textractResult.blocks?.length || 0} blocks`);
    
    // Step 4: Extract policy data
    const policyData = extractPolicyData(textractResult.blocks);
    console.log(`📊 Extracted policy data:`, policyData);
    
    // Step 5: Create policy record via API
    await createPolicyFromExtractedData(s3Key, policyData);
    
    // Step 6: Mark upload as COMPLETED
    await updateUploadStatus(s3Key, 'COMPLETED', { 
      extractedData: policyData,
      confidence: policyData.confidence_score 
    });
    
    // Step 7: Clean up PDF from S3
    await cleanupPDF(bucketName, s3Key);
    console.log(`🗑️ PDF cleaned up: ${s3Key}`);
    
  } catch (error) {
    console.error(`❌ Failed to process PDF ${s3Key}:`, error);
    
    // Mark upload as FAILED
    await updateUploadStatus(s3Key, 'FAILED', { 
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

/**
 * Start Textract analysis for the PDF
 */
async function startTextractAnalysis(bucketName, s3Key) {
  const params = {
    DocumentLocation: {
      S3Object: {
        Bucket: bucketName,
        Name: s3Key
      }
    },
    FeatureTypes: ['FORMS', 'TABLES'],
    OutputConfig: {
      S3Bucket: bucketName,
      S3Prefix: `textract-output/${Date.now()}/`
    }
  };
  
  const result = await textract.startDocumentAnalysis(params).promise();
  return result.JobId;
}

/**
 * Poll Textract job until completion
 */
async function pollTextractCompletion(jobId) {
  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const result = await textract.getDocumentAnalysis({ JobId: jobId }).promise();
      
      if (result.JobStatus === 'SUCCEEDED') {
        return result;
      } else if (result.JobStatus === 'FAILED') {
        throw new Error(`Textract job failed: ${result.StatusMessage}`);
      } else if (result.JobStatus === 'IN_PROGRESS') {
        console.log(`⏳ Textract in progress: ${result.ProgressPercent || 0}%`);
        await sleep(1000); // Wait 1 second
        attempts++;
      }
    } catch (error) {
      if (error.code === 'InvalidJobId') {
        throw new Error('Invalid Textract job ID');
      }
      throw error;
    }
  }
  
  throw new Error('Textract job timed out');
}

/**
 * Extract policy data from Textract blocks
 */
function extractPolicyData(blocks) {
  if (!blocks || blocks.length === 0) {
    return { confidence_score: 0.0 };
  }
  
  const extractedData = {};
  
  // Extract text from blocks
  const textBlocks = blocks.filter(block => block.BlockType === 'LINE');
  const text = textBlocks.map(block => block.Text).join(' ');
  
  // Extract key-value pairs
  const keyValueBlocks = blocks.filter(block => block.BlockType === 'KEY_VALUE_SET');
  
  keyValueBlocks.forEach(block => {
    if (block.EntityType === 'KEY') {
      const key = block.Key?.Text?.toLowerCase();
      const value = block.Value?.Text;
      
      if (key && value) {
        // Map extracted text to policy fields
        switch (key) {
          case 'policy number':
          case 'policy no':
          case 'policy no.':
            extractedData.policy_number = value;
            break;
          case 'vehicle number':
          case 'vehicle no':
          case 'registration no':
          case 'regn no':
            extractedData.vehicle_number = value;
            break;
          case 'insurer':
          case 'insurance company':
          case 'company':
            extractedData.insurer = value;
            break;
          case 'total premium':
          case 'premium amount':
          case 'premium':
            extractedData.total_premium = parseFloat(value.replace(/[^\d.]/g, ''));
            break;
          case 'issue date':
          case 'start date':
          case 'inception date':
            extractedData.issue_date = value;
            break;
          case 'expiry date':
          case 'end date':
          case 'expiry':
            extractedData.expiry_date = value;
            break;
          case 'idv':
          case 'insured declared value':
            extractedData.idv = parseFloat(value.replace(/[^\d.]/g, ''));
            break;
          case 'ncb':
          case 'no claim bonus':
            extractedData.ncb = parseFloat(value.replace(/[^\d.]/g, ''));
            break;
        }
      }
    }
  });
  
  // Calculate confidence score based on extracted fields
  const extractedFields = Object.keys(extractedData).length;
  const confidenceScore = Math.min(0.95, 0.3 + (extractedFields * 0.1));
  
  return {
    ...extractedData,
    source: 'PDF_UPLOAD',
    confidence_score: confidenceScore,
    extracted_at: new Date().toISOString()
  };
}

/**
 * Update upload status via API
 */
async function updateUploadStatus(s3Key, status, data = {}) {
  const payload = {
    s3Key,
    status,
    ...data
  };
  
  return makeAPICall('PATCH', '/api/uploads/internal/by-s3key', payload);
}

/**
 * Create policy record via API
 */
async function createPolicyFromExtractedData(s3Key, policyData) {
  const payload = {
    s3Key,
    policyData,
    status: 'REVIEW'
  };
  
  return makeAPICall('POST', '/api/uploads/internal/by-s3key/parsed', payload);
}

/**
 * Make API call to internal endpoints
 */
function makeAPICall(method, endpoint, data) {
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`API call failed: ${res.statusCode} - ${responseData}`));
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
 * Clean up PDF from S3 after processing
 */
async function cleanupPDF(bucketName, s3Key) {
  try {
    await s3.deleteObject({
      Bucket: bucketName,
      Key: s3Key
    }).promise();
    
    console.log(`✅ PDF cleaned up: ${s3Key}`);
  } catch (error) {
    console.error(`❌ Failed to cleanup PDF ${s3Key}:`, error);
    // Don't throw error for cleanup failures
  }
}

/**
 * Utility function to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


