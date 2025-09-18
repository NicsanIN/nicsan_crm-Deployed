// Debug S3 prefix functionality
const { withPrefix } = require('./utils/s3Prefix');

console.log('🔍 Debugging S3 Prefix Functionality\n');

// Test 1: No S3_PREFIX set
console.log('Test 1: No S3_PREFIX set');
console.log('process.env.S3_PREFIX:', process.env.S3_PREFIX);
console.log('typeof process.env.S3_PREFIX:', typeof process.env.S3_PREFIX);
console.log('Boolean(process.env.S3_PREFIX):', Boolean(process.env.S3_PREFIX));

delete process.env.S3_PREFIX;
console.log('After delete:');
console.log('process.env.S3_PREFIX:', process.env.S3_PREFIX);
console.log('typeof process.env.S3_PREFIX:', typeof process.env.S3_PREFIX);
console.log('Boolean(process.env.S3_PREFIX):', Boolean(process.env.S3_PREFIX));

const result1 = withPrefix('uploads/test/file.pdf');
console.log('Result:', result1);
console.log('Expected: uploads/test/file.pdf');
console.log('Match:', result1 === 'uploads/test/file.pdf');
console.log('');

// Test 2: S3_PREFIX set
console.log('Test 2: S3_PREFIX set');
process.env.S3_PREFIX = 'staging';
console.log('process.env.S3_PREFIX:', process.env.S3_PREFIX);
console.log('typeof process.env.S3_PREFIX:', typeof process.env.S3_PREFIX);
console.log('Boolean(process.env.S3_PREFIX):', Boolean(process.env.S3_PREFIX));

const result2 = withPrefix('uploads/test/file.pdf');
console.log('Result:', result2);
console.log('Expected: staging/uploads/test/file.pdf');
console.log('Match:', result2 === 'staging/uploads/test/file.pdf');

