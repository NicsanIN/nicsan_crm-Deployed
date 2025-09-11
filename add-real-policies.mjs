/**
 * ADD REAL POLICIES TO DATABASE
 * This script actually adds policies to your PostgreSQL database
 */

// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3001/api';

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test Helper Functions
function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    testResults.details.push({ status: 'PASS', message });
    console.log(`✅ ${message}`);
  } else {
    testResults.failed++;
    testResults.details.push({ status: 'FAIL', message });
    console.error(`❌ ${message}`);
  }
}

async function makeApiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAddRealPolicyViaManualForm() {
  console.log('\n🧪 Testing Add Real Policy via Manual Form...');
  
  const policyData = {
    policy_number: 'TA-9925',
    vehicle_number: 'KA 55 MM 1218',
    insurer: 'Tata AIG',
    product_type: 'Private Car',
    vehicle_type: 'Private Car',
    make: 'Maruti',
    model: 'Swift',
    cc: '1197',
    manufacturing_year: '2021',
    issue_date: '2025-01-15',
    expiry_date: '2026-01-14',
    idv: '495000',
    ncb: '20',
    discount: '0',
    net_od: '5400',
    ref: '',
    total_od: '7200',
    net_premium: '10800',
    total_premium: '10800',
    cashback_percentage: '5',
    cashback_amount: '540',
    customer_paid: '10260',
    customer_cheque_no: 'CHQ001',
    our_cheque_no: 'OUR001',
    executive: 'John Doe',
    caller_name: 'Jane Smith',
    mobile: '9876543210',
    rollover: 'Yes',
    customer_name: 'Rajesh Kumar',
    remark: 'Test policy from real API call',
    brokerage: '1620',
    cashback: '540',
    source: 'MANUAL_FORM'
  };
  
  const result = await makeApiCall('/policies/manual', 'POST', policyData);
  
  assert(result.success, 'Manual Form - API call successful');
  assert(result.data && result.data.success, 'Manual Form - Policy created successfully');
  assert(result.data.policy, 'Manual Form - Policy data returned');
  assert(result.data.policy.policy_number === 'TA-9925', 'Manual Form - Policy number correct');
  
  return result.data.policy;
}

async function testAddRealPolicyViaGridEntry() {
  console.log('\n🧪 Testing Add Real Policy via Grid Entry...');
  
  const gridData = {
    policies: [
      {
        policy_number: 'TA-9926',
        vehicle_number: 'KA 56 MM 1219',
        insurer: 'Digit',
        total_premium: '12000',
        executive: 'John Doe',
        source: 'MANUAL_GRID'
      },
      {
        policy_number: 'TA-9927',
        vehicle_number: 'KA 57 MM 1220',
        insurer: 'Reliance General',
        total_premium: '15000',
        executive: 'Jane Smith',
        source: 'MANUAL_GRID'
      }
    ]
  };
  
  const result = await makeApiCall('/policies/bulk', 'POST', gridData);
  
  assert(result.success, 'Grid Entry - API call successful');
  assert(result.data && result.data.success, 'Grid Entry - Bulk policies created successfully');
  assert(result.data.created === 2, 'Grid Entry - 2 policies created');
  assert(result.data.policies && result.data.policies.length === 2, 'Grid Entry - Policy data returned');
  
  return result.data.policies;
}

async function testGetAllPolicies() {
  console.log('\n🧪 Testing Get All Policies...');
  
  const result = await makeApiCall('/policies');
  
  assert(result.success, 'Get Policies - API call successful');
  assert(result.data && result.data.success, 'Get Policies - Data retrieved successfully');
  assert(Array.isArray(result.data.policies), 'Get Policies - Policies array returned');
  assert(result.data.policies.length >= 2, 'Get Policies - At least 2 policies exist');
  
  console.log(`📊 Total policies in database: ${result.data.policies.length}`);
  result.data.policies.forEach((policy, index) => {
    console.log(`  ${index + 1}. ${policy.policy_number} - ${policy.insurer} - ${policy.source}`);
  });
  
  return result.data.policies;
}

async function testSearchPolicy() {
  console.log('\n🧪 Testing Search Policy...');
  
  const result = await makeApiCall('/policies/search?q=TA-9925');
  
  assert(result.success, 'Search Policy - API call successful');
  assert(result.data && result.data.success, 'Search Policy - Search successful');
  assert(Array.isArray(result.data.policies), 'Search Policy - Policies array returned');
  assert(result.data.policies.length > 0, 'Search Policy - Found matching policies');
  
  console.log(`🔍 Search results for 'TA-9925': ${result.data.policies.length} policies found`);
  
  return result.data.policies;
}

async function testGetDashboardMetrics() {
  console.log('\n🧪 Testing Get Dashboard Metrics...');
  
  const result = await makeApiCall('/dashboard/metrics');
  
  assert(result.success, 'Dashboard Metrics - API call successful');
  assert(result.data && result.data.success, 'Dashboard Metrics - Data retrieved successfully');
  assert(result.data.metrics, 'Dashboard Metrics - Metrics data returned');
  assert(result.data.metrics.total_policies >= 2, 'Dashboard Metrics - Policy count updated');
  
  console.log(`📊 Dashboard metrics:`);
  console.log(`  • Total Policies: ${result.data.metrics.total_policies}`);
  console.log(`  • Total GWP: ${result.data.metrics.total_gwp}`);
  console.log(`  • Total Brokerage: ${result.data.metrics.total_brokerage}`);
  
  return result.data.metrics;
}

async function runRealPolicyTests() {
  console.log('🚀 Starting Real Policy Addition Tests...\n');
  
  try {
    // Test 1: Add policy via Manual Form
    const manualPolicy = await testAddRealPolicyViaManualForm();
    
    // Test 2: Add policies via Grid Entry
    const gridPolicies = await testAddRealPolicyViaGridEntry();
    
    // Test 3: Get all policies
    const allPolicies = await testGetAllPolicies();
    
    // Test 4: Search for specific policy
    const searchResults = await testSearchPolicy();
    
    // Test 5: Get dashboard metrics
    const metrics = await testGetDashboardMetrics();
    
    // Test Results Summary
    console.log('\n📊 REAL POLICY ADDITION TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    // Detailed Results
    console.log('\n📋 DETAILED RESULTS');
    console.log('='.repeat(50));
    testResults.details.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.message}`);
    });
    
    // Policy Summary
    console.log('\n📊 REAL POLICY ADDITION SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Added 3 new policies to database:');
    console.log(`  • TA-9925 via Manual Form (${manualPolicy.insurer})`);
    console.log(`  • TA-9926 via Grid Entry (${gridPolicies[0].insurer})`);
    console.log(`  • TA-9927 via Grid Entry (${gridPolicies[1].insurer})`);
    console.log('');
    console.log(`✅ Total policies in database: ${allPolicies.length}`);
    console.log('');
    console.log('✅ Dashboard metrics updated:');
    console.log(`  • Total Policies: ${metrics.total_policies}`);
    console.log(`  • Total GWP: ${metrics.total_gwp}`);
    console.log(`  • Total Brokerage: ${metrics.total_brokerage}`);
    console.log('');
    console.log('🎯 Now you can see these policies in the frontend!');
    console.log('   • Go to: http://localhost:5174/');
    console.log('   • Login: ops@nicsan.in / ops123');
    console.log('   • Navigate: Operations → Policy Detail');
    console.log('   • Search for: TA-9925, TA-9926, TA-9927');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests
runRealPolicyTests();
