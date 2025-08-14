const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Nicsan CRM Project Setup');
console.log('============================\n');

// Step 1: Create environment file
console.log('🔧 Step 1: Setting up environment configuration...');
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
  console.log('✅ Environment file created');
} catch (error) {
  console.error('❌ Failed to create environment file:', error.message);
  process.exit(1);
}

// Step 2: Install dependencies
console.log('\n📦 Step 2: Installing dependencies...');
try {
  console.log('Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Build TypeScript
console.log('\n🔨 Step 3: Building TypeScript...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ TypeScript build completed');
} catch (error) {
  console.error('❌ Failed to build TypeScript:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up PostgreSQL database named "nicsan_crm"');
console.log('2. Update database password in .env file if needed');
console.log('3. Run: npm run dev (for development)');
console.log('4. Run: npm start (for production)');
console.log('\n📊 Test credentials will be created when you run the database setup');
console.log('   - Founder: admin@nicsan.in / admin123');
console.log('   - Ops: ops@nicsan.in / ops123');

