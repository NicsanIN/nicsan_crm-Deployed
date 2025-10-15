import('./config/database.js').then(async (db) => {
  try {
    console.log('🔍 Checking staging backend database connection...');
    
    // Get database info
    const dbInfo = await db.query('SELECT current_database(), current_user, version()');
    console.log('Database:', dbInfo.rows[0].current_database);
    console.log('User:', dbInfo.rows[0].current_user);
    console.log('Version:', dbInfo.rows[0].version.split(' ')[0]);
    
    // Check if we're connected to staging or production database
    const dbName = dbInfo.rows[0].current_database;
    if (dbName === 'nicsan_crm_staging') {
      console.log('✅ Connected to STAGING database');
    } else if (dbName === 'nicsan_crm') {
      console.log('⚠️ Connected to PRODUCTION database (this might be the issue!)');
    } else {
      console.log('❓ Connected to unknown database:', dbName);
    }
    
    // Check users in current database
    const users = await db.query('SELECT email, name, role FROM users');
    console.log('Users in current database:');
    users.rows.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
});
