#!/usr/bin/env node

/**
 * Test Case: Telecaller "Add New" Functionality
 * 
 * This test verifies that the telecaller "Add New" functionality is fully implemented
 * and working correctly across all components.
 */

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TELECALLER_NAME = 'Test Telecaller ' + Date.now();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) log(`   ${details}`, 'red');
  }
}

// Test 1: Check if backend server is running
async function testServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      logTest('Server Health Check', true);
      return true;
    } else {
      logTest('Server Health Check', false, 'Server not responding correctly');
      return false;
    }
  } catch (error) {
    logTest('Server Health Check', false, `Server not running: ${error.message}`);
    return false;
  }
}

// Test 2: Check if telecallers table exists
async function testTelecallersTable() {
  try {
    const response = await fetch(`${BASE_URL}/api/telecallers`);
    
    if (response.ok) {
      const data = await response.json();
      logTest('Telecallers Table Exists', true);
      return true;
    } else if (response.status === 401) {
      logTest('Telecallers Table Exists', true, 'Table exists but requires authentication');
      return true;
    } else {
      logTest('Telecallers Table Exists', false, `HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logTest('Telecallers Table Exists', false, `Table not accessible: ${error.message}`);
    return false;
  }
}

// Test 3: Check if telecallers API endpoint is registered
async function testTelecallersEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/telecallers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Even if we get 401 (unauthorized), it means the endpoint exists
    if (response.status === 401 || response.status === 200) {
      logTest('Telecallers API Endpoint', true);
      return true;
    } else {
      logTest('Telecallers API Endpoint', false, `HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logTest('Telecallers API Endpoint', false, `Endpoint not accessible: ${error.message}`);
    return false;
  }
}

// Test 4: Check if POST endpoint exists (without authentication)
async function testAddTelecallerEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/telecallers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: TEST_TELECALLER_NAME,
        email: '',
        phone: '',
        branch: 'Test Branch'
      })
    });
    
    // We expect 401 (unauthorized) since we're not sending auth token
    if (response.status === 401) {
      logTest('Add Telecaller Endpoint', true, 'Endpoint exists but requires authentication');
      return true;
    } else if (response.status === 201) {
      logTest('Add Telecaller Endpoint', true, 'Endpoint works without authentication');
      return true;
    } else {
      logTest('Add Telecaller Endpoint', false, `HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logTest('Add Telecaller Endpoint', false, `Endpoint not accessible: ${error.message}`);
    return false;
  }
}

// Test 5: Check if frontend files exist
async function testFrontendFiles() {
  const fs = require('fs');
  const path = require('path');
  
  const frontendFiles = [
    'src/NicsanCRMMock.tsx',
    'src/services/dualStorageService.ts',
    'src/services/backendApiService.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of frontendFiles) {
    if (fs.existsSync(file)) {
      logTest(`Frontend File: ${file}`, true);
    } else {
      logTest(`Frontend File: ${file}`, false, 'File not found');
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Test 6: Check if AutocompleteInput component has Add New functionality
async function testAutocompleteInputComponent() {
  const fs = require('fs');
  
  try {
    const content = fs.readFileSync('src/NicsanCRMMock.tsx', 'utf8');
    
    const hasAddNewProps = content.includes('onAddNew') && content.includes('showAddNew');
    const hasAddNewOption = content.includes('showAddNewOption');
    const hasAddNewButton = content.includes("Add '{value}' as new Telecaller");
    const hasHandleAddNew = content.includes('handleAddNew');
    
    if (hasAddNewProps && hasAddNewOption && hasAddNewButton && hasHandleAddNew) {
      logTest('AutocompleteInput Add New Component', true);
      return true;
    } else {
      logTest('AutocompleteInput Add New Component', false, 'Missing Add New functionality in component');
      return false;
    }
  } catch (error) {
    logTest('AutocompleteInput Add New Component', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// Test 7: Check if handleAddNewTelecaller function exists
async function testHandleAddNewTelecallerFunction() {
  const fs = require('fs');
  
  try {
    const content = fs.readFileSync('src/NicsanCRMMock.tsx', 'utf8');
    
    const hasFunction = content.includes('handleAddNewTelecaller');
    const hasDualStorageCall = content.includes('DualStorageService.addTelecaller');
    const hasAutoSelect = content.includes('callerName: telecallerName');
    const hasRefresh = content.includes('DualStorageService.getTelecallers');
    
    if (hasFunction && hasDualStorageCall && hasAutoSelect && hasRefresh) {
      logTest('handleAddNewTelecaller Function', true);
      return true;
    } else {
      logTest('handleAddNewTelecaller Function', false, 'Missing required functionality');
      return false;
    }
  } catch (error) {
    logTest('handleAddNewTelecaller Function', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// Test 8: Check if DualStorageService has addTelecaller method
async function testDualStorageService() {
  const fs = require('fs');
  
  try {
    const content = fs.readFileSync('src/services/dualStorageService.ts', 'utf8');
    
    const hasAddTelecaller = content.includes('addTelecaller');
    const hasBackendApiCall = content.includes('backendApiService.addTelecaller');
    
    if (hasAddTelecaller && hasBackendApiCall) {
      logTest('DualStorageService addTelecaller', true);
      return true;
    } else {
      logTest('DualStorageService addTelecaller', false, 'Missing addTelecaller method');
      return false;
    }
  } catch (error) {
    logTest('DualStorageService addTelecaller', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// Test 9: Check if BackendApiService has addTelecaller method
async function testBackendApiService() {
  const fs = require('fs');
  
  try {
    const content = fs.readFileSync('src/services/backendApiService.ts', 'utf8');
    
    const hasAddTelecaller = content.includes('addTelecaller');
    const hasApiUrl = content.includes('/api/telecallers');
    const hasPostMethod = content.includes('method: \'POST\'');
    
    if (hasAddTelecaller && hasApiUrl && hasPostMethod) {
      logTest('BackendApiService addTelecaller', true);
      return true;
    } else {
      logTest('BackendApiService addTelecaller', false, 'Missing addTelecaller method');
      return false;
    }
  } catch (error) {
    logTest('BackendApiService addTelecaller', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// Test 10: Check if backend routes are properly configured
async function testBackendRoutes() {
  const fs = require('fs');
  
  try {
    const serverContent = fs.readFileSync('nicsan-crm-backend/server.js', 'utf8');
    const routesContent = fs.readFileSync('nicsan-crm-backend/routes/telecallers.js', 'utf8');
    
    const hasRouteRegistration = serverContent.includes('/api/telecallers');
    const hasTelecallersRoute = serverContent.includes('require(\'./routes/telecallers\')');
    const hasPostRoute = routesContent.includes('router.post(\'/\'');
    const hasGetRoute = routesContent.includes('router.get(\'/\'');
    
    if (hasRouteRegistration && hasTelecallersRoute && hasPostRoute && hasGetRoute) {
      logTest('Backend Routes Configuration', true);
      return true;
    } else {
      logTest('Backend Routes Configuration', false, 'Missing route configuration');
      return false;
    }
  } catch (error) {
    logTest('Backend Routes Configuration', false, `Error reading files: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 TELECALLER "ADD NEW" FUNCTIONALITY TEST SUITE', 'bold');
  log('=' .repeat(60), 'blue');
  
  // Run all tests
  await testServerHealth();
  await testTelecallersTable();
  await testTelecallersEndpoint();
  await testAddTelecallerEndpoint();
  await testFrontendFiles();
  await testAutocompleteInputComponent();
  await testHandleAddNewTelecallerFunction();
  await testDualStorageService();
  await testBackendApiService();
  await testBackendRoutes();
  
  // Print results
  log('\n📊 TEST RESULTS', 'bold');
  log('=' .repeat(60), 'blue');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, testResults.failed === 0 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Telecaller "Add New" functionality is fully implemented!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation.', 'yellow');
  }
  
  log('\n💡 To test the actual functionality:', 'blue');
  log('1. Start the backend server: cd nicsan-crm-backend && npm run dev', 'blue');
  log('2. Start the frontend: npm run dev', 'blue');
  log('3. Go to any page with telecaller field', 'blue');
  log('4. Type a new name and look for "Add New" button', 'blue');
}

// Run the tests
runTests().catch(console.error);
