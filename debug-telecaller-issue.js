#!/usr/bin/env node

/**
 * Debug Script: Telecaller "Add New" Issue
 * 
 * This script helps diagnose why telecallers aren't showing in suggestions
 * after being added successfully.
 */

import fs from 'fs';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkContent(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`❌ ${description}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} - Error: ${error.message}`, 'red');
    return false;
  }
}

// Main diagnostic function
function runDiagnostic() {
  log('\n🔍 TELECALLER "ADD NEW" ISSUE DIAGNOSTIC', 'bold');
  log('=' .repeat(60), 'blue');
  
  let passed = 0;
  let total = 0;
  
  // Check 1: Database table exists
  total++;
  if (checkFile('nicsan-crm-backend/config/database.js', 'Database config exists')) passed++;
  
  // Check 2: Backend server can start
  total++;
  if (checkFile('nicsan-crm-backend/server.js', 'Backend server exists')) passed++;
  
  // Check 3: Telecallers route exists
  total++;
  if (checkFile('nicsan-crm-backend/routes/telecallers.js', 'Telecallers route exists')) passed++;
  
  // Check 4: Frontend components exist
  total++;
  if (checkFile('src/NicsanCRMMock.tsx', 'Main React component exists')) passed++;
  
  // Check 5: Service layer exists
  total++;
  if (checkFile('src/services/dualStorageService.ts', 'DualStorageService exists')) passed++;
  
  // Check 6: Backend API service exists
  total++;
  if (checkFile('src/services/backendApiService.ts', 'BackendApiService exists')) passed++;
  
  // Check 7: Database connection configuration
  total++;
  if (checkContent('nicsan-crm-backend/config/database.js', 'DB_HOST', 'Database host configured')) passed++;
  
  // Check 8: Environment variables
  total++;
  if (checkFile('nicsan-crm-backend/.env', 'Environment file exists')) passed++;
  
  // Check 9: Package.json scripts
  total++;
  if (checkContent('nicsan-crm-backend/package.json', 'init-db', 'Database init script exists')) passed++;
  
  // Check 10: Frontend state management
  total++;
  if (checkContent('src/NicsanCRMMock.tsx', 'setCallerNames', 'Caller names state management exists')) passed++;
  
  // Check 11: Suggestions refresh logic
  total++;
  if (checkContent('src/NicsanCRMMock.tsx', 'DualStorageService.getTelecallers', 'Suggestions refresh logic exists')) passed++;
  
  // Check 12: Auto-selection logic
  total++;
  if (checkContent('src/NicsanCRMMock.tsx', 'callerName: telecallerName', 'Auto-selection logic exists')) passed++;
  
  // Print results
  log('\n📊 DIAGNOSTIC RESULTS', 'bold');
  log('=' .repeat(60), 'blue');
  log(`Total Checks: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${total - passed}`, 'red');
  
  const successRate = ((passed / total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, passed === total ? 'green' : 'yellow');
  
  // Provide specific troubleshooting steps
  log('\n🔧 TROUBLESHOOTING STEPS', 'bold');
  log('=' .repeat(60), 'blue');
  
  log('\n1. Check Database Connection:', 'yellow');
  log('   - Make sure PostgreSQL is running', 'blue');
  log('   - Check database credentials in .env file', 'blue');
  log('   - Run: psql -d nicsan_crm -c "SELECT * FROM telecallers;"', 'blue');
  
  log('\n2. Check Backend Server:', 'yellow');
  log('   - Start backend: cd nicsan-crm-backend && npm run dev', 'blue');
  log('   - Check if server starts without errors', 'blue');
  log('   - Test API: curl http://localhost:3001/health', 'blue');
  
  log('\n3. Check Frontend State:', 'yellow');
  log('   - Open browser developer tools', 'blue');
  log('   - Check console for errors', 'blue');
  log('   - Look for network requests to /api/telecallers', 'blue');
  
  log('\n4. Check Database Data:', 'yellow');
  log('   - Connect to database: psql -d nicsan_crm', 'blue');
  log('   - Run: SELECT * FROM telecallers;', 'blue');
  log('   - Check if telecallers are actually saved', 'blue');
  
  log('\n5. Check Cross-Page State:', 'yellow');
  log('   - The issue might be that each page has its own state', 'blue');
  log('   - Telecallers added on one page might not appear on another', 'blue');
  log('   - Check if callerNames state is shared between pages', 'blue');
  
  // Specific issue analysis
  log('\n🎯 LIKELY ISSUES:', 'bold');
  log('=' .repeat(60), 'blue');
  
  log('\n1. Database Connection Issue:', 'red');
  log('   - Backend can\'t connect to PostgreSQL', 'red');
  log('   - Check .env file for correct database credentials', 'red');
  log('   - Make sure PostgreSQL is running', 'red');
  
  log('\n2. State Management Issue:', 'red');
  log('   - Each page has its own callerNames state', 'red');
  log('   - Telecallers added on one page don\'t appear on another', 'red');
  log('   - Need to implement global state management', 'red');
  
  log('\n3. API Authentication Issue:', 'red');
  log('   - Frontend might not be sending auth token', 'red');
  log('   - Backend might be rejecting requests', 'red');
  log('   - Check browser network tab for 401 errors', 'red');
  
  log('\n4. Database Transaction Issue:', 'red');
  log('   - Telecaller might be added but not committed', 'red');
  log('   - Database transaction might be rolled back', 'red');
  log('   - Check database logs for errors', 'red');
  
  // Quick fixes
  log('\n🚀 QUICK FIXES:', 'bold');
  log('=' .repeat(60), 'blue');
  
  log('\n1. Restart Backend Server:', 'yellow');
  log('   cd nicsan-crm-backend', 'blue');
  log('   npm run dev', 'blue');
  
  log('\n2. Check Database:', 'yellow');
  log('   psql -d nicsan_crm', 'blue');
  log('   SELECT * FROM telecallers;', 'blue');
  
  log('\n3. Clear Browser Cache:', 'yellow');
  log('   - Hard refresh: Ctrl+Shift+R', 'blue');
  log('   - Clear localStorage', 'blue');
  
  log('\n4. Check Console Errors:', 'yellow');
  log('   - Open browser developer tools', 'blue');
  log('   - Look for JavaScript errors', 'blue');
  log('   - Check network requests', 'blue');
}

// Run the diagnostic
runDiagnostic();
