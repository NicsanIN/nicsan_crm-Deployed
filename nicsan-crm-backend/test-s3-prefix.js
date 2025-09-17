// Test S3 prefix functionality
const { withPrefix } = require('./utils/s3Prefix');

console.log('🧪 Testing S3 Prefix Functionality\n');

// Test cases
const testCases = [
  {
    name: 'No S3_PREFIX set',
    env: {},
    key: 'uploads/test/file.pdf',
    expected: 'uploads/test/file.pdf'
  },
  {
    name: 'S3_PREFIX without trailing slash',
    env: { S3_PREFIX: 'staging' },
    key: 'uploads/test/file.pdf',
    expected: 'staging/uploads/test/file.pdf'
  },
  {
    name: 'S3_PREFIX with trailing slash',
    env: { S3_PREFIX: 'staging/' },
    key: 'uploads/test/file.pdf',
    expected: 'staging/uploads/test/file.pdf'
  },
  {
    name: 'S3_PREFIX with multiple slashes',
    env: { S3_PREFIX: 'staging//' },
    key: 'uploads/test/file.pdf',
    expected: 'staging/uploads/test/file.pdf'
  },
  {
    name: 'Data policy key',
    env: { S3_PREFIX: 'prod' },
    key: 'data/policies/manual/POL123.json',
    expected: 'prod/data/policies/manual/POL123.json'
  }
];

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  // Set environment variable
  const originalPrefix = process.env.S3_PREFIX;
  if (testCase.env.S3_PREFIX) {
    process.env.S3_PREFIX = testCase.env.S3_PREFIX;
  } else {
    delete process.env.S3_PREFIX;
  }
  
  // Test the function
  const result = withPrefix(testCase.key);
  
  // Check result
  const passed = result === testCase.expected;
  console.log(`  Input: "${testCase.key}"`);
  console.log(`  S3_PREFIX: "${testCase.env.S3_PREFIX || '(not set)'}"`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got: "${result}"`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Restore original environment
  if (originalPrefix) {
    process.env.S3_PREFIX = originalPrefix;
  } else {
    delete process.env.S3_PREFIX;
  }
});

console.log('🧪 S3 Prefix Test Complete');
