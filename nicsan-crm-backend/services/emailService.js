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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Motor Insurance Policy</title>
      <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }
        
        /* Container */
        .email-container {
          max-width: 1200px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        /* Header - Desktop: 1200x400px, Mobile: 600x200px */
        .header {
          text-align: center;
          width: 100%;
          max-width: 1200px;
        }
        
        .header img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Content */
        .content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        
        /* Footer - Desktop: 1200x250px, Mobile: 600x125px */
        .footer {
          text-align: center;
          width: 100%;
          max-width: 1200px;
        }
        
        .footer img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Policy details */
        .policy-details { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        
        .highlight { 
          color: #e74c3c; 
          font-weight: bold; 
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            max-width: 600px !important;
          }
          
          .header img {
            content: url('https://nicsan-crm-pdfs.s3.amazonaws.com/email-assets/headers/header-mobile.png') !important;
            width: 600px !important;
            height: 200px !important;
          }
          
          .footer img {
            content: url('https://nicsan-crm-pdfs.s3.amazonaws.com/email-assets/footers/footer-mobile.png') !important;
            width: 600px !important;
            height: 125px !important;
          }
          
          .content {
            padding: 15px !important;
          }
          
          .policy-details table {
            width: 100% !important;
          }
          
          .policy-details td {
            display: block !important;
            width: 100% !important;
            padding: 5px 0 !important;
            border-bottom: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with S3 image -->
        <div class="header">
          <img src="https://nicsan-crm-pdfs.s3.amazonaws.com/email-assets/headers/header-desktop.png" 
               alt="Nicsan Insurance Header" 
               width="1200" 
               height="400"
               style="display: block; width: 100%; height: auto;">
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
      
        <!-- Footer with S3 image and clickable social media -->
        <div class="footer">
          <img src="https://nicsan-crm-pdfs.s3.amazonaws.com/email-assets/footers/footer-desktop.png" 
               alt="Nicsan Insurance Footer" 
               width="1200" 
               height="250"
               usemap="#footerMap"
               style="display: block; width: 100%; height: auto;">
          
          <!-- Image map for clickable social media icons -->
          <map name="footerMap">
            <!-- Instagram icon clickable area -->
            <area shape="rect" 
                  coords="70,100,107,139" 
                  href="https://www.instagram.com/nicsanin?igsh=bzZ2cmFqMHFodzFt&utm_source=qr" 
                  alt="Instagram"
                  target="_blank">
            
            <!-- X (Twitter) icon clickable area -->
            <area shape="rect" 
                  coords="107,139,144,177" 
                  href="https://x.com/nicsanin?s=11" 
                  alt="X (Twitter)"
                  target="_blank">
            
            <!-- LinkedIn icon clickable area -->
            <area shape="rect" 
                  coords="144,177,181,215" 
                  href="https://www.linkedin.com/company/nicsanin/" 
                  alt="LinkedIn"
                  target="_blank">
            
            <!-- Website clickable area -->
            <area shape="rect" 
                  coords="925,100,1000,150" 
                  href="https://nicsanin.com" 
                  alt="Website"
                  target="_blank">
          </map>
        </div>
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
