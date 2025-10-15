import pkg from 'pg';
const { Pool } = pkg;

async function fixStagingPassword() {
  const pool = new Pool({
    host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Nicsan@007',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Fixing staging user password...');
    
    // Update the password for nicsan_app_staging user
    await pool.query('ALTER USER nicsan_app_staging WITH PASSWORD $1', ['NicsanStaging2024!@#']);
    console.log('✅ Updated nicsan_app_staging password');
    
    // Test the staging connection
    const stagingPool = new Pool({
      host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
      port: 5432,
      database: 'nicsan_crm_staging',
      user: 'nicsan_app_staging',
      password: 'NicsanStaging2024!@#',
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await stagingPool.query('SELECT current_database(), current_user');
    console.log('✅ Staging connection works!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    
    await stagingPool.end();
    await pool.end();
    
    console.log('🎉 Staging database authentication fixed!');
    console.log('📝 Use this connection string:');
    console.log('postgres://nicsan_app_staging:NicsanStaging2024!@#@nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com:5432/nicsan_crm_staging?sslmode=no-verify');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixStagingPassword();
