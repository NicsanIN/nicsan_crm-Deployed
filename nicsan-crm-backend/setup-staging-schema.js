import pkg from 'pg';
const { Pool } = pkg;

async function setupStagingSchema() {
  const pool = new Pool({
    host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'nicsan_crm',
    user: 'postgres',
    password: '%23\\<Yc\'4{80xK',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Setting up staging schema...');
    
    // Create staging schema
    await pool.query('CREATE SCHEMA IF NOT EXISTS nicsan_crm_staging;');
    console.log('✅ Created nicsan_crm_staging schema');
    
    // Create production schema if it doesn't exist
    await pool.query('CREATE SCHEMA IF NOT EXISTS nicsan_crm_production;');
    console.log('✅ Created nicsan_crm_production schema');
    
    // Create staging user with proper permissions
    await pool.query(`
      CREATE USER IF NOT EXISTS nicsan_app_staging WITH PASSWORD 'NicsanStaging2024!@#';
    `);
    console.log('✅ Created nicsan_app_staging user');
    
    // Grant permissions to staging schema
    await pool.query('GRANT ALL PRIVILEGES ON SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA nicsan_crm_staging TO nicsan_app_staging;');
    console.log('✅ Granted permissions to staging schema');
    
    // Test the connection
    const stagingPool = new Pool({
      host: 'nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com',
      port: 5432,
      database: 'nicsan_crm',
      user: 'nicsan_app_staging',
      password: 'NicsanStaging2024!@#',
      ssl: { rejectUnauthorized: false },
      search_path: 'nicsan_crm_staging' // Set default schema
    });
    
    const result = await stagingPool.query('SELECT current_schema(), current_user');
    console.log('✅ Staging schema connection works!');
    console.log('Schema:', result.rows[0].current_schema);
    console.log('User:', result.rows[0].current_user);
    
    await stagingPool.end();
    await pool.end();
    
    console.log('🎉 Staging schema setup complete!');
    console.log('📝 Use this connection string:');
    console.log('postgres://nicsan_app_staging:NicsanStaging2024!@#@nicsan-crm-db.cdu4ium6ws7v.ap-south-1.rds.amazonaws.com:5432/nicsan_crm?sslmode=no-verify');
    console.log('📝 And set search_path=nicsan_crm_staging in your app');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupStagingSchema();
