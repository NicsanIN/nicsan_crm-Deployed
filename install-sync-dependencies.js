// Installation script for cross-device sync dependencies
// Run this script to install required packages

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Cross-Device Sync Dependencies...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  execSync('npm install socket.io-client idb', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
}

// Backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  const backendPath = path.join(__dirname, 'nicsan-crm-backend');
  if (fs.existsSync(backendPath)) {
    execSync('npm install socket.io redis compression', { 
      cwd: backendPath, 
      stdio: 'inherit' 
    });
    console.log('✅ Backend dependencies installed successfully\n');
  } else {
    console.log('⚠️ Backend directory not found, skipping backend dependencies\n');
  }
} catch (error) {
  console.error('❌ Failed to install backend dependencies:', error.message);
}

console.log('🎉 Cross-Device Sync setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Start the backend server: cd nicsan-crm-backend && npm run dev');
console.log('2. Start the frontend: npm run dev');
console.log('3. Open the app and navigate to "Cross-Device Sync" in the sidebar');
console.log('4. Test sync by opening the app on multiple devices/browsers');
console.log('\n✨ Your Nicsan CRM now supports real-time cross-device synchronization!');
