const axios = require('axios');
const AWS = require('aws-sdk');
const { query } = require('../config/database');

// WhatsApp Cloud API Configuration
const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com'
};

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Generates the WhatsApp message content for policy notification.
 * @param {Object} policyData - The policy data.
 * @returns {string} The formatted message text.
 */
function generateWhatsAppMessage(policyData) {
  // Ensure policyData fields are not null or undefined for display
  const customerName = policyData.customer_name || 'Customer';
  const policyNumber = policyData.policy_number || 'N/A';
  const vehicleMake = policyData.make || 'N/A';
  const vehicleModel = policyData.model || '';
  const vehicleNumber = policyData.vehicle_number || 'N/A';
  const issueDate = policyData.issue_date ? new Date(policyData.issue_date).toLocaleDateString('en-GB') : 'N/A';
  const expiryDate = policyData.expiry_date ? new Date(policyData.expiry_date).toLocaleDateString('en-GB') : 'N/A';
  const totalPremium = policyData.total_premium ? `₹${policyData.total_premium.toLocaleString('en-IN')}` : 'N/A';

  return `🏆 *Nicsan Insurance*

Dear ${customerName},

Your motor insurance policy has been successfully processed and is ready for your use!

📋 *Policy Details:*
• Policy Number: *${policyNumber}*
• Vehicle: ${vehicleMake} ${vehicleModel}
• Registration: ${vehicleNumber}
• Valid From: ${issueDate}
• Valid Until: ${expiryDate}
• Premium: *${totalPremium}*

📎 Your policy document is attached to this message.

Please keep this policy document safe and carry it with you while driving. In case of any claims or queries, please contact our customer support team.

📞 *Contact Information:*
• Customer Support: +91-XXXX-XXXX
• Email: support@nicsaninsurance.com
• Website: www.nicsaninsurance.com

Thank you for choosing Nicsan Insurance for your motor insurance needs!

Best regards,
*Nicsan Insurance Team*`;
}

/**
 * Gets the PDF S3 key from the pdf_uploads table for a given policy number.
 * @param {string} policyNumber - The policy number to look up.
 * @returns {Promise<Object>} A promise that resolves with the PDF S3 key and filename.
 */
async function getPdfS3KeyFromDatabase(policyNumber) {
  try {
    console.log(`🔍 Looking up PDF S3 key for policy: ${policyNumber}`);
    
    // First, check if policy exists in policies table
    const policyQuery = `
      SELECT policy_number, customer_name, s3_key as policy_s3_key 
      FROM policies 
      WHERE policy_number = $1
    `;
    
    const policyResult = await query(policyQuery, [policyNumber]);
    
    if (!policyResult.rows || policyResult.rows.length === 0) {
      console.log(`❌ Policy ${policyNumber} not found in policies table`);
      return { success: false, error: 'Policy not found' };
    }
    
    const policy = policyResult.rows[0];
    console.log(`📋 Policy found: ${policy.policy_number} - ${policy.customer_name}`);
    
    // Search for PDF by policy number in manual_extras JSONB field (PRIMARY METHOD)
    console.log('🔍 Searching for PDF by policy number in manual_extras...');
    
    const pdfQuery = `
      SELECT s3_key, filename, upload_id, status
      FROM pdf_uploads 
      WHERE manual_extras->>'policy_number' = $1 
      AND status IN ('COMPLETED', 'UPLOADED', 'SAVED')
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const pdfResult = await query(pdfQuery, [policyNumber]);
    
    if (pdfResult.rows && pdfResult.rows.length > 0) {
      const pdf = pdfResult.rows[0];
      console.log(`✅ PDF found by manual_extras search: ${pdf.filename} (${pdf.status})`);
      return {
        success: true,
        s3Key: pdf.s3_key,
        filename: pdf.filename,
        uploadId: pdf.upload_id
      };
    } else {
      console.log(`❌ No PDF found in manual_extras for policy ${policyNumber}`);
      
      // FALLBACK 1: Search by policy number in filename
      console.log('🔍 Fallback 1: Searching by policy number in filename...');
      
      const filenameQuery = `
        SELECT s3_key, filename, upload_id, status
        FROM pdf_uploads 
        WHERE filename ILIKE $1 
        AND status IN ('COMPLETED', 'UPLOADED', 'SAVED')
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const filenameResult = await query(filenameQuery, [`%${policyNumber}%`]);
      
      if (filenameResult.rows && filenameResult.rows.length > 0) {
        const pdf = filenameResult.rows[0];
        console.log(`✅ PDF found by filename search: ${pdf.filename} (${pdf.status})`);
        return {
          success: true,
          s3Key: pdf.s3_key,
          filename: pdf.filename,
          uploadId: pdf.upload_id
        };
      } else {
        console.log(`❌ No PDF found by filename search`);
        
        // FALLBACK 2: Search with partial policy number
        const partialPolicyNumber = policyNumber.substring(0, 8); // First 8 digits
        console.log(`🔍 Fallback 2: Trying partial search with: ${partialPolicyNumber}`);
        
        const partialPdfQuery = `
          SELECT s3_key, filename, upload_id, status
          FROM pdf_uploads 
          WHERE filename ILIKE $1 
          AND status IN ('COMPLETED', 'UPLOADED', 'SAVED')
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const partialPdfResult = await query(partialPdfQuery, [`%${partialPolicyNumber}%`]);
        
        if (partialPdfResult.rows && partialPdfResult.rows.length > 0) {
          const pdf = partialPdfResult.rows[0];
          console.log(`✅ PDF found by partial search: ${pdf.filename} (${pdf.status})`);
          return {
            success: true,
            s3Key: pdf.s3_key,
            filename: pdf.filename,
            uploadId: pdf.upload_id
          };
        } else {
          console.log(`❌ No PDF found even with partial search`);
          
          // FALLBACK 3: Search by creation date proximity (last 24 hours)
          console.log('🔍 Fallback 3: Searching by creation date proximity...');
          
          const dateQuery = `
            SELECT s3_key, filename, upload_id, status
            FROM pdf_uploads 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            AND status IN ('COMPLETED', 'UPLOADED', 'SAVED')
            ORDER BY created_at DESC 
            LIMIT 1
          `;
          
          const dateResult = await query(dateQuery);
          
          if (dateResult.rows && dateResult.rows.length > 0) {
            const pdf = dateResult.rows[0];
            console.log(`✅ PDF found by date proximity: ${pdf.filename} (${pdf.status})`);
            return {
              success: true,
              s3Key: pdf.s3_key,
              filename: pdf.filename,
              uploadId: pdf.upload_id
            };
          } else {
            console.log(`❌ No PDF found with any search method`);
            return { success: false, error: 'No PDF found for this policy' };
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to get PDF S3 key from database:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Downloads a PDF file from AWS S3.
 * @param {string} s3Key - The S3 key of the PDF file.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF file buffer.
 */
async function downloadPDFFromS3(s3Key) {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };

    const result = await s3.getObject(params).promise();
    return result.Body; // Returns PDF as buffer
  } catch (error) {
    console.error('❌ Failed to download PDF from S3:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

/**
 * Sends a text message via WhatsApp Cloud API.
 * @param {string} phoneNumber - The recipient's phone number (with country code).
 * @param {string} message - The message text to send.
 * @returns {Promise<Object>} A promise that resolves with the message sending result.
 */
async function sendTextMessage(phoneNumber, message) {
  try {
    const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp text message sent successfully:', response.data.messages[0].id);
    return {
      success: true,
      messageId: response.data.messages[0].id
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp text message:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Sends a template message via WhatsApp Cloud API.
 * @param {string} phoneNumber - The recipient's phone number (with country code).
 * @param {string} templateName - The template name.
 * @param {Array} parameters - Template parameters.
 * @returns {Promise<Object>} A promise that resolves with the template message sending result.
 */
async function sendTemplateMessage(phoneNumber, templateName, parameters) {
  try {
    const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: parameters.map(param => ({ 
              type: 'text', 
              text: String(param || '').trim() 
            }))
          }
        ]
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp template message sent successfully:', response.data.messages[0].id);
    return {
      success: true,
      messageId: response.data.messages[0].id
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp template message:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Sends a PDF document via WhatsApp Cloud API.
 * @param {string} phoneNumber - The recipient's phone number (with country code).
 * @param {Buffer} pdfBuffer - The PDF file buffer.
 * @param {string} filename - The filename for the PDF.
 * @returns {Promise<Object>} A promise that resolves with the document sending result.
 */
async function sendPDFDocument(phoneNumber, pdfBuffer, filename) {
  try {
    // First, upload the PDF to WhatsApp's media API to get a media ID
    const mediaUrl = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/media`;
    
    // Upload the PDF as form data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', pdfBuffer, {
      filename: filename,
      contentType: 'application/pdf'
    });
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');

    const mediaResponse = await axios.post(mediaUrl, form, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        ...form.getHeaders()
      }
    });

    const mediaId = mediaResponse.data.id;
    console.log('✅ PDF uploaded to WhatsApp media API:', mediaId);

    // Now send the document using the media ID
    const messageUrl = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'document',
      document: {
        id: mediaId,
        filename: filename
      }
    };

    const response = await axios.post(messageUrl, payload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp PDF document sent successfully:', response.data.messages[0].id);
    return {
      success: true,
      messageId: response.data.messages[0].id
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp PDF document:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Sends a policy PDF to the customer's WhatsApp as an attachment.
 * @param {string} customerPhone - The recipient's phone number (with country code).
 * @param {Object} policyData - The policy details.
 * @param {string} pdfS3Key - The S3 key of the PDF to attach (optional, will be looked up if not provided).
 * @param {string} pdfFilename - The desired filename for the attachment (optional, will be looked up if not provided).
 * @returns {Promise<Object>} A promise that resolves with the WhatsApp sending result.
 */
async function sendPolicyWhatsApp(customerPhone, policyData, pdfS3Key = null, pdfFilename = null) {
  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
    
    console.log('📱 Sending policy via WhatsApp to:', formattedPhone);

    // Use provided S3 key and filename (passed directly from upload route)
    let actualPdfS3Key = pdfS3Key;
    let actualPdfFilename = pdfFilename;
    
    if (!actualPdfS3Key && policyData.policy_number) {
      console.log('🔍 PDF S3 key not provided, looking up from database...');
      const pdfLookup = await getPdfS3KeyFromDatabase(policyData.policy_number);
      
      if (pdfLookup.success) {
        actualPdfS3Key = pdfLookup.s3Key;
        actualPdfFilename = pdfLookup.filename;
        console.log(`✅ Using PDF from database: ${actualPdfFilename}`);
      } else {
        console.log('⚠️ No PDF found in database, will send text message only');
        // Don't return error, just continue without PDF
      }
    } else if (actualPdfS3Key) {
      console.log(`✅ Using provided PDF S3 key: ${actualPdfS3Key}`);
      console.log(`✅ Using provided PDF filename: ${actualPdfFilename}`);
    }
    
    if (!actualPdfS3Key) {
      console.log('⚠️ No PDF available, sending text message only...');
      
      // Send text message only when no PDF is available
      const templateParameters = [
        policyData.customer_name || 'Customer',
        policyData.policy_number || 'N/A',
        policyData.make || 'N/A',
        policyData.model || '',
        policyData.vehicle_number || 'N/A',
        policyData.total_premium ? `₹${policyData.total_premium.toLocaleString('en-IN')}` : 'N/A'
      ];

      console.log('📤 Sending template message (no PDF)...');
      const textResult = await sendTemplateMessage(formattedPhone, 'policy', templateParameters);
      
      if (!textResult.success) {
        console.error('⚠️ WhatsApp template message failed:', textResult.error);
        return {
          success: false,
          error: `Template message failed: ${textResult.error}`
        };
      }

      console.log('✅ Policy notification sent via WhatsApp (text only)');
      return {
        success: true,
        textMessageId: textResult.messageId,
        documentMessageId: null,
        message: 'Text message sent (no PDF available)'
      };
    }

    // Download PDF from S3
    console.log(`📥 Downloading PDF from S3: ${actualPdfS3Key}`);
    const pdfBuffer = await downloadPDFFromS3(actualPdfS3Key);

    // Prepare template parameters
    const templateParameters = [
      policyData.customer_name || 'Customer',
      policyData.policy_number || 'N/A',
      policyData.make || 'N/A',
      policyData.model || '',
      policyData.vehicle_number || 'N/A',
      policyData.total_premium ? `₹${policyData.total_premium.toLocaleString('en-IN')}` : 'N/A'
    ];

    // Send template message first (bypasses 24-hour window restriction)
    console.log('📤 Sending template message...');
    const textResult = await sendTemplateMessage(formattedPhone, 'policy', templateParameters);
    
    if (!textResult.success) {
      console.error('⚠️ WhatsApp template message failed:', textResult.error);
      return {
        success: false,
        error: `Template message failed: ${textResult.error}`
      };
    }

    // Send PDF document
    console.log('📤 Sending PDF document...');
    const pdfResult = await sendPDFDocument(
      formattedPhone, 
      pdfBuffer, 
      actualPdfFilename || `Policy_${policyData.policy_number || 'Document'}.pdf`
    );

    if (!pdfResult.success) {
      console.error('⚠️ WhatsApp PDF document failed:', pdfResult.error);
      return {
        success: false,
        error: `PDF document failed: ${pdfResult.error}`
      };
    }

    console.log('✅ Policy sent via WhatsApp successfully');
    return {
      success: true,
      textMessageId: textResult.messageId,
      documentMessageId: pdfResult.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send policy via WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tests the WhatsApp configuration by sending a simple test message.
 * @param {string} testPhoneNumber - The phone number to send the test message to.
 * @returns {Promise<Object>} A promise that resolves with the test message sending result.
 */
async function sendTestWhatsApp(testPhoneNumber) {
  try {
    const formattedPhone = testPhoneNumber.startsWith('+') ? testPhoneNumber : `+91${testPhoneNumber}`;
    
    const testMessage = `🏆 *Nicsan Insurance Test*

This is a test message from Nicsan CRM WhatsApp integration.

If you received this message, the WhatsApp service is working correctly!

Best regards,
*Nicsan Insurance Team*`;

    const result = await sendTextMessage(formattedPhone, testMessage);
    
    if (result.success) {
      console.log('✅ WhatsApp test message sent successfully:', result.messageId);
    }
    
    return result;
  } catch (error) {
    console.error('❌ WhatsApp test message failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifies the WhatsApp Cloud API configuration by checking access token.
 * @returns {Promise<Object>} A promise that resolves with the configuration test result.
 */
async function testWhatsAppConfiguration() {
  try {
    const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`
      }
    });

    console.log('✅ WhatsApp configuration is valid');
    console.log(`   Phone Number ID: ${whatsappConfig.phoneNumberId}`);
    console.log(`   Display Name: ${response.data.display_phone_number}`);
    
    return { 
      success: true, 
      message: 'WhatsApp configuration is valid',
      phoneNumber: response.data.display_phone_number
    };
  } catch (error) {
    console.error('❌ WhatsApp configuration is invalid:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
}

module.exports = {
  sendPolicyWhatsApp,
  sendTestWhatsApp,
  testWhatsAppConfiguration,
  sendTextMessage,
  sendTemplateMessage,
  sendPDFDocument,
  getPdfS3KeyFromDatabase
};
