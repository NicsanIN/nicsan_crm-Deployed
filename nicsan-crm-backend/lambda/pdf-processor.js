const AWS = require('aws-sdk');
const https = require('https');

// Configure AWS
const textract = new AWS.Textract();
const s3 = new AWS.S3();

// Backend API configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || 'your-internal-token';

exports.handler = async (event) => {
    console.log('Lambda triggered with event:', JSON.stringify(event, null, 2));
    
    try {
        // Process S3 event
        for (const record of event.Records) {
            if (record.eventSource === 'aws:s3' && record.eventName.startsWith('ObjectCreated')) {
                await processPDFUpload(record);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'PDF processing completed successfully' })
        };
    } catch (error) {
        console.error('Lambda execution error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function processPDFUpload(record) {
    const bucketName = record.s3.bucket.name;
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing PDF: ${bucketName}/${s3Key}`);
    
    try {
        // Get S3 object metadata to extract insurer and manual extras
        const s3Object = await s3.headObject({ Bucket: bucketName, Key: s3Key }).promise();
        const insurer = s3Object.Metadata?.insurer || getInsurerFromMetadata(bucketName, s3Key);
        const manualExtras = extractManualExtrasFromMetadata(s3Object.Metadata);
        
        console.log(`Insurer detected: ${insurer}`);
        console.log(`Manual extras found:`, manualExtras);
        
        // Start Textract analysis
        const textractParams = {
            Document: {
                S3Object: {
                    Bucket: bucketName,
                    Name: s3Key
                }
            },
            FeatureTypes: ['FORMS', 'TABLES'],
            ClientRequestToken: `lambda_${Date.now()}`,
            JobTag: `lambda_${s3Key.replace(/[^a-zA-Z0-9]/g, '_')}`
        };
        
        const textractResult = await textract.startDocumentAnalysis(textractParams).promise();
        const jobId = textractResult.JobId;
        
        console.log(`Textract job started: ${jobId}`);
        
        // Poll for completion
        await pollTextractCompletion(jobId);
        
        // Get results
        const blocks = await getTextractResults(jobId);
        
        // Extract policy data
        const extractedData = extractPolicyData(blocks, insurer);
        
        // Merge with manual extras
        const finalData = {
            ...extractedData,
            manual_extras: manualExtras,
            source: 'PDF_UPLOAD',
            processed_at: new Date().toISOString()
        };
        
        console.log('Final extracted data:', finalData);
        
        // Send to backend API
        await sendToBackend(s3Key, finalData);
        
        // Cleanup processed PDF
        await cleanupProcessedPDF(bucketName, s3Key);
        
        console.log(`PDF processing completed: ${s3Key}`);
        
    } catch (error) {
        console.error(`Error processing PDF ${s3Key}:`, error);
        
        // Update backend with error status
        try {
            await updateBackendStatus(s3Key, 'FAILED', { error: error.message });
        } catch (updateError) {
            console.error('Failed to update backend status:', updateError);
        }
        
        throw error;
    }
}

function getInsurerFromMetadata(bucketName, s3Key) {
    // Try to infer from S3 key or bucket name
    if (s3Key.toLowerCase().includes('tata') || bucketName.toLowerCase().includes('tata')) {
        return 'TATA_AIG';
    } else if (s3Key.toLowerCase().includes('digit') || bucketName.toLowerCase().includes('digit')) {
        return 'DIGIT';
    }
    return 'TATA_AIG'; // Default
}

function extractManualExtrasFromMetadata(metadata) {
    const manualExtras = {};
    
    if (metadata) {
        Object.keys(metadata).forEach(key => {
            if (key.startsWith('manual_')) {
                const fieldName = key.replace('manual_', '');
                manualExtras[fieldName] = metadata[key];
            }
        });
    }
    
    return manualExtras;
}

async function pollTextractCompletion(jobId) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const status = await getTextractJobStatus(jobId);
            
            if (status === 'SUCCEEDED') {
                console.log(`Textract job ${jobId} completed successfully`);
                return;
            } else if (status === 'FAILED') {
                throw new Error(`Textract job ${jobId} failed`);
            } else if (status === 'IN_PROGRESS') {
                console.log(`Textract job ${jobId} still in progress...`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                attempts++;
            } else {
                throw new Error(`Unknown Textract job status: ${status}`);
            }
        } catch (error) {
            console.error(`Error checking Textract status:`, error);
            throw error;
        }
    }
    
    throw new Error(`Textract job ${jobId} timed out after ${maxAttempts} attempts`);
}

async function getTextractJobStatus(jobId) {
    const params = { JobId: jobId };
    const result = await textract.getDocumentAnalysis(params).promise();
    return result.JobStatus;
}

async function getTextractResults(jobId) {
    const params = { JobId: jobId };
    const result = await textract.getDocumentAnalysis(params).promise();
    return result.Blocks;
}

function extractPolicyData(blocks, insurer) {
    const extractedData = {};
    let text = '';
    
    // Extract text from blocks
    blocks.forEach(block => {
        if (block.BlockType === 'LINE') {
            text += block.Text + ' ';
        }
    });
    
    // Extract key-value pairs
    const keyValueMap = {};
    blocks.forEach(block => {
        if (block.BlockType === 'KEY_VALUE_SET') {
            if (block.EntityType === 'KEY') {
                const key = getTextFromBlock(block, blocks);
                const valueBlock = blocks.find(b => b.Id === block.Value?.Id);
                const value = valueBlock ? getTextFromBlock(valueBlock, blocks) : '';
                keyValueMap[key.toLowerCase()] = value;
            }
        }
    });
    
    // Map common fields
    extractedData.policy_number = keyValueMap['policy number'] || keyValueMap['policy no'] || keyValueMap['policy'];
    extractedData.vehicle_number = keyValueMap['vehicle number'] || keyValueMap['registration number'] || keyValueMap['reg no'];
    extractedData.insurer = insurer;
    extractedData.issue_date = keyValueMap['issue date'] || keyValueMap['start date'];
    extractedData.expiry_date = keyValueMap['expiry date'] || keyValueMap['end date'];
    extractedData.idv = keyValueMap['idv'] || keyValueMap['insured declared value'];
    extractedData.ncb = keyValueMap['ncb'] || keyValueMap['no claim bonus'];
    extractedData.total_premium = keyValueMap['total premium'] || keyValueMap['premium'];
    extractedData.net_premium = keyValueMap['net premium'] || keyValueMap['basic premium'];
    
    // Apply insurer-specific extraction logic
    if (insurer === 'TATA_AIG') {
        extractTataAIGSpecificData(text, extractedData);
    } else if (insurer === 'DIGIT') {
        extractDigitSpecificData(text, extractedData);
    }
    
    // Also try to extract from general text using regex patterns
    extractFromText(text, extractedData);
    
    // Calculate confidence score based on extracted fields
    const extractedFields = Object.keys(extractedData).filter(key => 
        extractedData[key] !== undefined && extractedData[key] !== '' && extractedData[key] !== null
    ).length;
    const confidenceScore = Math.min(0.95, 0.3 + (extractedFields * 0.05));
    
    return {
        ...extractedData,
        source: 'PDF_UPLOAD',
        confidence_score: confidenceScore,
        insurer: insurer
    };
}

function extractTataAIGSpecificData(text, extractedData) {
    // Tata AIG specific patterns
    const policyMatch = text.match(/Policy\s*No[:\s]*([A-Z0-9-]+)/i);
    if (policyMatch && !extractedData.policy_number) {
        extractedData.policy_number = policyMatch[1];
    }
    
    const vehicleMatch = text.match(/Vehicle\s*No[:\s]*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
    if (vehicleMatch && !extractedData.vehicle_number) {
        extractedData.vehicle_number = vehicleMatch[1];
    }
    
    const premiumMatch = text.match(/Total\s*Premium[:\s]*₹?\s*([\d,]+)/i);
    if (premiumMatch && !extractedData.total_premium) {
        extractedData.total_premium = premiumMatch[1].replace(/,/g, '');
    }
}

function extractDigitSpecificData(text, extractedData) {
    // Digit specific patterns
    const policyMatch = text.match(/Policy\s*Number[:\s]*([A-Z0-9-]+)/i);
    if (policyMatch && !extractedData.policy_number) {
        extractedData.policy_number = policyMatch[1];
    }
    
    const vehicleMatch = text.match(/Registration\s*No[:\s]*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
    if (vehicleMatch && !extractedData.vehicle_number) {
        extractedData.vehicle_number = vehicleMatch[1];
    }
    
    const premiumMatch = text.match(/Premium\s*Amount[:\s]*₹?\s*([\d,]+)/i);
    if (premiumMatch && !extractedData.total_premium) {
        extractedData.total_premium = premiumMatch[1].replace(/,/g, '');
    }
}

function extractFromText(text, extractedData) {
    // General regex patterns for common fields
    if (!extractedData.policy_number) {
        const policyMatch = text.match(/(?:Policy|Policy\s*No)[:\s]*([A-Z0-9-]+)/i);
        if (policyMatch) extractedData.policy_number = policyMatch[1];
    }
    
    if (!extractedData.vehicle_number) {
        const vehicleMatch = text.match(/(?:Vehicle|Registration)\s*No[:\s]*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
        if (vehicleMatch) extractedData.vehicle_number = vehicleMatch[1];
    }
    
    if (!extractedData.issue_date) {
        const issueMatch = text.match(/(?:Issue|Start)\s*Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
        if (issueMatch) extractedData.issue_date = issueMatch[1];
    }
    
    if (!extractedData.expiry_date) {
        const expiryMatch = text.match(/(?:Expiry|End)\s*Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
        if (expiryMatch) extractedData.expiry_date = expiryMatch[1];
    }
    
    if (!extractedData.idv) {
        const idvMatch = text.match(/IDV[:\s]*₹?\s*([\d,]+)/i);
        if (idvMatch) extractedData.idv = idvMatch[1].replace(/,/g, '');
    }
    
    if (!extractedData.ncb) {
        const ncbMatch = text.match(/NCB[:\s]*(\d+)%/i);
        if (ncbMatch) extractedData.ncb = ncbMatch[1];
    }
    
    if (!extractedData.total_premium) {
        const premiumMatch = text.match(/(?:Total\s*)?Premium[:\s]*₹?\s*([\d,]+)/i);
        if (premiumMatch) extractedData.total_premium = premiumMatch[1].replace(/,/g, '');
    }
}

function getTextFromBlock(block, blocks) {
    if (block.Text) return block.Text;
    
    if (block.Relationships) {
        for (const relationship of block.Relationships) {
            if (relationship.Type === 'CHILD') {
                for (const childId of relationship.Ids) {
                    const childBlock = blocks.find(b => b.Id === childId);
                    if (childBlock && childBlock.Text) {
                        return childBlock.Text;
                    }
                }
            }
        }
    }
    
    return '';
}

async function sendToBackend(s3Key, extractedData) {
    const url = `${BACKEND_API_URL}/api/upload/internal/by-s3key/${encodeURIComponent(s3Key)}`;
    
    const postData = JSON.stringify({
        extracted_data: extractedData,
        status: 'REVIEW'
    });
    
    const options = {
        hostname: new URL(BACKEND_API_URL).hostname,
        port: new URL(BACKEND_API_URL).port || (new URL(BACKEND_API_URL).protocol === 'https:' ? 443 : 80),
        path: `/api/upload/internal/by-s3key/${encodeURIComponent(s3Key)}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${INTERNAL_API_TOKEN}`
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('Successfully sent data to backend');
                    resolve(data);
                } else {
                    reject(new Error(`Backend API error: ${res.statusCode} - ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function updateBackendStatus(s3Key, status, additionalData = {}) {
    const url = `${BACKEND_API_URL}/api/upload/internal/by-s3key/${encodeURIComponent(s3Key)}`;
    
    const postData = JSON.stringify({
        status: status,
        ...additionalData
    });
    
    const options = {
        hostname: new URL(BACKEND_API_URL).hostname,
        port: new URL(BACKEND_API_URL).port || (new URL(BACKEND_API_URL).protocol === 'https:' ? 80 : 443),
        path: `/api/upload/internal/by-s3key/${encodeURIComponent(s3Key)}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${INTERNAL_API_TOKEN}`
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('Successfully updated backend status');
                    resolve(data);
                } else {
                    reject(new Error(`Backend API error: ${res.statusCode} - ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function cleanupProcessedPDF(bucketName, s3Key) {
    try {
        await s3.deleteObject({ Bucket: bucketName, Key: s3Key }).promise();
        console.log(`Cleaned up processed PDF: ${s3Key}`);
    } catch (error) {
        console.error(`Failed to cleanup PDF ${s3Key}:`, error);
    }
}



