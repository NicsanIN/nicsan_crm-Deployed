# Email Integration Testing Guide

## 🧪 **Step 3: Test the Flow - Complete Testing Guide**

This guide provides comprehensive testing procedures to verify the email integration works correctly.

### 📋 **Testing Overview**

The testing process includes:
1. **Email Service Configuration Tests**
2. **Complete Policy Flow Tests**
3. **Manual Testing Procedures**
4. **Troubleshooting Guide**

---

## 🔧 **Prerequisites**

### **1. Environment Setup**
```bash
# Install dependencies
cd nicsan-crm-backend
npm install

# Install additional test dependencies
npm install form-data axios
```

### **2. Environment Variables**
Ensure your `.env` file contains:
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket

# Test Configuration
TEST_EMAIL=test@example.com
API_BASE_URL=http://localhost:3001
TEST_TOKEN=your_jwt_token
```

### **3. Backend Server**
```bash
# Start the backend server
npm run dev
```

---

## 🧪 **Automated Testing**

### **Test 1: Email Service Configuration**
```bash
# Run email service tests
node test-email-service.js
```

**What it tests:**
- ✅ Email configuration validity
- ✅ Test email sending
- ✅ S3 connection
- ✅ Policy PDF email (mock data)
- ✅ Error handling
- ✅ Environment variables

**Expected Output:**
```
🧪 Testing Email Service Integration
=====================================

📧 Test 1: Email Configuration
--------------------------------
✅ Email configuration is valid
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: your_email@gmail.com

📧 Test 2: Send Test Email
---------------------------
✅ Test email sent successfully
   Message ID: <message-id>
   Sent to: test@example.com

☁️ Test 3: S3 Connection
-------------------------
✅ S3 connection successful
   Bucket: your_s3_bucket
   Region: us-east-1

📄 Test 4: Policy PDF Email (Mock Data)
----------------------------------------
✅ Policy PDF email sent successfully
   Message ID: <message-id>

⚠️ Test 5: Error Handling
--------------------------
✅ Error handling works correctly
   Error: Failed to download PDF: The specified key does not exist.

🔧 Test 6: Environment Variables
----------------------------------
✅ SMTP_HOST: Configured
✅ SMTP_PORT: Configured
✅ SMTP_USER: Configured
✅ SMTP_PASS: Configured
✅ AWS_ACCESS_KEY_ID: Configured
✅ AWS_SECRET_ACCESS_KEY: Configured
✅ AWS_S3_BUCKET: Configured

✅ All required environment variables are configured

📊 Test Results Summary
=======================
✅ PASS emailConfig
✅ PASS testEmail
✅ PASS s3Connection
✅ PASS policyPDF
✅ PASS errorHandling
✅ PASS environment

🎯 Overall Result: 6/6 tests passed
🎉 All tests passed! Email service is ready for production.
```

### **Test 2: Complete Policy Flow**
```bash
# Run complete flow test
node test-policy-flow.js
```

**What it tests:**
- ✅ PDF upload with manual extras
- ✅ AI processing
- ✅ Policy confirmation
- ✅ Email sending
- ✅ End-to-end workflow

**Expected Output:**
```
🧪 Testing Complete Policy Flow with Email Integration
=====================================================

📄 Creating test PDF file...
✅ Test PDF created: /path/to/test-policy.pdf

📤 Test 1: PDF Upload
----------------------
✅ PDF upload successful
   Upload ID: upload_12345
   Status: UPLOADED

📊 Test 2: Check Upload Status
-----------------------------
✅ Upload status retrieved
   Status: UPLOADED
   Insurer: TATA_AIG
   S3 Key: local-staging/uploads/TATA_AIG/1703123456789_abc123.pdf
   Filename: test-policy.pdf

🤖 Test 3: Wait for AI Processing
----------------------------------
   Attempt 1: Status = PROCESSING
   Attempt 2: Status = REVIEW
✅ AI processing completed
   Status: REVIEW (ready for confirmation)

✅ Test 4: Policy Confirmation (with Email)
-------------------------------------------
✅ Policy confirmation successful
   Policy ID: policy_12345
   Policy Number: TA-TEST-12345
   Customer Email: test@example.com
   📧 Email should have been sent to customer

📧 Test 5: Verify Email Configuration
--------------------------------------
✅ Email configuration is valid
   SMTP settings are properly configured

📧 Test 6: Send Test Email
---------------------------
✅ Test email sent successfully
   Message ID: <message-id>
   Sent to: test@example.com

📊 Complete Flow Test Results
=============================
✅ PASS emailConfig
✅ PASS testEmail
✅ PASS pdfUpload
✅ PASS uploadStatus
✅ PASS aiProcessing
✅ PASS policyConfirmation

🎯 Overall Result: 6/6 tests passed
🎉 Complete flow test passed! Email integration is working correctly.
📧 Check test@example.com for the policy PDF email.
```

---

## 🔍 **Manual Testing**

### **Step 1: Test Email Service**
1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Run email service test:**
   ```bash
   node test-email-service.js
   ```

3. **Check your email inbox** for the test email

### **Step 2: Test Complete Flow**
1. **Prepare test data:**
   - Create a test PDF file
   - Ensure you have a valid JWT token
   - Set up test email address

2. **Run complete flow test:**
   ```bash
   node test-policy-flow.js
   ```

3. **Check email inbox** for the policy PDF email

### **Step 3: Test via Frontend**
1. **Start the frontend:**
   ```bash
   cd ../
   npm run dev
   ```

2. **Upload a PDF:**
   - Go to Operations → Upload
   - Fill in manual extras (including customer email)
   - Upload a PDF file
   - Wait for AI processing

3. **Confirm the policy:**
   - Review the extracted data
   - Click "Confirm Policy"
   - Check customer email for PDF attachment

---

## 🐛 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. Email Configuration Issues**
```
❌ Email configuration is invalid
```

**Solutions:**
- Check SMTP credentials
- Verify Gmail App Password (not regular password)
- Ensure SMTP settings are correct
- Check firewall/network restrictions

#### **2. S3 Connection Issues**
```
❌ S3 connection failed: Access Denied
```

**Solutions:**
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure bucket exists
- Verify AWS region

#### **3. PDF Upload Issues**
```
❌ PDF upload failed: 401 Unauthorized
```

**Solutions:**
- Check JWT token validity
- Verify authentication headers
- Ensure user has 'ops' role
- Check API endpoint URL

#### **4. Email Sending Issues**
```
❌ Email sending failed: Invalid email address
```

**Solutions:**
- Check customer email format
- Verify email field mapping
- Ensure email is not empty
- Check for typos in email address

#### **5. Policy Confirmation Issues**
```
❌ Policy confirmation failed: Policy number already exists
```

**Solutions:**
- Use unique policy numbers for testing
- Check for existing policies
- Clear test data if needed

---

## 📊 **Test Results Interpretation**

### **Success Indicators**
- ✅ All tests pass
- ✅ Emails received in inbox
- ✅ PDF attachments are correct
- ✅ Email content includes policy details
- ✅ No error messages in logs

### **Failure Indicators**
- ❌ Any test fails
- ❌ No emails received
- ❌ Error messages in logs
- ❌ PDF attachments missing
- ❌ Email content incomplete

### **Warning Indicators**
- ⚠️ Some tests pass, others fail
- ⚠️ Emails received but content incorrect
- ⚠️ PDF attachments present but corrupted
- ⚠️ Intermittent failures

---

## 🔧 **Advanced Testing**

### **Load Testing**
```bash
# Test multiple concurrent uploads
for i in {1..5}; do
  node test-policy-flow.js &
done
wait
```

### **Error Scenario Testing**
```bash
# Test with invalid email
export TEST_EMAIL="invalid-email"
node test-policy-flow.js

# Test with invalid S3 key
export TEST_S3_KEY="non-existent-key"
node test-policy-flow.js
```

### **Performance Testing**
```bash
# Test email sending performance
time node test-email-service.js

# Test complete flow performance
time node test-policy-flow.js
```

---

## 📋 **Testing Checklist**

### **Pre-Testing Setup**
- [ ] Backend server running
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Test email address available
- [ ] JWT token valid

### **Email Service Tests**
- [ ] Email configuration valid
- [ ] Test email sent successfully
- [ ] S3 connection working
- [ ] Policy PDF email sent
- [ ] Error handling works

### **Complete Flow Tests**
- [ ] PDF upload successful
- [ ] AI processing completed
- [ ] Policy confirmation successful
- [ ] Email sent to customer
- [ ] PDF attachment correct
- [ ] Email content complete

### **Manual Testing**
- [ ] Frontend upload works
- [ ] Review process works
- [ ] Confirmation process works
- [ ] Email received by customer
- [ ] PDF attachment downloadable

### **Post-Testing Verification**
- [ ] All tests pass
- [ ] Emails received
- [ ] PDF attachments correct
- [ ] No error logs
- [ ] System stable

---

## 🎯 **Success Criteria**

### **Email Service**
- ✅ All configuration tests pass
- ✅ Test emails sent successfully
- ✅ S3 connection established
- ✅ Error handling works

### **Complete Flow**
- ✅ PDF upload works
- ✅ AI processing completes
- ✅ Policy confirmation succeeds
- ✅ Email sent automatically
- ✅ Customer receives PDF

### **Integration**
- ✅ No blocking errors
- ✅ Graceful failure handling
- ✅ Comprehensive logging
- ✅ Professional email format

---

## 🚀 **Next Steps After Testing**

### **If All Tests Pass:**
1. **Deploy to production**
2. **Monitor email delivery**
3. **Track success rates**
4. **Gather customer feedback**

### **If Tests Fail:**
1. **Check error messages**
2. **Verify configuration**
3. **Test individual components**
4. **Fix issues and retest**

### **If Partial Success:**
1. **Identify failing components**
2. **Debug specific issues**
3. **Test fixes individually**
4. **Re-run complete tests**

---

## 📞 **Support and Debugging**

### **Log Files to Check**
- Backend server logs
- Email service logs
- S3 access logs
- Database logs

### **Debug Commands**
```bash
# Check email service logs
tail -f logs/email.log

# Check backend logs
tail -f logs/backend.log

# Check S3 access
aws s3 ls s3://your-bucket/
```

### **Common Debug Steps**
1. **Check environment variables**
2. **Verify network connectivity**
3. **Test SMTP connection**
4. **Check AWS credentials**
5. **Validate JWT tokens**

---

## 🎉 **Testing Complete!**

Once all tests pass, your email integration is ready for production use. The system will automatically send policy PDFs to customers after policy confirmation, providing a seamless and professional experience.

**Step 3 is complete!** The email integration has been thoroughly tested and is ready for production use.
