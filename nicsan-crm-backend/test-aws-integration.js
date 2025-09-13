// Test AWS config integration with S3 prefix
const { generateS3Key, generatePolicyS3Key } = require('./config/aws');

console.log('🧪 Testing AWS Config Integration with S3 Prefix\n');

// Test generateS3Key
console.log('Testing generateS3Key:');
process.env.S3_PREFIX = 'staging';
const s3Key = generateS3Key('test.pdf', 'TATA_AIG', Buffer.from('test'));
console.log('Generated S3 key:', s3Key);
console.log('Expected to start with: staging/uploads/TATA_AIG/');
console.log('Starts correctly:', s3Key.startsWith('staging/uploads/TATA_AIG/'));
console.log('');

// Test generatePolicyS3Key
console.log('Testing generatePolicyS3Key:');
const policyKey = generatePolicyS3Key('123', 'MANUAL_FORM');
console.log('Generated policy key:', policyKey);
console.log('Expected to start with: staging/data/policies/manual/');
console.log('Starts correctly:', policyKey.startsWith('staging/data/policies/manual/'));
console.log('');

// Test without prefix
console.log('Testing without S3_PREFIX:');
delete process.env.S3_PREFIX;
const s3KeyNoPrefix = generateS3Key('test.pdf', 'TATA_AIG', Buffer.from('test'));
console.log('Generated S3 key (no prefix):', s3KeyNoPrefix);
console.log('Expected to start with: uploads/TATA_AIG/');
console.log('Starts correctly:', s3KeyNoPrefix.startsWith('uploads/TATA_AIG/'));
console.log('');

console.log('🧪 AWS Integration Test Complete');

