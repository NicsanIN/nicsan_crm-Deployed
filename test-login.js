import('./config/database.js').then(async (db) => {
  try {
    console.log('🔍 Testing login credentials...');
    
    // Test admin@nicsan.in login
    const email = 'admin@nicsan.in';
    const password = 'NicsanAdmin2024!@#';
    
    console.log(`Testing login for: ${email}`);
    
    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', user.email, user.name, user.role);
    console.log('Password hash:', user.password_hash.substring(0, 20) + '...');
    
    // Test password comparison
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password_hash);
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Password is incorrect');
      console.log('💡 Let me check what the correct password should be...');
      
      // Try to create a new password hash
      const newHash = await bcrypt.default.hash(password, 12);
      console.log('New hash for testing:', newHash.substring(0, 20) + '...');
      
      // Update the password
      await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, email]);
      console.log('✅ Updated password hash');
      
      // Test again
      const isValidNow = await bcrypt.default.compare(password, newHash);
      console.log('Password valid after update:', isValidNow);
    } else {
      console.log('✅ Password is correct');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
});
