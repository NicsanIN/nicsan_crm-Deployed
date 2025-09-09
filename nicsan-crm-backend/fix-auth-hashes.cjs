// Fix Authentication Hashes - Generate Node.js bcryptjs Compatible Hashes
// This script generates bcryptjs hashes that are compatible with the Node.js authentication system

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔧 Generating Node.js bcryptjs compatible hashes...');
  console.log('================================================');
  
  try {
    // Generate hashes with bcryptjs (same library used for verification)
    const opsHash = await bcrypt.hash('NicsanOps2024!@#', 12);
    const adminHash = await bcrypt.hash('NicsanAdmin2024!@#', 12);
    
    console.log('\n✅ Generated Hashes:');
    console.log('===================');
    console.log('Ops hash:', opsHash);
    console.log('Admin hash:', adminHash);
    
    console.log('\n📋 SQL Commands to Update Database:');
    console.log('===================================');
    console.log('-- Delete existing users');
    console.log("DELETE FROM users WHERE email IN ('ops@nicsan.in', 'admin@nicsan.in');");
    console.log('');
    console.log('-- Insert with Node.js generated hashes');
    console.log('INSERT INTO users (email, password_hash, name, role) VALUES');
    console.log(`('ops@nicsan.in', '${opsHash}', 'Operations User', 'ops'),`);
    console.log(`('admin@nicsan.in', '${adminHash}', 'Founder User', 'founder');`);
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Copy the SQL commands above');
    console.log('2. Run them in your PostgreSQL database');
    console.log('3. Test login with:');
    console.log('   - Email: ops@nicsan.in, Password: NicsanOps2024!@#');
    console.log('   - Email: admin@nicsan.in, Password: NicsanAdmin2024!@#');
    console.log('4. Verify all API endpoints work');
    
    console.log('\n✅ Hash generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating hashes:', error);
    process.exit(1);
  }
}

// Run the hash generation
generateHashes();
