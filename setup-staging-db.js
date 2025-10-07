import pkg from 'pg';
const { Pool } = pkg;

// Database connection for setup
const setupPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
    secureProtocol: 'TLSv1_2_method'
  } : false,
});

async function setupStagingDatabase() {
  try {
    console.log('🔧 Setting up staging database...');
    
    // Create staging database
    await setupPool.query('CREATE DATABASE nicsan_crm_staging;');
    console.log('✅ Created nicsan_crm_staging database');
    
    // Create staging user
    await setupPool.query(`
      CREATE USER nicsan_app_staging WITH PASSWORD 'NicsanStaging2024!@#';
    `);
    console.log('✅ Created nicsan_app_staging user');
    
    // Grant permissions
    await setupPool.query(`
      GRANT ALL PRIVILEGES ON DATABASE nicsan_crm_staging TO nicsan_app_staging;
    `);
    console.log('✅ Granted database permissions');
    
    // Connect to staging database and grant schema permissions
    const stagingPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'nicsan_crm_staging',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_password',
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
        secureProtocol: 'TLSv1_2_method'
      } : false,
    });
    
    await stagingPool.query(`
      GRANT ALL PRIVILEGES ON SCHEMA public TO nicsan_app_staging;
    `);
    console.log('✅ Granted schema permissions');
    
    await stagingPool.end();
    await setupPool.end();
    
    console.log('🎉 Staging database setup complete!');
    console.log('📝 Use these credentials for staging:');
    console.log('   User: nicsan_app_staging');
    console.log('   Password: NicsanStaging2024!@#');
    console.log('   Database: nicsan_crm_staging');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  Database nicsan_crm_staging already exists');
    } else if (error.code === '42710') {
      console.log('ℹ️  User nicsan_app_staging already exists');
    } else {
      console.error('❌ Setup error:', error.message);
    }
  }
}

setupStagingDatabase();
