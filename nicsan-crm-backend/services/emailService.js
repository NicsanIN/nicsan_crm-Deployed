const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
require('dotenv').config();

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send policy PDF to customer email
 * @param {string} customerEmail - Customer's email address
 * @param {Object} policyData - Policy information
 * @param {string} s3Key - S3 key of the PDF file
 * @param {string} originalFilename - Original PDF filename
 * @returns {Promise<Object>} Email sending result
 */
async function sendPolicyPDF(customerEmail, policyData, s3Key, originalFilename) {
  try {
    console.log(`📧 Sending policy PDF to: ${customerEmail}`);
    console.log(`📄 PDF S3 Key: ${s3Key}`);
    
    // Download PDF from S3
    const pdfBuffer = await downloadPDFFromS3(s3Key);
    
    // Generate email content
    const emailContent = generateEmailContent(policyData);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Nicsan Insurance',
        address: process.env.SMTP_USER
      },
      to: customerEmail,
      subject: `Your Motor Insurance Policy - ${policyData.policy_number || 'N/A'}`,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [
        {
          filename: `Policy_${policyData.policy_number || 'Document'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      customerEmail: customerEmail
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error.message,
      customerEmail: customerEmail
    };
  }
}

/**
 * Download PDF from S3
 * @param {string} s3Key - S3 key of the PDF
 * @returns {Promise<Buffer>} PDF buffer
 */
async function downloadPDFFromS3(s3Key) {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };
    
    const result = await s3.getObject(params).promise();
    return result.Body;
    
  } catch (error) {
    console.error('❌ Failed to download PDF from S3:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

/**
 * Generate email content
 * @param {Object} policyData - Policy information
 * @returns {Object} Email content with HTML and text versions
 */
function generateEmailContent(policyData) {
  const {
    customer_name = 'Valued Customer',
    policy_number = 'N/A',
    vehicle_number = 'N/A',
    make = 'N/A',
    model = 'N/A',
    issue_date = 'N/A',
    expiry_date = 'N/A',
    total_premium = 'N/A'
  } = policyData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Motor Insurance Policy</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .policy-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #34495e; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .highlight { color: #e74c3c; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏆 Nicsan Insurance</h1>
        <p>Your Trusted Insurance Partner</p>
      </div>
      
      <div class="content">
        <h2>Dear ${customer_name},</h2>
        
        <p>Your motor insurance policy has been successfully processed and is ready for your use.</p>
        
        <div class="policy-details">
          <h3>📋 Policy Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Policy Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;" class="highlight">${policy_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehicle:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${make} ${model}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Registration Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Valid From:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue_date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Valid Until:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${expiry_date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Premium:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;" class="highlight">₹${total_premium}</td>
            </tr>
          </table>
        </div>
        
        <p><strong>📎 Your policy document is attached to this email.</strong></p>
        
        <p>Please keep this policy document safe and carry it with you while driving. In case of any claims or queries, please contact our customer support team.</p>
        
        <h3>📞 Contact Information</h3>
        <ul>
          <li><strong>Customer Support:</strong> +91-9916131639</li>
          <li><strong>Email:</strong> care@nicsanimf.com</li>
          <li><strong>Website:</strong> www.nicsanin.com</li>
        </ul>
        
        <p>Thank you for choosing Nicsan Insurance for your motor insurance needs!</p>
        
        <p>Best regards,<br>
        <strong>Nicsan Insurance Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated email. Please do not reply to this email.</p>
        <p>© 2024 Nicsan Insurance. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Dear ${customer_name},

Your motor insurance policy has been successfully processed and is ready for your use.

POLICY DETAILS:
- Policy Number: ${policy_number}
- Vehicle: ${make} ${model}
- Registration Number: ${vehicle_number}
- Valid From: ${issue_date}
- Valid Until: ${expiry_date}
- Total Premium: ₹${total_premium}

Your policy document is attached to this email.

Please keep this policy document safe and carry it with you while driving. In case of any claims or queries, please contact our customer support team.

CONTACT INFORMATION:
- Customer Support: +91-9916131639
- Email: care@nicsanimf.com
- Website: www.nicsanin.com

Thank you for choosing Nicsan Insurance for your motor insurance needs!

Best regards,
Nicsan Insurance Team

---
This is an automated email. Please do not reply to this email.
© 2024 Nicsan Insurance. All rights reserved.
  `;
  
  return { html, text };
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} Configuration test result
 */
async function testEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration is invalid:', error);
    return false;
  }
}

/**
 * Send test email
 * @param {string} testEmail - Test email address
 * @returns {Promise<Object>} Test result
 */
async function sendTestEmail(testEmail) {
  try {
    const mailOptions = {
      from: {
        name: 'Nicsan Insurance',
        address: process.env.SMTP_USER
      },
      to: testEmail,
      subject: 'Test Email from Nicsan Insurance',
      html: '<h1>Test Email</h1><p>This is a test email from Nicsan Insurance system.</p>',
      text: 'Test Email\n\nThis is a test email from Nicsan Insurance system.'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPolicyPDF,
  testEmailConfiguration,
  sendTestEmail
};
