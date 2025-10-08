import pkg from 'pg';
const { Pool } = pkg;

async function checkAndCreateUser() {
  // First, let's try to connect with the existing postgres user from your .env
  const pool = new Pool({
    host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'nicsan_crm',
    user: 'postgres',
    password: 'Nicsan@007', // From your .env file
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking if nicsan_app_staging user exists...');
    
    // Check if user exists
    const userCheck = await pool.query(`
      SELECT usename FROM pg_user WHERE usename = 'nicsan_app_staging';
    `);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User nicsan_app_staging does not exist. Creating...');
      
      // Create the user
      await pool.query(`
        CREATE USER nicsan_app_staging WITH PASSWORD 'NicsanStaging2024!@#';
      `);
      console.log('✅ Created nicsan_app_staging user');
    } else {
      console.log('✅ User nicsan_app_staging exists');
      
      // Update password to be sure
      await pool.query(`
        ALTER USER nicsan_app_staging WITH PASSWORD 'NicsanStaging2024!@#';
      `);
      console.log('✅ Updated nicsan_app_staging password');
    }
    
    // Create staging schema if it doesn't exist
    await pool.query('CREATE SCHEMA IF NOT EXISTS nicsan_crm_staging;');
    console.log('✅ Created nicsan_crm_staging schema');
    
    // Grant permissions
    await pool.query('GRANT ALL PRIVILEGES ON SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    console.log('✅ Granted permissions to staging schema');
    
    // Test the connection with the staging user
    const stagingPool = new Pool({
      host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
      port: 5432,
      database: 'nicsan_crm',
      user: 'nicsan_app_staging',
      password: 'NicsanStaging2024!@#',
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await stagingPool.query('SELECT current_database(), current_user, current_schema()');
    console.log('✅ Staging connection works!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Schema:', result.rows[0].current_schema);
    
    await stagingPool.end();
    await pool.end();
    
    console.log('🎉 Database setup complete!');
    console.log('📝 Use this connection string in AWS Parameter Store:');
    console.log('postgres://nicsan_app_staging:NicsanStaging2024!@#@nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com:5432/nicsan_crm?sslmode=no-verify');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Try these alternative passwords for postgres user:');
    console.log('   - Nicsan@007');
    console.log('   - %23\\<Yc\'4{80xK');
    console.log('   - Check your AWS RDS master password');
  }
}

checkAndCreateUser();
