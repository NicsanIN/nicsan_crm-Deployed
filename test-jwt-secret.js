#!/usr/bin/env node

/**
 * Test JWT Secret
 * 
 * This script tests if the JWT_SECRET is properly configured
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

function testJWTSecret() {
  log('\n🔐 TESTING JWT_SECRET CONFIGURATION', 'bold');
  log('=' .repeat(50), 'blue');
  
  try {
    // Load environment variables
    require('dotenv').config();
    
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      log('❌ JWT_SECRET is not set in environment variables', 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('Add this to your .env file:', 'blue');
      log('JWT_SECRET=your_jwt_secret_key_here', 'blue');
      return;
    }
    
    if (jwtSecret === 'your_jwt_secret_key_here' || jwtSecret.length < 10) {
      log('❌ JWT_SECRET is not properly configured', 'red');
      log('   Current value: ' + jwtSecret, 'red');
      log('\n🔧 SOLUTION:', 'yellow');
      log('Set a proper JWT secret (at least 10 characters):', 'blue');
      log('JWT_SECRET=my_super_secret_jwt_key_12345', 'blue');
      return;
    }
    
    log('✅ JWT_SECRET is properly configured', 'green');
    log('   Length: ' + jwtSecret.length + ' characters', 'green');
    
    // Test JWT functionality
    const jwt = require('jsonwebtoken');
    
    try {
      // Test creating a token
      const testToken = jwt.sign({ test: 'data' }, jwtSecret, { expiresIn: '1h' });
      log('✅ JWT token creation works', 'green');
      
      // Test verifying the token
      const decoded = jwt.verify(testToken, jwtSecret);
      log('✅ JWT token verification works', 'green');
      
      log('\n🎉 JWT_SECRET is working correctly!', 'green');
      log('The telecaller authentication should work now.', 'green');
      
    } catch (jwtError) {
      log('❌ JWT functionality test failed', 'red');
      log('   Error: ' + jwtError.message, 'red');
    }
    
  } catch (error) {
    log('❌ Test failed: ' + error.message, 'red');
  }
}

// Run the test
testJWTSecret();
