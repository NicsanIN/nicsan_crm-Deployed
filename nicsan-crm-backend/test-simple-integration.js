// Simple test of S3 prefix integration
const { withPrefix } = require('./utils/s3Prefix');

console.log('🧪 Simple S3 Prefix Integration Test\n');

// Test the withPrefix function directly with various scenarios
const testKeys = [
  'uploads/TATA_AIG/1234567890_abc123.pdf',
  'data/policies/manual/POL123_1234567890_abc123.json',
  'data/policies/bulk/BATCH456_1234567890_abc123.json'
];

const testPrefixes = [
  null,           // No prefix
  'staging',      // Simple prefix
  'staging/',     // Prefix with trailing slash
  'prod',         // Production prefix
  'dev/test'      // Nested prefix
];

testPrefixes.forEach(prefix => {
  console.log(`\nTesting with prefix: "${prefix || '(none)'}"`);
  
  if (prefix) {
    process.env.S3_PREFIX = prefix;
  } else {
    delete process.env.S3_PREFIX;
  }
  
  testKeys.forEach(key => {
    const result = withPrefix(key);
    console.log(`  ${key} → ${result}`);
  });
});

console.log('\n🧪 Simple Integration Test Complete');

