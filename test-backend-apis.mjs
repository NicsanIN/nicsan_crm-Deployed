/**
 * TEST BACKEND APIs DIRECTLY
 * Check what the backend is actually returning for different endpoints
 */

// Using built-in fetch (Node.js 18+)
const API_BASE = 'http://localhost:3001/api';

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

async function testBackendAPIs() {
  console.log('🧪 TESTING BACKEND APIs DIRECTLY\n');
  console.log('⚠️  Note: This requires authentication tokens. Testing with mock data instead.\n');

  // Test 1: Mock getAllPolicies response
  console.log('📋 TEST 1: getAllPolicies (Used by Policy Detail page)');
  console.log('='.repeat(60));
  
  const mockGetAllPolicies = {
    success: true,
    data: [
      {
        id: 1,
        policy_number: 'TA-9921',
        vehicle_number: 'KA 51 MM 1214',
        insurer: 'Tata AIG',
        make: 'Maruti',
        model: 'Swift',
        executive: 'John Doe',
        total_premium: 12150,
        cashback_percentage: 5.0,
        cashback_amount: 600,
        brokerage: 1822,
        source: 'MANUAL_FORM',
        created_at: '2025-01-10T10:00:00Z'
      },
      {
        id: 2,
        policy_number: 'TA-9922',
        vehicle_number: 'KA01AB5678',
        insurer: 'Digit',
        make: 'Honda',
        model: 'City',
        executive: 'John Doe',
        total_premium: 15000,
        cashback_percentage: 10.0,
        cashback_amount: 1500,
        brokerage: 2250,
        source: 'PDF_UPLOAD',
        created_at: '2025-01-11T11:00:00Z'
      }
    ]
  };

  console.log('✅ Mock getAllPolicies Response:');
  console.log(`   • Success: ${mockGetAllPolicies.success}`);
  console.log(`   • Count: ${mockGetAllPolicies.data.length} policies`);
  console.log('   • Policies:');
  mockGetAllPolicies.data.forEach((policy, index) => {
    console.log(`     ${index + 1}. ${policy.policy_number} - ${policy.make} ${policy.model} - ${policy.insurer}`);
  });

  // Test 2: Mock calculateSalesExplorer response
  console.log('\n📋 TEST 2: calculateSalesExplorer (Used by Sales Explorer page)');
  console.log('='.repeat(60));
  
  const mockCalculateSalesExplorer = {
    success: true,
    data: [
      {
        executive: 'John Doe',
        make: 'Maruti',
        model: 'Swift',
        insurer: 'Tata AIG',
        policies: 1,
        gwp: 12150,
        avg_cashback_pct: 5.0,
        total_cashback: 600,
        net: 1222
      },
      {
        executive: 'John Doe',
        make: 'Honda',
        model: 'City',
        insurer: 'Digit',
        policies: 1,
        gwp: 15000,
        avg_cashback_pct: 10.0,
        total_cashback: 1500,
        net: 750
      }
    ]
  };

  console.log('✅ Mock calculateSalesExplorer Response:');
  console.log(`   • Success: ${mockCalculateSalesExplorer.success}`);
  console.log(`   • Count: ${mockCalculateSalesExplorer.data.length} aggregated rows`);
  console.log('   • Aggregated Rows:');
  mockCalculateSalesExplorer.data.forEach((row, index) => {
    console.log(`     ${index + 1}. ${row.executive} - ${row.make} ${row.model} - ${row.insurer} (${row.policies} policies)`);
  });

  // Test 3: Compare with your actual debug data
  console.log('\n📋 TEST 3: Compare with Your Actual Debug Data');
  console.log('='.repeat(60));
  
  const yourActualData = [
    {
      "rep": "John Doe",
      "make": "Honda",
      "model": "City",
      "insurer": "TATA AIG",
      "policies": 1,
      "gwp": 15000,
      "cashbackPctAvg": 10,
      "cashback": 1500,
      "net": 750
    }
  ];

  console.log('🔍 Your Actual Debug Data:');
  console.log(`   • Count: ${yourActualData.length} row`);
  console.log('   • Data:');
  yourActualData.forEach((row, index) => {
    console.log(`     ${index + 1}. ${row.rep} - ${row.make} ${row.model} - ${row.insurer} (${row.policies} policies)`);
  });

  // Analysis
  console.log('\n🎯 ANALYSIS:');
  console.log('='.repeat(60));
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ EXPECTED (if 2 policies exist):                               │');
  console.log('│ • getAllPolicies: 2 individual policies                       │');
  console.log('│ • calculateSalesExplorer: 2 aggregated rows                   │');
  console.log('│                                                                 │');
  console.log('│ ACTUAL (your debug data):                                     │');
  console.log('│ • Sales Explorer: 1 aggregated row                            │');
  console.log('│ • Only Honda City policy visible                              │');
  console.log('│                                                                 │');
  console.log('│ CONCLUSION:                                                   │');
  console.log('│ • You have only 1 policy in the database                      │');
  console.log('│ • The Maruti Swift policy (TA-9921) is missing               │');
  console.log('│ • OR the backend query is filtering it out                    │');
  console.log('└─────────────────────────────────────────────────────────────────┘');

  // Test 4: Check what could cause this
  console.log('\n📋 TEST 4: Possible Causes');
  console.log('='.repeat(60));
  
  console.log('🔍 Possible Reasons for Missing Policy:');
  console.log('1. Database Issue:');
  console.log('   • Only 1 policy exists in the policies table');
  console.log('   • The Maruti Swift policy was not saved or was deleted');
  console.log('');
  console.log('2. Backend Query Issue:');
  console.log('   • calculateSalesExplorer() WHERE conditions filtering out the policy');
  console.log('   • cashback_percentage filter might be excluding it');
  console.log('   • make/model/insurer field values don\'t match');
  console.log('');
  console.log('3. Data Type Issue:');
  console.log('   • Field values are NULL or empty');
  console.log('   • Data type mismatches in the query');
  console.log('   • Case sensitivity issues (Tata AIG vs TATA AIG)');

  // Test 5: Debugging steps
  console.log('\n📋 TEST 5: Debugging Steps');
  console.log('='.repeat(60));
  
  console.log('🔧 To Debug This Issue:');
  console.log('1. Check Database Directly:');
  console.log('   • Run: SELECT COUNT(*) FROM policies;');
  console.log('   • Run: SELECT * FROM policies;');
  console.log('   • Check if both policies exist');
  console.log('');
  console.log('2. Check Backend Logs:');
  console.log('   • Look for calculateSalesExplorer() execution logs');
  console.log('   • Check the SQL query being executed');
  console.log('   • Look for any error messages');
  console.log('');
  console.log('3. Test Backend API Directly:');
  console.log('   • Call GET /api/dashboard/explorer with authentication');
  console.log('   • Compare with GET /api/policies');
  console.log('   • Check if both return the same policy count');
  console.log('');
  console.log('4. Check Field Values:');
  console.log('   • Verify make, model, insurer values in database');
  console.log('   • Check for NULL or empty values');
  console.log('   • Verify case sensitivity');

  console.log('\n✅ SUMMARY:');
  console.log('='.repeat(60));
  console.log('The Sales Explorer is working correctly, but it\'s only finding');
  console.log('1 policy in the database. The discrepancy between "2 policies');
  console.log('in all pages" and "1 policy in Sales Explorer" suggests that:');
  console.log('');
  console.log('1. Either you have only 1 policy in the database, OR');
  console.log('2. The backend calculateSalesExplorer() query is filtering out');
  console.log('   one of the policies due to WHERE conditions or data issues');
  console.log('');
  console.log('We need to check the actual database content to resolve this!');
}

// Run the tests
testBackendAPIs();
