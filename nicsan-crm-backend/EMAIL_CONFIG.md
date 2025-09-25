# Email Service Configuration

## 📧 **Email Service Setup Complete**

The email service has been successfully implemented with the following features:

### ✅ **What's Been Added:**

1. **Nodemailer Dependency**: Added to `package.json`
2. **Email Service**: Created `services/emailService.js` with full PDF attachment functionality
3. **Configuration**: Ready for environment variables

### 🔧 **Required Environment Variables**

Add these to your `.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 📋 **Email Service Features**

#### **Core Functions:**
- `sendPolicyPDF(customerEmail, policyData, s3Key, originalFilename)` - Send policy PDF to customer
- `testEmailConfiguration()` - Test SMTP configuration
- `sendTestEmail(testEmail)` - Send test email

#### **Email Features:**
- **Professional HTML Email**: Branded template with company colors
- **PDF Attachment**: Downloads original PDF from S3 and attaches to email
- **Policy Details**: Includes all policy information in email body
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful error handling with detailed logging

#### **Email Content Includes:**
- Customer name and greeting
- Policy number, vehicle details, dates
- Premium amount
- Contact information
- Company branding
- Professional footer

### 🎯 **How It Works**

1. **PDF Download**: Downloads original PDF from S3 using stored S3 key
2. **Email Composition**: Creates professional HTML email with policy details
3. **PDF Attachment**: Attaches the original PDF to the email
4. **Email Sending**: Sends via configured SMTP server
5. **Logging**: Detailed success/error logging

### 📧 **Email Template Features**

#### **HTML Email:**
- Professional header with company branding
- Policy details in formatted table
- Contact information section
- Company footer with copyright
- Responsive design for all devices

#### **Text Email:**
- Plain text version for email clients that don't support HTML
- Same information as HTML version
- Clean, readable format

### 🔧 **SMTP Configuration Options**

#### **Gmail (Recommended):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Use App Password, not regular password
```

#### **Outlook:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

#### **Custom SMTP:**
```bash
SMTP_HOST=your_smtp_server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_password
```

### 🧪 **Testing the Email Service**

#### **Test Configuration:**
```javascript
const emailService = require('./services/emailService');

// Test SMTP configuration
await emailService.testEmailConfiguration();

// Send test email
await emailService.sendTestEmail('test@example.com');
```

#### **Test Policy PDF:**
```javascript
const policyData = {
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  policy_number: 'TA-12345',
  vehicle_number: 'KA01AB1234',
  make: 'Maruti',
  model: 'Swift',
  issue_date: '2024-01-15',
  expiry_date: '2025-01-14',
  total_premium: 12150
};

await emailService.sendPolicyPDF(
  'john@example.com',
  policyData,
  'local-staging/uploads/TATA_AIG/1703123456789_abc123.pdf',
  'policy_document.pdf'
);
```

### 📦 **Installation**

Run this command to install the new dependency:

```bash
cd nicsan-crm-backend
npm install
```

### 🎯 **Next Steps**

The email service is now ready! The next step would be to integrate it with the policy confirmation flow in `routes/upload.js`.

### 🔍 **Key Features**

- **S3 Integration**: Downloads PDFs directly from S3
- **Professional Templates**: Branded HTML and text emails
- **Error Handling**: Comprehensive error handling and logging
- **Flexible Configuration**: Works with any SMTP provider
- **PDF Attachments**: Original PDF files attached to emails
- **Policy Details**: All policy information included in email body

The email service is now complete and ready for integration!
