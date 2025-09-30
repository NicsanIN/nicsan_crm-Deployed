# 📱 WhatsApp Cloud API Setup Guide

## 🎯 Overview

This guide will help you set up WhatsApp Cloud API integration for your NicsanCRM system to send policy documents via WhatsApp.

## 🔧 Prerequisites

1. **Meta Business Account** - Required for WhatsApp Business API access
2. **WhatsApp Business Account** - For sending business messages
3. **Phone Number** - Verified phone number for WhatsApp Business
4. **Domain** - Your domain for webhook verification

## 📋 Step-by-Step Setup

### Step 1: Create Meta Business Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Get Started" and create a developer account
3. Create a new app:
   - App Type: "Business"
   - App Name: "NicsanCRM WhatsApp Integration"
   - App Contact Email: your-email@yourdomain.com

### Step 2: Add WhatsApp Product

1. In your Meta app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. Follow the setup wizard

### Step 3: Configure WhatsApp Business Account

1. **Phone Number Verification:**
   - Add your business phone number
   - Verify it via SMS/call
   - This will be your WhatsApp Business number

2. **Business Profile:**
   - Complete your business profile
   - Add business description
   - Upload business logo

### Step 4: Get API Credentials

1. **Access Token:**
   - Go to WhatsApp > API Setup
   - Copy your "Temporary access token"
   - For production, generate a permanent token

2. **Phone Number ID:**
   - Found in WhatsApp > API Setup
   - Copy the Phone Number ID

3. **Business Account ID:**
   - Found in WhatsApp > API Setup
   - Copy the Business Account ID

### Step 5: Configure Webhooks (Optional)

1. **Webhook URL:** `https://yourdomain.com/webhook/whatsapp`
2. **Verify Token:** Create a random string for verification
3. **Subscribe to:** `messages` events

## 🔐 Environment Variables

Add these variables to your `.env` file:

```bash
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here

# Test Configuration
TEST_PHONE=+919876543210
```

## 📱 Message Templates

### Template 1: Policy Notification

**Template Name:** `policy_notification`
**Category:** `UTILITY`
**Language:** `en`

**Body:**
```
Dear {{customer_name}},

Your motor insurance policy has been successfully processed!

📋 Policy Details:
• Policy Number: {{policy_number}}
• Vehicle: {{make}} {{model}}
• Registration: {{vehicle_number}}
• Valid From: {{issue_date}}
• Valid Until: {{expiry_date}}
• Premium: ₹{{total_premium}}

📎 Your policy document is attached.

Thank you for choosing Nicsan Insurance!
```

### Template Approval Process

1. **Create Template:**
   - Go to WhatsApp > Message Templates
   - Click "Create Template"
   - Fill in the template details
   - Submit for approval

2. **Wait for Approval:**
   - Templates are reviewed by Meta
   - Approval time: 1-24 hours
   - You'll receive email notification

3. **Use Template:**
   - Once approved, use template in your code
   - Template name: `policy_notification`

## 🧪 Testing

### Test Configuration

```bash
# Run WhatsApp service tests
node test-whatsapp-service.js
```

### Test Scenarios

1. **Configuration Test:**
   - Validates API credentials
   - Checks phone number access
   - Verifies business account

2. **Message Test:**
   - Sends test message
   - Validates delivery
   - Checks message format

3. **PDF Test:**
   - Tests PDF attachment
   - Validates file size limits
   - Checks document format

4. **Error Handling:**
   - Tests invalid phone numbers
   - Tests missing files
   - Validates error responses

## 📊 Rate Limits

- **Messages per Day:** 1,000 (initially)
- **Messages per Second:** 10
- **File Size Limit:** 100MB
- **Supported Formats:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

## 🔒 Security Best Practices

1. **Access Tokens:**
   - Use permanent tokens for production
   - Rotate tokens regularly
   - Store tokens securely

2. **Webhook Security:**
   - Use HTTPS for webhooks
   - Verify webhook signatures
   - Implement rate limiting

3. **Data Privacy:**
   - Follow GDPR guidelines
   - Implement data retention policies
   - Secure customer data

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Meta Business Account created
- [ ] WhatsApp Business Account verified
- [ ] Phone number verified
- [ ] Access tokens generated
- [ ] Message templates approved
- [ ] Environment variables configured
- [ ] Test messages sent successfully
- [ ] Error handling tested
- [ ] Rate limits understood
- [ ] Security measures implemented

### Deployment Steps

1. **Update Environment:**
   ```bash
   # Production environment variables
   WHATSAPP_ACCESS_TOKEN=your_production_token
   WHATSAPP_PHONE_NUMBER_ID=your_production_phone_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_production_business_id
   ```

2. **Test Production:**
   ```bash
   node test-whatsapp-service.js
   ```

3. **Monitor Usage:**
   - Check message delivery rates
   - Monitor API usage
   - Track error rates

## 📈 Monitoring and Analytics

### Key Metrics

1. **Delivery Rate:** Target 95%+
2. **Response Time:** <5 seconds
3. **Error Rate:** <1%
4. **Customer Satisfaction:** Track feedback

### Monitoring Tools

1. **Meta Business Manager:**
   - Message delivery status
   - API usage statistics
   - Error logs

2. **Application Logs:**
   - WhatsApp service logs
   - Error tracking
   - Performance metrics

## 🆘 Troubleshooting

### Common Issues

1. **Invalid Access Token:**
   - Check token expiration
   - Regenerate if needed
   - Verify token permissions

2. **Phone Number Not Verified:**
   - Complete phone verification
   - Check business account status
   - Verify phone number format

3. **Template Not Approved:**
   - Check template status
   - Resubmit if rejected
   - Follow template guidelines

4. **Message Delivery Failed:**
   - Check phone number format
   - Verify customer opt-in
   - Check rate limits

### Support Resources

- **Meta Developer Documentation:** [developers.facebook.com](https://developers.facebook.com/docs/whatsapp)
- **WhatsApp Business API Guide:** [business.whatsapp.com](https://business.whatsapp.com/)
- **Community Support:** [Meta Developer Community](https://developers.facebook.com/community/)

## ✅ Success Criteria

Your WhatsApp integration is ready when:

- [ ] All tests pass
- [ ] Test messages delivered successfully
- [ ] PDF attachments working
- [ ] Error handling implemented
- [ ] Production environment configured
- [ ] Monitoring in place
- [ ] Documentation complete

## 🎉 Next Steps

After successful setup:

1. **Train Team:** Educate operations team on WhatsApp features
2. **Customer Communication:** Inform customers about WhatsApp delivery
3. **Monitor Performance:** Track delivery rates and customer feedback
4. **Optimize:** Improve message templates based on feedback
5. **Scale:** Increase rate limits as needed

---

**Need Help?** Contact the development team or refer to the Meta WhatsApp Business API documentation.
