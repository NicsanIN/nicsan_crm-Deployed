const axios = require('axios');
const AWS = require('aws-sdk');

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
 * Sends a PDF document via WhatsApp Cloud API.
 * @param {string} phoneNumber - The recipient's phone number (with country code).
 * @param {Buffer} pdfBuffer - The PDF file buffer.
 * @param {string} filename - The filename for the PDF.
 * @returns {Promise<Object>} A promise that resolves with the document sending result.
 */
async function sendPDFDocument(phoneNumber, pdfBuffer, filename) {
  try {
    // First, upload the PDF to a temporary URL or use WhatsApp's media API
    const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'document',
      document: {
        filename: filename,
        data: pdfBuffer.toString('base64'),
        mime_type: 'application/pdf'
      }
    };

    const response = await axios.post(url, payload, {
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
 * @param {string} pdfS3Key - The S3 key of the PDF to attach.
 * @param {string} pdfFilename - The desired filename for the attachment.
 * @returns {Promise<Object>} A promise that resolves with the WhatsApp sending result.
 */
async function sendPolicyWhatsApp(customerPhone, policyData, pdfS3Key, pdfFilename) {
  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
    
    console.log('📱 Sending policy via WhatsApp to:', formattedPhone);

    // Download PDF from S3
    const pdfBuffer = await downloadPDFFromS3(pdfS3Key);

    // Generate message content
    const messageContent = generateWhatsAppMessage(policyData);

    // Send text message first
    const textResult = await sendTextMessage(formattedPhone, messageContent);
    
    if (!textResult.success) {
      console.error('⚠️ WhatsApp text message failed:', textResult.error);
      return {
        success: false,
        error: `Text message failed: ${textResult.error}`
      };
    }

    // Send PDF document
    const pdfResult = await sendPDFDocument(
      formattedPhone, 
      pdfBuffer, 
      pdfFilename || `Policy_${policyData.policy_number || 'Document'}.pdf`
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
  sendPDFDocument
};
