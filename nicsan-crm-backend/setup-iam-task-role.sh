#!/bin/bash

# Setup IAM Task Role for Nicsan CRM Backend
# This script creates the IAM Task Role and attaches the necessary policies

echo "🔧 Setting up IAM Task Role for Nicsan CRM Backend..."

# Variables
ACCOUNT_ID="132418765186"
REGION="ap-south-1"
ROLE_NAME="NicsanCrmTaskRole"
POLICY_NAME="NicsanCrmTaskRolePolicy"
BUCKET_NAME="nicsan-crm-pdfs"

# 1. Create the IAM Task Role
echo "📝 Creating IAM Task Role: $ROLE_NAME"
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --region $REGION

# 2. Create the policy document
echo "📋 Creating IAM Policy: $POLICY_NAME"
aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::'$BUCKET_NAME'",
          "arn:aws:s3:::'$BUCKET_NAME'/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ],
        "Resource": [
          "arn:aws:ssm:'$REGION':'$ACCOUNT_ID':parameter/nicsan/backend/*"
        ]
      }
    ]
  }' \
  --region $REGION

# 3. Attach the policy to the role
echo "🔗 Attaching policy to role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
  --region $REGION

echo "✅ IAM Task Role setup complete!"
echo ""
echo "📋 Summary:"
echo "   Role Name: $ROLE_NAME"
echo "   Role ARN: arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
echo "   Policy: $POLICY_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy your updated task definition to ECS"
echo "   2. Test the S3 upload functionality"
echo "   3. Monitor CloudWatch logs for any errors"
