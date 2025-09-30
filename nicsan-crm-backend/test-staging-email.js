const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Testing Staging Email Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ Missing'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ Missing'}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER || '❌ Missing'}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE || '❌ Missing'}`);

// Create transporter
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

console.log('\n📧 Email Configuration:');
console.log(JSON.stringify(emailConfig, null, 2));

// Test email sending
async function testEmail() {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    
    console.log('\n🔗 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📤 Sending test email...');
    const mailOptions = {
      from: {
        name: 'Nicsan Insurance (Staging Test)',
        address: process.env.SMTP_USER
      },
      to: 'dhruv@nicsanin.com', // Replace with your test email
      subject: '🧪 Staging Email Test - ' + new Date().toISOString(),
      html: `
        <h2>Staging Email Test</h2>
        <p>This is a test email from the staging environment.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> Staging</p>
        <p>If you receive this email, the staging email configuration is working correctly!</p>
      `,
      text: `
        Staging Email Test
        
        This is a test email from the staging environment.
        Timestamp: ${new Date().toISOString()}
        Environment: Staging
        
        If you receive this email, the staging email configuration is working correctly!
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    if (error.responseCode) {
      console.error('Response Code:', error.responseCode);
    }
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testEmail();
