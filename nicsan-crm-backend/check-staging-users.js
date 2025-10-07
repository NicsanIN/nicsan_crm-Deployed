import('./config/database.js').then(async (db) => {
  try {
    console.log('🔍 Checking users in staging database...');
    
    // Check if users exist in staging database
    const result = await db.query('SELECT email, name, role FROM users LIMIT 5');
    console.log('✅ Users in staging database:');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in staging database');
      console.log('💡 You may need to initialize users');
    } else {
      result.rows.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - ${user.role}`);
      });
    }
    
    // Try to initialize users if none exist
    if (result.rows.length === 0) {
      console.log('🔧 Initializing default users...');
      const authService = await import('./services/authService.js');
      await authService.default.initializeDefaultUsers();
      console.log('✅ Default users initialized');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
  process.exit(0);
});
