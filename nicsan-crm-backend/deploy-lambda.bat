@echo off
echo 🚀 Deploying Nicsan CRM PDF Processing Lambda...
echo ================================================

REM Check if SAM CLI is installed
sam --version >nul 2>&1
if errorlevel 1 (
    echo ❌ SAM CLI not found. Please install AWS SAM CLI first.
    echo 💡 Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
    pause
    exit /b 1
)

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS CLI not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Build the Lambda function
echo 🔨 Building Lambda function...
sam build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed
echo.

REM Deploy the stack
echo 🚀 Deploying to AWS...
sam deploy --guided
if errorlevel 1 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo 🎉 Lambda deployment completed successfully!
echo.
echo 📋 Next steps:
echo    1. Update your .env file with the new INTERNAL_TOKEN
echo    2. Test PDF upload to trigger Lambda processing
echo    3. Monitor CloudWatch logs for Lambda execution
echo.
pause



