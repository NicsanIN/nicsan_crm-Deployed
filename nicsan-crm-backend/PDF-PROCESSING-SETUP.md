# PDF Processing Workflow Setup Guide

## 🚀 Overview
This guide will help you set up the complete PDF processing workflow for Nicsan CRM, including AWS Lambda, S3, and Textract integration.

## 📋 Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- SAM CLI installed
- Node.js 18+ installed

## 🔧 Step-by-Step Setup

### 1. AWS Credentials Setup
```bash
# Configure AWS CLI
aws configure

# Set your AWS region (recommended: ap-south-1)
aws configure set region ap-south-1
```

### 2. Create S3 Bucket
```bash
# Create S3 bucket for PDF uploads
aws s3 mb s3://nicsan-crm-pdfs-dev --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning --bucket nicsan-crm-pdfs-dev --versioning-configuration Status=Enabled
```

### 3. Deploy Lambda Function
```bash
# Navigate to backend directory
cd nicsan-crm-backend

# Build SAM application
sam build

# Deploy with guided setup
sam deploy --guided

# Follow the prompts:
# - Stack Name: nicsan-crm-pdf-processor
# - AWS Region: ap-south-1
# - S3 Bucket Name: nicsan-crm-pdfs-dev
# - API Endpoint: http://localhost:3001 (for local dev)
# - Internal Token: [generate a random token]
```

### 4. Environment Variables
```bash
# Backend .env file
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=nicsan-crm-pdfs-dev
INTERNAL_TOKEN=your-internal-token-here
```

### 5. Test the Workflow

#### 5.1 Upload a PDF
1. Go to Operations → Upload
2. Select insurer (Tata AIG or Digit)
3. Drag & drop a PDF file
4. Watch the status updates

#### 5.2 Monitor Processing
- Check AWS CloudWatch logs for Lambda execution
- Monitor S3 bucket for file lifecycle
- Check database for upload status updates

#### 5.3 Review Results
- PDF should be processed in 10-30 seconds
- Status should change: UPLOADED → PROCESSING → REVIEW
- Extracted data should appear in review screen

## 🔍 Troubleshooting

### Common Issues

#### 1. Lambda Not Triggered
```bash
# Check S3 event configuration
aws s3api get-bucket-notification-configuration --bucket nicsan-crm-pdfs-dev

# Verify Lambda permissions
aws lambda get-policy --function-name nicsan-crm-pdf-processor
```

#### 2. Textract Processing Fails
```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/nicsan-crm-pdf-processor

# Verify Textract permissions
aws iam get-role-policy --role-name nicsan-crm-pdf-processor-role --policy-name PDFProcessorPolicy
```

#### 3. API Communication Fails
```bash
# Check internal token
echo $INTERNAL_TOKEN

# Test API endpoint
curl -X GET http://localhost:3001/health
```

### Debug Commands
```bash
# List Lambda functions
aws lambda list-functions

# Check S3 bucket contents
aws s3 ls s3://nicsan-crm-pdfs-dev --recursive

# Monitor CloudWatch logs in real-time
aws logs tail /aws/lambda/nicsan-crm-pdf-processor --follow
```

## 📊 Expected Workflow

### 1. User Upload
```
Frontend → Backend API → S3 Bucket
```

### 2. Lambda Trigger
```
S3 Event → Lambda Function → Textract Processing
```

### 3. Data Extraction
```
Textract → Lambda Parsing → Backend API → Database
```

### 4. User Review
```
Database → Frontend → Review Screen → Confirm/Save
```

### 5. Cleanup
```
Lambda → Delete PDF from S3 → Update Status
```

## 🎯 Performance Targets

- **PDF Upload**: < 5 seconds
- **Textract Processing**: < 15 seconds (95% of cases)
- **Total Time to Review**: < 20 seconds
- **Success Rate**: > 95%

## 🔒 Security Notes

- PDFs are automatically deleted after processing
- Internal token protects Lambda-API communication
- JWT authentication required for all uploads
- S3 bucket has lifecycle policies for cleanup

## 🚀 Next Steps

1. **Test with Real PDFs**: Upload actual Tata AIG and Digit policy PDFs
2. **Monitor Performance**: Track processing times and success rates
3. **Fine-tune Parsing**: Adjust regex patterns based on actual PDF layouts
4. **Scale Up**: Consider multiple Lambda functions for high-volume processing

## 📞 Support

If you encounter issues:
1. Check CloudWatch logs first
2. Verify AWS permissions
3. Test with simple PDF files
4. Check network connectivity between services

---

**Your PDF processing workflow is now ready! 🎉**
