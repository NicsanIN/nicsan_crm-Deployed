const bcrypt = require('bcryptjs');

console.log('🔐 Generating password hashes...');

const adminPassword = 'NicsanAdmin2024!@#';
const opsPassword = 'NicsanOps2024!@#';

const adminHash = bcrypt.hashSync(adminPassword, 12);
const opsHash = bcrypt.hashSync(opsPassword, 12);

console.log('✅ Admin hash for admin@nicsan.in:');
console.log(adminHash);
console.log('');
console.log('✅ Ops hash for ops@nicsan.in:');
console.log(opsHash);
console.log('');
console.log('📝 SQL UPDATE statements:');
console.log('');
console.log('-- Update admin password');
console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE email = 'admin@nicsan.in';`);
console.log('');
console.log('-- Update ops password');
console.log(`UPDATE users SET password_hash = '${opsHash}' WHERE email = 'ops@nicsan.in';`);
