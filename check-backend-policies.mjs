/**
 * CHECK BACKEND POLICIES
 * Test what the backend is actually returning for different endpoints
 */

// Mock the backend API calls
const mockBackendResponses = {
  // Mock what getAllPolicies returns (used by Policy Detail page)
  getAllPolicies: {
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
  },

  // Mock what calculateSalesExplorer returns (used by Sales Explorer page)
  calculateSalesExplorer: {
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
  }
};

console.log('🔍 CHECKING BACKEND POLICY RESPONSES\n');

console.log('📊 COMPARISON: getAllPolicies vs calculateSalesExplorer');
console.log('='.repeat(80));

console.log('\n1️⃣ getAllPolicies (Used by Policy Detail page):');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ Returns: Individual policy records                             │');
console.log('│ Count: 2 policies                                              │');
console.log('│ Structure: Raw policy data from database                       │');
console.log('└─────────────────────────────────────────────────────────────────┘');

mockBackendResponses.getAllPolicies.data.forEach((policy, index) => {
  console.log(`\nPolicy ${index + 1}:`);
  console.log(`  • ID: ${policy.id}`);
  console.log(`  • Policy Number: ${policy.policy_number}`);
  console.log(`  • Vehicle: ${policy.vehicle_number}`);
  console.log(`  • Insurer: ${policy.insurer}`);
  console.log(`  • Make: ${policy.make}`);
  console.log(`  • Model: ${policy.model}`);
  console.log(`  • Executive: ${policy.executive}`);
  console.log(`  • Premium: ₹${policy.total_premium}`);
  console.log(`  • Source: ${policy.source}`);
});

console.log('\n2️⃣ calculateSalesExplorer (Used by Sales Explorer page):');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ Returns: Aggregated data grouped by executive, make, model, insurer│');
console.log('│ Count: 2 aggregated rows                                       │');
console.log('│ Structure: GROUP BY executive, make, model, insurer            │');
console.log('└─────────────────────────────────────────────────────────────────┘');

mockBackendResponses.calculateSalesExplorer.data.forEach((row, index) => {
  console.log(`\nAggregated Row ${index + 1}:`);
  console.log(`  • Executive: ${row.executive}`);
  console.log(`  • Make: ${row.make}`);
  console.log(`  • Model: ${row.model}`);
  console.log(`  • Insurer: ${row.insurer}`);
  console.log(`  • Policies Count: ${row.policies}`);
  console.log(`  • GWP: ₹${row.gwp}`);
  console.log(`  • Avg Cashback %: ${row.avg_cashback_pct}%`);
  console.log(`  • Total Cashback: ₹${row.total_cashback}`);
  console.log(`  • Net: ₹${row.net}`);
});

console.log('\n🎯 THE ISSUE IDENTIFIED:');
console.log('='.repeat(80));
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ PROBLEM: Backend is returning DIFFERENT data for different pages│');
console.log('│                                                                 │');
console.log('│ getAllPolicies: 2 individual policies                          │');
console.log('│ calculateSalesExplorer: 2 aggregated rows                      │');
console.log('│                                                                 │');
console.log('│ But your debug shows: 1 aggregated row                         │');
console.log('│ This means the backend is NOT returning 2 rows!                │');
console.log('└─────────────────────────────────────────────────────────────────┘');

console.log('\n🔍 POSSIBLE CAUSES:');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ 1. Database Issue:                                             │');
console.log('│    • Only 1 policy exists in the database                     │');
console.log('│    • The second policy was not saved or was deleted           │');
console.log('│                                                                 │');
console.log('│ 2. Backend Query Issue:                                        │');
console.log('│    • calculateSalesExplorer() is not finding both policies    │');
console.log('│    • GROUP BY is aggregating them incorrectly                 │');
console.log('│    • WHERE conditions are filtering out one policy            │');
console.log('│                                                                 │');
console.log('│ 3. Data Mismatch:                                              │');
console.log('│    • getAllPolicies and calculateSalesExplorer use different  │');
console.log('│      data sources or queries                                   │');
console.log('│    • One is using cached data, other is using live data       │');
console.log('└─────────────────────────────────────────────────────────────────┘');

console.log('\n📋 INVESTIGATION STEPS:');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ 1. Check Database Directly:                                    │');
console.log('│    • Run: SELECT COUNT(*) FROM policies;                      │');
console.log('│    • Run: SELECT * FROM policies;                             │');
console.log('│                                                                 │');
console.log('│ 2. Check Backend Logs:                                         │');
console.log('│    • Look for calculateSalesExplorer() execution logs         │');
console.log('│    • Check if the SQL query is running correctly              │');
console.log('│                                                                 │');
console.log('│ 3. Test Backend API Directly:                                  │');
console.log('│    • Call GET /api/dashboard/explorer                          │');
console.log('│    • Compare with GET /api/policies                            │');
console.log('└─────────────────────────────────────────────────────────────────┘');

console.log('\n🎯 EXPECTED BEHAVIOR:');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log('│ If you have 2 policies in database:                           │');
console.log('│ • getAllPolicies: 2 individual records                        │');
console.log('│ • calculateSalesExplorer: 2 aggregated rows (if different     │');
console.log('│   make/model/insurer) OR 1 row with policies: 2 (if same)     │');
console.log('│                                                                 │');
console.log('│ Your debug shows: 1 row with policies: 1                      │');
console.log('│ This suggests only 1 policy exists in the database!           │');
console.log('└─────────────────────────────────────────────────────────────────┘');

console.log('\n✅ CONCLUSION:');
console.log('The discrepancy between "2 policies in all pages" and "1 policy in');
console.log('Sales Explorer" suggests that:');
console.log('1. Either you have only 1 policy in the database, OR');
console.log('2. The backend calculateSalesExplorer() is not working correctly');
console.log('');
console.log('We need to check the actual database content and backend logs!');
