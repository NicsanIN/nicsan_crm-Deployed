#!/usr/bin/env node

/**
 * Simple Telecaller Test
 * 
 * This script tests the telecaller API without external dependencies
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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

async function testTelecallerAPI() {
  log('\n🧪 TESTING TELECALLER API', 'bold');
  log('=' .repeat(50), 'blue');
  
  try {
    // Test 1: Check if server is running
    log('\n1. Testing server health...', 'yellow');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'ok') {
      log('✅ Server is running', 'green');
    } else {
      log('❌ Server health check failed', 'red');
      return;
    }
    
    // Test 2: Test telecallers endpoint (should require auth)
    log('\n2. Testing telecallers endpoint...', 'yellow');
    const telecallersResponse = await fetch('http://localhost:3001/api/telecallers');
    const telecallersData = await telecallersResponse.json();
    
    if (telecallersResponse.status === 401) {
      log('✅ Telecallers endpoint exists (requires authentication)', 'green');
    } else if (telecallersResponse.ok) {
      log('✅ Telecallers endpoint works without authentication', 'green');
    } else {
      log(`❌ Telecallers endpoint failed: ${telecallersResponse.status}`, 'red');
      log(`   Response: ${JSON.stringify(telecallersData)}`, 'red');
    }
    
    // Test 3: Test adding telecaller (should require auth)
    log('\n3. Testing add telecaller endpoint...', 'yellow');
    const addResponse = await fetch('http://localhost:3001/api/telecallers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Telecaller ' + Date.now(),
        email: '',
        phone: '',
        branch: 'Test Branch'
      })
    });
    
    const addData = await addResponse.json();
    
    if (addResponse.status === 401) {
      log('✅ Add telecaller endpoint exists (requires authentication)', 'green');
    } else if (addResponse.ok) {
      log('✅ Add telecaller endpoint works without authentication', 'green');
      log(`   Added telecaller: ${JSON.stringify(addData)}`, 'green');
    } else {
      log(`❌ Add telecaller endpoint failed: ${addResponse.status}`, 'red');
      log(`   Response: ${JSON.stringify(addData)}`, 'red');
    }
    
    log('\n📊 DIAGNOSIS:', 'bold');
    log('=' .repeat(50), 'blue');
    
    if (telecallersResponse.status === 401 && addResponse.status === 401) {
      log('✅ API endpoints are working correctly', 'green');
      log('❌ Issue: Frontend is not sending authentication token', 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('1. Check if user is logged in', 'blue');
      log('2. Check if auth token is stored in localStorage', 'blue');
      log('3. Check if token is being sent in API requests', 'blue');
      log('4. Check browser console for authentication errors', 'blue');
    } else if (addResponse.ok) {
      log('✅ API is working without authentication', 'green');
      log('❌ Issue: Database connection or transaction problem', 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('1. Check database connection', 'blue');
      log('2. Check database credentials', 'blue');
      log('3. Check database logs', 'blue');
    } else {
      log('❌ API endpoints are not working', 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('1. Check backend server logs', 'blue');
      log('2. Check database connection', 'blue');
      log('3. Restart backend server', 'blue');
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

// Run the test
testTelecallerAPI();
