const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...');

const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false

# JWT Configuration
JWT_SECRET=nicsan-crm-dev-secret-key-2024
JWT_EXPIRES_IN=24h

# AWS Configuration (using dummy values for local dev)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=dummy-access-key
AWS_SECRET_ACCESS_KEY=dummy-secret-key

# S3 Configuration
S3_BUCKET_NAME=nicsan-crm-pdfs
S3_REGION=ap-south-1

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created at:', envPath);
  console.log('📝 Please update the database password and other values as needed');
} catch (error) {
  console.error('❌ Failed to create environment file:', error.message);
}

