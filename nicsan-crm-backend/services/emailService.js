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
      process.env.FOUNDER_EMAIL_2,
      process.env.FOUNDER_EMAIL_3
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
  const { date, summary, branches, dailyBreakdown = [], monthlyBreakdown = [] } = reportData;
  
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
        
        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px !important;
            font-size: 14px !important;
          }
          
          .header {
            padding: 15px !important;
          }
          
          .header h1 {
            font-size: 20px !important;
            margin: 5px 0 !important;
          }
          
          .header h2 {
            font-size: 16px !important;
            margin: 5px 0 !important;
          }
          
          .content {
            padding: 15px !important;
          }
          
          .summary {
            padding: 12px !important;
            margin: 15px 0 !important;
          }
          
          .branch-section {
            margin: 15px 0 !important;
            padding: 12px !important;
          }
          
          .vehicle-type {
            margin: 8px 0 !important;
            padding: 8px !important;
          }
          
          /* Mobile Table Styles */
          table {
            font-size: 12px !important;
            width: 100% !important;
            display: block !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
          }
          
          th, td {
            padding: 6px 8px !important;
            font-size: 12px !important;
            min-width: 60px !important;
          }
          
          /* Mobile Summary Table - Stack on very small screens */
          .summary table {
            display: table !important;
          }
          
          .summary td {
            display: block !important;
            width: 100% !important;
            padding: 4px 0 !important;
            border-bottom: 1px solid #eee !important;
          }
          
          .summary td:first-child {
            font-weight: bold !important;
            color: #004e98 !important;
          }
          
          /* Mobile Branch Details Table - Horizontal Scroll */
          .vehicle-type table {
            display: block !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .vehicle-type th,
          .vehicle-type td {
            white-space: nowrap !important;
            min-width: 80px !important;
          }
          
          /* Mobile Daily/Monthly Breakdown Tables - Add Heading Only */
          .breakdown-table {
            display: block !important;
          }
          
          .breakdown-table thead {
            display: none !important;
          }
          
          .breakdown-table tbody {
            display: block !important;
          }
          
          .breakdown-table tr {
            display: block !important;
            background: white !important;
            margin: 10px 0 !important;
            padding: 12px !important;
            border-radius: 5px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            border: 1px solid #ddd !important;
          }
          
          .breakdown-table tr:before {
            content: attr(data-date) !important;
            font-weight: bold !important;
            color: #004e98 !important;
            font-size: 16px !important;
            margin-bottom: 10px !important;
            padding-bottom: 8px !important;
            border-bottom: 2px solid #004e98 !important;
            display: block !important;
          }

          /* Hide explicit Date/Month cell on mobile to avoid duplication */
          .breakdown-table td.date-cell {
            display: none !important;
          }
          
          .breakdown-table td {
            display: block !important;
            width: 100% !important;
            padding: 4px 0 !important;
            border: none !important;
            text-align: left !important;
          }
          
          .breakdown-table td:before {
            content: attr(data-label) ": " !important;
            font-weight: bold !important;
            color: #004e98 !important;
            display: inline-block !important;
            width: 80px !important;
          }

          /* Hide explicit Date/Month cell on mobile to avoid duplication */
          .breakdown-table td.date-cell {
            display: none !important;
          }
          
          .footer {
            padding: 15px !important;
            margin-top: 20px !important;
          }
          
          .footer p {
            font-size: 12px !important;
            margin: 5px 0 !important;
          }
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
               
               ${dailyBreakdown.length > 0 ? `
                 <div class="branch-section">
                   <h3>📊 Daily Total OD Breakdown (Last 7 Days)</h3>
                   <table class="breakdown-table">
                     <thead>
                       <tr>
                         <th>Date</th>
                         <th>Policies</th>
                         <th>Total OD</th>
                         <th>Avg OD</th>
                         <th>Max OD</th>
                       </tr>
                     </thead>
                     <tbody>
                       ${dailyBreakdown.map(day => `
                         <tr data-date="${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}">
                            <td class="date-cell">${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                           <td data-label="Policies">${day.policyCount}</td>
                           <td data-label="Total OD" class="highlight">${formatCurrency(day.totalOD)}</td>
                           <td data-label="Avg OD">${formatCurrency(day.avgODPerPolicy)}</td>
                           <td data-label="Max OD">${formatCurrency(day.maxOD)}</td>
                         </tr>
                       `).join('')}
                     </tbody>
                   </table>
                 </div>
               ` : ''}
               
               ${monthlyBreakdown.length > 0 ? `
                 <div class="branch-section">
                   <h3>📈 Monthly Total OD Breakdown (Last 12 Months)</h3>
                   <table class="breakdown-table">
                     <thead>
                       <tr>
                         <th>Month</th>
                         <th>Policies</th>
                         <th>Total OD</th>
                         <th>Avg OD</th>
                         <th>Max OD</th>
                       </tr>
                     </thead>
                     <tbody>
                       ${monthlyBreakdown.map(month => `
                         <tr data-date="${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}">
                            <td class="date-cell">${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                           <td data-label="Policies">${month.policyCount}</td>
                           <td data-label="Total OD" class="highlight">${formatCurrency(month.totalOD)}</td>
                           <td data-label="Avg OD">${formatCurrency(month.avgODPerPolicy)}</td>
                           <td data-label="Max OD">${formatCurrency(month.maxOD)}</td>
                         </tr>
                       `).join('')}
                     </tbody>
                   </table>
                 </div>
               ` : ''}
               
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
   
   ${dailyBreakdown.length > 0 ? `
   DAILY TOTAL OD BREAKDOWN (Last 7 Days):
   ======================================
   ${dailyBreakdown.map(day => `
   ${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}:
     Policies: ${day.policyCount}
     Total OD: ${formatCurrency(day.totalOD)}
     Avg OD: ${formatCurrency(day.avgODPerPolicy)}
     Max OD: ${formatCurrency(day.maxOD)}
   `).join('')}
   ` : ''}
   
   ${monthlyBreakdown.length > 0 ? `
   MONTHLY TOTAL OD BREAKDOWN (Last 12 Months):
   ============================================
   ${monthlyBreakdown.map(month => `
   ${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}:
     Policies: ${month.policyCount}
     Total OD: ${formatCurrency(month.totalOD)}
     Avg OD: ${formatCurrency(month.avgODPerPolicy)}
     Max OD: ${formatCurrency(month.maxOD)}
   `).join('')}
   ` : ''}
   
   ---
   Generated by Nicsan CRM System
   This is an automated daily report.
   `;
  
  return { html, text };
}

/**
 * Send branch-specific daily Total OD report to branch head
 * @param {Object} reportData - Branch-specific report data
 * @param {string} branch - Branch name
 * @returns {Promise<Object>} Email sending result
 */
async function sendBranchODReport(reportData, branch) {
  try {
    console.log(`📧 Sending ${branch} branch daily OD report for date: ${reportData.date}`);
    
    // Get branch head email from environment
    const branchHeadEmail = getBranchHeadEmail(branch);
    
    if (!branchHeadEmail) {
      throw new Error(`No email configured for ${branch} branch head`);
    }
    
    // Generate branch-specific email content
    const emailContent = generateBranchODReportContent(reportData, branch);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Nicsan CRM System',
        address: process.env.SMTP_USER
      },
      to: branchHeadEmail,
      subject: `Daily Total OD Report - ${branch} Branch - ${reportData.date}`,
      html: emailContent.html,
      text: emailContent.text
    };
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ ${branch} branch daily OD report email sent successfully:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipients: [branchHeadEmail]
    };
    
  } catch (error) {
    console.error(`❌ ${branch} branch daily OD report email failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get branch head email from environment variables
 * @param {string} branch - Branch name
 * @returns {string|null} Branch head email address
 */
function getBranchHeadEmail(branch) {
  const branchEmails = {
    'MYSORE': process.env.MYSORE_BRANCH_HEAD_EMAIL,
    'BANASHANKARI': process.env.BANASHANKARI_BRANCH_HEAD_EMAIL,
    'ADUGODI': process.env.ADUGODI_BRANCH_HEAD_EMAIL
  };
  
  return branchEmails[branch] || null;
}

/**
 * Send weekly rollover report to branch head
 * @param {Object} reportData - Weekly rollover report data with reps array
 * @param {string} branch - Branch name
 * @returns {Promise<Object>} Email sending result
 */
async function sendWeeklyRolloverReport(reportData, branch) {
  try {
    console.log(`📧 Sending ${branch} branch weekly rollover report for week: ${reportData.weekStart} to ${reportData.weekEnd}`);
    
    // Get branch head email from environment
    const branchHeadEmail = getBranchHeadEmail(branch);
    
    if (!branchHeadEmail) {
      throw new Error(`No email configured for ${branch} branch head`);
    }
    
    // Generate weekly rollover email content
    const emailContent = generateWeeklyRolloverEmailContent(reportData, branch);
    
    // Format week period for subject
    const formatWeekPeriod = (start, end) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const endFormatted = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    };
    
    const weekPeriod = formatWeekPeriod(reportData.weekStart, reportData.weekEnd);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Nicsan CRM System',
        address: process.env.SMTP_USER
      },
      to: branchHeadEmail,
      subject: `Weekly Rollover Report - ${branch} Branch - ${weekPeriod}`,
      html: emailContent.html,
      text: emailContent.text
    };
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ ${branch} branch weekly rollover report email sent successfully:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipients: [branchHeadEmail]
    };
    
  } catch (error) {
    console.error(`❌ ${branch} branch weekly rollover report email failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate weekly rollover email content (simple 2-column table)
 * @param {Object} reportData - Weekly rollover report data
 * @param {string} branch - Branch name
 * @returns {Object} Email content with HTML and text versions
 */
function generateWeeklyRolloverEmailContent(reportData, branch) {
  const { weekStart, weekEnd, reps, total } = reportData;
  
  // Format week period
  const formatWeekPeriod = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startFormatted = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endFormatted = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };
  
  const weekPeriod = formatWeekPeriod(weekStart, weekEnd);
  
  // Generate HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Rollover Report - ${branch} Branch</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        .week-info {
          background-color: #ecf0f1;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: #ffffff;
        }
        th {
          background-color: #3498db;
          color: #ffffff;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .total-row {
          background-color: #ecf0f1;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #7f8c8d;
          font-size: 12px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Weekly Rollover Report - ${branch} Branch</h1>
        
        <div class="week-info">
          <strong>Week Period:</strong> ${weekPeriod}
        </div>
        
        <h2>Telecaller Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Telecaller Name</th>
              <th>Converted Policies</th>
            </tr>
          </thead>
          <tbody>
            ${reps.length > 0 ? reps.map(rep => `
              <tr>
                <td>${rep.name}</td>
                <td>${rep.converted}</td>
              </tr>
            `).join('') : '<tr><td colspan="2" style="text-align: center; color: #7f8c8d;">No rollover policies for this week</td></tr>'}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td><strong>${total}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>This is an automated report from Nicsan CRM System.</p>
          <p>Report generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Generate text content
  const text = `
📊 Weekly Rollover Report - ${branch} Branch
Week: ${weekPeriod}

Telecaller Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Telecaller Name        | Converted Policies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reps.length > 0 ? reps.map(rep => `${rep.name.padEnd(23)}| ${rep.converted}`).join('\n') : 'No rollover policies for this week'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                 | ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated report from Nicsan CRM System.
Report generated on ${new Date().toLocaleString('en-IN')}
  `;
  
  return { html, text };
}

/**
 * Generate branch-specific daily OD report email content
 * @param {Object} reportData - Branch-specific report data
 * @param {string} branch - Branch name
 * @returns {Object} Email content with HTML and text versions
 */
function generateBranchODReportContent(reportData, branch) {
  const { date, summary, branches, dailyBreakdown = [], monthlyBreakdown = [] } = reportData;
  
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
      <title>Daily Total OD Report - ${branch} Branch</title>
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
        
        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px !important;
            font-size: 14px !important;
          }
          
          .header {
            padding: 15px !important;
          }
          
          .header h1 {
            font-size: 18px !important;
            margin: 5px 0 !important;
          }
          
          .header h2 {
            font-size: 14px !important;
            margin: 5px 0 !important;
          }
          
          .content {
            padding: 15px !important;
          }
          
          .summary {
            padding: 12px !important;
            margin: 15px 0 !important;
          }
          
          .branch-section {
            margin: 15px 0 !important;
            padding: 12px !important;
          }
          
          .vehicle-type {
            margin: 8px 0 !important;
            padding: 8px !important;
          }
          
          /* Mobile Table Styles */
          table {
            font-size: 12px !important;
            width: 100% !important;
            display: block !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
          }
          
          th, td {
            padding: 6px 8px !important;
            font-size: 12px !important;
            min-width: 60px !important;
          }
          
          /* Mobile Summary Table - Stack on very small screens */
          .summary table {
            display: table !important;
          }
          
          .summary td {
            display: block !important;
            width: 100% !important;
            padding: 4px 0 !important;
            border-bottom: 1px solid #eee !important;
          }
          
          .summary td:first-child {
            font-weight: bold !important;
            color: #004e98 !important;
          }
          
          /* Mobile Branch Details Table - Horizontal Scroll */
          .vehicle-type table {
            display: block !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .vehicle-type th,
          .vehicle-type td {
            white-space: nowrap !important;
            min-width: 80px !important;
          }
          
          /* Mobile Daily/Monthly Breakdown Tables - Add Heading Only */
          .breakdown-table {
            display: block !important;
          }
          
          .breakdown-table thead {
            display: none !important;
          }
          
          .breakdown-table tbody {
            display: block !important;
          }
          
          .breakdown-table tr {
            display: block !important;
            background: white !important;
            margin: 10px 0 !important;
            padding: 12px !important;
            border-radius: 5px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            border: 1px solid #ddd !important;
          }
          
          .breakdown-table tr:before {
            content: attr(data-date) !important;
            font-weight: bold !important;
            color: #004e98 !important;
            font-size: 16px !important;
            margin-bottom: 10px !important;
            padding-bottom: 8px !important;
            border-bottom: 2px solid #004e98 !important;
            display: block !important;
          }
          
          .breakdown-table td {
            display: block !important;
            width: 100% !important;
            padding: 4px 0 !important;
            border: none !important;
            text-align: left !important;
          }
          
          .breakdown-table td:before {
            content: attr(data-label) ": " !important;
            font-weight: bold !important;
            color: #004e98 !important;
            display: inline-block !important;
            width: 80px !important;
          }
          
          .footer {
            padding: 15px !important;
            margin-top: 20px !important;
          }
          
          .footer p {
            font-size: 12px !important;
            margin: 5px 0 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Daily Total OD Report - ${branch} Branch</h1>
        <h2>${new Date(date).toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h2>
      </div>
      
      <div class="content">
        <div class="summary">
          <h3>📈 ${branch} Branch Summary</h3>
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
          </table>
        </div>
        
        ${branches.map(branchData => `
          <div class="branch-section">
            <h3>🏢 ${branchData.branchName} Branch Details</h3>
            <p><strong>Branch Total:</strong> ${formatCurrency(branchData.totalOD)} (${branchData.totalPolicies} policies)</p>
            
            ${branchData.vehicleTypes.map(vehicleType => `
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
                </table>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        ${dailyBreakdown.length > 0 ? `
          <div class="branch-section">
            <h3>📊 Daily Total OD Breakdown - ${branch} Branch (Last 7 Days)</h3>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Policies</th>
                  <th>Total OD</th>
                  <th>Avg OD</th>
                  <th>Max OD</th>
                </tr>
              </thead>
              <tbody>
                ${dailyBreakdown.map(day => `
                  <tr data-date="${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}">
                    <td class="date-cell">${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td data-label="Policies">${day.policyCount}</td>
                    <td data-label="Total OD" class="highlight">${formatCurrency(day.totalOD)}</td>
                    <td data-label="Avg OD">${formatCurrency(day.avgODPerPolicy)}</td>
                    <td data-label="Max OD">${formatCurrency(day.maxOD)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${monthlyBreakdown.length > 0 ? `
          <div class="branch-section">
            <h3>📈 Monthly Total OD Breakdown - ${branch} Branch (Last 12 Months)</h3>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Policies</th>
                  <th>Total OD</th>
                  <th>Avg OD</th>
                  <th>Max OD</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyBreakdown.map(month => `
                  <tr data-date="${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}">
                    <td class="date-cell">${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                    <td data-label="Policies">${month.policyCount}</td>
                    <td data-label="Total OD" class="highlight">${formatCurrency(month.totalOD)}</td>
                    <td data-label="Avg OD">${formatCurrency(month.avgODPerPolicy)}</td>
                    <td data-label="Max OD">${formatCurrency(month.maxOD)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>Generated by Nicsan CRM System</strong></p>
          <p>This is an automated daily report for ${branch} branch. For any queries, please contact the system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Generate text content
  const text = `
DAILY TOTAL OD REPORT - ${branch} BRANCH - ${new Date(date).toLocaleDateString('en-IN')}
========================================================

${branch} BRANCH SUMMARY:
- Total Policies: ${summary.totalPolicies}
- Total OD Amount: ${formatCurrency(summary.totalOD)}
- Rollover Policies: ${summary.rolloverCount} (${formatCurrency(summary.rolloverOD)})

${branches.map(branchData => `
${branchData.branchName} BRANCH DETAILS:
Total: ${formatCurrency(branchData.totalOD)} (${branchData.totalPolicies} policies)

${branchData.vehicleTypes.map(vehicleType => `
  ${vehicleType.vehicleType}:
    Rollover: ${formatCurrency(vehicleType.rollover.amount)} (${vehicleType.rollover.count} policies)
`).join('')}
`).join('')}

${dailyBreakdown.length > 0 ? `
DAILY TOTAL OD BREAKDOWN - ${branch} BRANCH (Last 7 Days):
=======================================================
${dailyBreakdown.map(day => `
${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}:
  Policies: ${day.policyCount}
  Total OD: ${formatCurrency(day.totalOD)}
  Avg OD: ${formatCurrency(day.avgODPerPolicy)}
  Max OD: ${formatCurrency(day.maxOD)}
`).join('')}
` : ''}

${monthlyBreakdown.length > 0 ? `
MONTHLY TOTAL OD BREAKDOWN - ${branch} BRANCH (Last 12 Months):
============================================================
${monthlyBreakdown.map(month => `
${new Date(month.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}:
  Policies: ${month.policyCount}
  Total OD: ${formatCurrency(month.totalOD)}
  Avg OD: ${formatCurrency(month.avgODPerPolicy)}
  Max OD: ${formatCurrency(month.maxOD)}
`).join('')}
` : ''}

---
Generated by Nicsan CRM System
This is an automated daily report for ${branch} branch.
  `;
  
  return { html, text };
}

module.exports = {
  sendPolicyPDF,
  testEmailConfiguration,
  sendTestEmail,
  sendDailyODReport,
  generateDailyODReportContent,
  sendBranchODReport,
  generateBranchODReportContent,
  sendWeeklyRolloverReport
};
