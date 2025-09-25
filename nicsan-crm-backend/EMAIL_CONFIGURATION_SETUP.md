# Email Configuration Setup

## ⚠️ **Email Service Configuration Required**

The email service tests are failing because the SMTP configuration is missing. Here's what you need to do:

### 🔧 **Required Environment Variables**

Create a `.env` file in the `nicsan-crm-backend` directory with the following configuration:

```bash
# Email Configuration (REQUIRED FOR EMAIL SERVICE)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Test Configuration
TEST_EMAIL=test@example.com
API_BASE_URL=http://localhost:3001
TEST_TOKEN=your_jwt_token
```

### 📧 **Gmail Setup (Recommended)**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password (not your regular password)

3. **Update your `.env` file:**
   ```bash
   SMTP_USER=your_actual_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   TEST_EMAIL=your_test_email@gmail.com
   ```

### 🔧 **Alternative SMTP Providers**

#### **Outlook/Hotmail:**
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

### 🧪 **Test Configuration**

After setting up the environment variables, run the tests again:

```bash
# Test email service
node test-email-service.js

# Test complete flow
node test-policy-flow.js
```

### 📊 **Current Test Results**

The tests show:
- ✅ **S3 Connection**: Working (AWS credentials configured)
- ✅ **Error Handling**: Working correctly
- ❌ **Email Configuration**: Missing SMTP credentials
- ❌ **Test Email**: Cannot send without SMTP
- ❌ **Policy PDF Email**: Cannot send without SMTP

### 🎯 **Next Steps**

1. **Create `.env` file** with email configuration
2. **Set up Gmail App Password** (recommended)
3. **Run tests again** to verify email functionality
4. **Test complete flow** with real email sending

### 🔍 **Troubleshooting**

#### **Common Issues:**
- **"Missing credentials"**: SMTP_USER and SMTP_PASS not set
- **"Authentication failed"**: Wrong password or 2FA not enabled
- **"Connection timeout"**: Firewall or network issues

#### **Gmail Specific:**
- Use App Password, not regular password
- Enable 2-Factor Authentication first
- Check "Less secure app access" if needed

### 📧 **Expected Results After Configuration**

Once configured, you should see:
```
✅ Email configuration is valid
✅ Test email sent successfully
✅ Policy PDF email sent successfully
🎉 All tests passed! Email service is ready for production.
```

### 🚀 **Ready to Test**

After setting up the email configuration:
1. **Restart the backend server**
2. **Run the email tests**
3. **Check your email inbox** for test emails
4. **Test the complete policy flow**

The email integration will work perfectly once the SMTP configuration is properly set up!
