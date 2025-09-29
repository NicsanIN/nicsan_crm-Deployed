#!/usr/bin/env node

/**
 * Test Auth Token
 * 
 * This script tests if the authentication token is working
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

async function testAuthToken() {
  log('\n🔐 TESTING AUTHENTICATION TOKEN', 'bold');
  log('=' .repeat(50), 'blue');
  
  try {
    // Test 1: Check if we can get a token by logging in
    log('\n1. Testing login to get auth token...', 'yellow');
    
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success && loginData.data?.token) {
      log('✅ Login successful, got auth token', 'green');
      const token = loginData.data.token;
      
      // Test 2: Test telecallers endpoint with auth token
      log('\n2. Testing telecallers endpoint with auth token...', 'yellow');
      
      const telecallersResponse = await fetch('http://localhost:3001/api/telecallers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const telecallersData = await telecallersResponse.json();
      
      if (telecallersResponse.ok) {
        log('✅ Telecallers endpoint works with auth token', 'green');
        log(`   Found ${telecallersData.data?.length || 0} telecallers`, 'green');
      } else {
        log(`❌ Telecallers endpoint failed: ${telecallersResponse.status}`, 'red');
        log(`   Response: ${JSON.stringify(telecallersData)}`, 'red');
      }
      
      // Test 3: Test adding telecaller with auth token
      log('\n3. Testing add telecaller with auth token...', 'yellow');
      
      const addResponse = await fetch('http://localhost:3001/api/telecallers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Telecaller ' + Date.now(),
          email: '',
          phone: '',
          branch: 'Test Branch'
        })
      });
      
      const addData = await addResponse.json();
      
      if (addResponse.ok) {
        log('✅ Add telecaller works with auth token', 'green');
        log(`   Added telecaller: ${JSON.stringify(addData.data)}`, 'green');
      } else {
        log(`❌ Add telecaller failed: ${addResponse.status}`, 'red');
        log(`   Response: ${JSON.stringify(addData)}`, 'red');
      }
      
    } else {
      log('❌ Login failed', 'red');
      log(`   Response: ${JSON.stringify(loginData)}`, 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('1. Check if default users exist in database', 'blue');
      log('2. Run: cd nicsan-crm-backend && npm run init-users', 'blue');
      log('3. Or create a user manually in the database', 'blue');
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

// Run the test
testAuthToken();
