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
        
        /* Policy details */
        .policy-details { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        
        .highlight { 
          color: #d7263d; 
          font-weight: bold; 
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            max-width: 600px !important;
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
          
          /* Mobile Social Media Links */
          .social-links a {
            display: block !important;
            width: 80% !important;
            max-width: 200px !important;
            margin: 5px auto !important;
            text-align: center !important;
          }
        }
      
        /* Mobile Responsive for Hybrid Footer */
        @media only screen and (max-width: 600px) {
          .footer {
            height: 125px !important;
            width: 100% !important;
          }
          
          .footer img {
            content: url('https://doidtm1zx7feu.cloudfront.net/footers/footer-mobile.png') !important;
            height: 125px !important;
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with S3 image -->
        <div class="header">
          <img src="https://doidtm1zx7feu.cloudfront.net/headers/header-desktop.png" 
               alt="Nicsan Insurance Header" 
               width="1200" 
               height="400"
               style="display: block; width: 100%; height: auto;">
        </div>
    
        <div class="content">
          <h2>Dear ${customer_name},</h2>
          
          <p>Your policy is set. The PDF is attached and easy to save, quick to share, and always here in your inbox.</p>
          
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
                <td style="padding: 8px;"><strong>Total Premium:</strong></td>
                <td style="padding: 8px;" class="highlight">₹${total_premium}</td>
              </tr>
            </table>
          </div>
          
          <p><strong>📎 You can find your policy pdf down below.</strong></p>
          
          <p>Keep this policy handy—you'll need it if you're ever asked while driving. In case of any claims or queries, please contact our customer support team.</p>
          
          <br><br>
          
          <h3>📞 Contact Information</h3>
          <ul>
            <li><strong>Customer Support:</strong> +91-9916131639</li>
            <li><strong>Email:</strong> care@nicsanimf.com</li>
            <li><strong>Website:</strong> www.nicsanin.com</li>
          </ul>
          
          <h3>🌐 Connect With Us</h3>
          <div class="social-links" style="margin: 15px 0;">
            <a href="https://www.instagram.com/nicsanin?igsh=bzZ2cmFqMHFodzFt&utm_source=qr" 
               target="_blank" 
               style="display: inline-block; margin: 0 10px; padding: 10px 15px; background-color: #004e98; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                📷 Instagram
             </a>
             
             <a href="https://x.com/nicsanin?s=11" 
                target="_blank" 
                style="display: inline-block; margin: 0 10px; padding: 10px 15px; background-color: #004e98; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🐦 X (Twitter)
             </a>
             
             <a href="https://www.linkedin.com/company/nicsanin/" 
                target="_blank" 
                style="display: inline-block; margin: 0 10px; padding: 10px 15px; background-color: #004e98; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                💼 LinkedIn
             </a>
          </div>
          
          <br><br>
          
          <p>Thanks for riding with us.</p>
          
          <p>Stay safe,<br>
          <strong>Nicsan Insurance</strong></p>
        </div>
        
        <!-- Footer with updated design -->
        <div class="footer">
          <img src="https://doidtm1zx7feu.cloudfront.net/footers/footer-desktopUPDATED.png" 
               alt="Nicsan Insurance Footer" 
               width="1200" 
               height="250"
               style="display: block; width: 100%; height: auto;">
        </div>
        
        <p style="margin-top: 20px; font-size: 10px; color: #000000;">™ 2025 Nicsan Insurance. All rights reserved.</p>
      </body>
      </html>
    `;
    
    const text = `
Dear ${customer_name},
      
Your policy is set. The PDF is attached and easy to save, quick to share, and always here in your inbox.
      
POLICY DETAILS:
- Policy Number: ${policy_number}
- Vehicle: ${make} ${model}
- Registration Number: ${vehicle_number}
- Valid From: ${issue_date}
- Valid Until: ${expiry_date}
- Total Premium: ₹${total_premium}
      
You can find your policy pdf down below.
      
Keep this policy handy—you'll need it if you're ever asked while driving. In case of any claims or queries, please contact our customer support team.
      
CONTACT INFORMATION:
- Customer Support: +91-9916131639
- Email: care@nicsanimf.com
- Website: www.nicsanin.com
      
CONNECT WITH US:
- Instagram: https://www.instagram.com/nicsanin?igsh=bzZ2cmFqMHFodzFt&utm_source=qr
- X (Twitter): https://x.com/nicsanin?s=11
- LinkedIn: https://www.linkedin.com/company/nicsanin/
      
Thanks for riding with us.
      
Stay safe,
Nicsan Insurance
      
---
This is an automated email. Please do not reply to this email.
™ 2025 Nicsan Insurance. All rights reserved.
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

/**
 * Send daily Total OD report to founders
 * @param {Object} reportData - Daily OD report data
 * @returns {Promise<Object>} Email sending result
 */
async function sendDailyODReport(reportData) {
  try {
    console.log(`📧 Sending daily OD report for date: ${reportData.date}`);
    
    // Get founder emails from environment
    const founderEmails = [
      process.env.FOUNDER_EMAIL_1,
      process.env.FOUNDER_EMAIL_2
    ].filter(email => email && email.trim() !== '');
    
    if (founderEmails.length === 0) {
      throw new Error('No founder emails configured');
    }
    
    // Generate email content
    const emailContent = generateDailyODReportContent(reportData);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Nicsan CRM System',
        address: process.env.SMTP_USER
      },
      to: founderEmails.join(', '),
      subject: `Daily Total OD Report - ${reportData.date}`,
      html: emailContent.html,
      text: emailContent.text
    };
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Daily OD report email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipients: founderEmails
    };
    
  } catch (error) {
    console.error('❌ Daily OD report email failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate daily OD report email content
 * @param {Object} reportData - Report data
 * @returns {Object} Email content with HTML and text versions
 */
function generateDailyODReportContent(reportData) {
  const { date, summary, branches } = reportData;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Generate HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Total OD Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #004e98;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 0 0 8px 8px;
        }
        .summary {
          background-color: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .branch-section {
          margin: 20px 0;
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #004e98;
        }
        .vehicle-type {
          margin: 10px 0;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 3px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #004e98;
          color: white;
        }
        .highlight {
          font-weight: bold;
          color: #004e98;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Daily Total OD Report</h1>
        <h2>${new Date(date).toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h2>
      </div>
      
      <div class="content">
        <div class="summary">
          <h3>📈 Summary</h3>
          <table>
            <tr>
              <td><strong>Total Policies:</strong></td>
              <td class="highlight">${summary.totalPolicies}</td>
            </tr>
            <tr>
              <td><strong>Total OD Amount:</strong></td>
              <td class="highlight">${formatCurrency(summary.totalOD)}</td>
            </tr>
            <tr>
              <td><strong>Rollover Policies:</strong></td>
              <td>${summary.rolloverCount} (${formatCurrency(summary.rolloverOD)})</td>
            </tr>
            <tr>
              <td><strong>Renewal Policies:</strong></td>
              <td>${summary.renewalCount} (${formatCurrency(summary.renewalOD)})</td>
            </tr>
          </table>
        </div>
        
        ${branches.map(branch => `
          <div class="branch-section">
            <h3>🏢 Branch: ${branch.branchName}</h3>
            <p><strong>Branch Total:</strong> ${formatCurrency(branch.totalOD)} (${branch.totalPolicies} policies)</p>
            
            ${branch.vehicleTypes.map(vehicleType => `
              <div class="vehicle-type">
                <h4>🚗 ${vehicleType.vehicleType}</h4>
                <table>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Policies</th>
                  </tr>
                  <tr>
                    <td>Rollover</td>
                    <td class="highlight">${formatCurrency(vehicleType.rollover.amount)}</td>
                    <td>${vehicleType.rollover.count}</td>
                  </tr>
                  <tr>
                    <td>Renewal</td>
                    <td class="highlight">${formatCurrency(vehicleType.renewal.amount)}</td>
                    <td>${vehicleType.renewal.count}</td>
                  </tr>
                </table>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div class="footer">
          <p><strong>Generated by Nicsan CRM System</strong></p>
          <p>This is an automated daily report. For any queries, please contact the system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Generate text content
  const text = `
DAILY TOTAL OD REPORT - ${new Date(date).toLocaleDateString('en-IN')}
========================================================

SUMMARY:
- Total Policies: ${summary.totalPolicies}
- Total OD Amount: ${formatCurrency(summary.totalOD)}
- Rollover Policies: ${summary.rolloverCount} (${formatCurrency(summary.rolloverOD)})
- Renewal Policies: ${summary.renewalCount} (${formatCurrency(summary.renewalOD)})

BRANCH BREAKDOWN:
${branches.map(branch => `
BRANCH: ${branch.branchName}
Total: ${formatCurrency(branch.totalOD)} (${branch.totalPolicies} policies)

${branch.vehicleTypes.map(vehicleType => `
  ${vehicleType.vehicleType}:
    Rollover: ${formatCurrency(vehicleType.rollover.amount)} (${vehicleType.rollover.count} policies)
    Renewal: ${formatCurrency(vehicleType.renewal.amount)} (${vehicleType.renewal.count} policies)
`).join('')}
`).join('')}

---
Generated by Nicsan CRM System
This is an automated daily report.
  `;
  
  return { html, text };
}

module.exports = {
  sendPolicyPDF,
  testEmailConfiguration,
  sendTestEmail,
  sendDailyODReport
};
