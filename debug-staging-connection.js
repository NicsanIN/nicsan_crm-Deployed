const { Pool } = require('pg');

async function debugStagingConnection() {
  console.log('🔍 DEBUGGING STAGING CONNECTION');
  console.log('=====================================');
  
  // 1. Check Environment Variables
  console.log('\n📋 ENVIRONMENT VARIABLES:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET (hidden)' : 'NOT SET');
  console.log('PGHOST:', process.env.PGHOST);
  console.log('PGPORT:', process.env.PGPORT);
  console.log('PGDATABASE:', process.env.PGDATABASE);
  console.log('PGUSER:', process.env.PGUSER);
  console.log('PGPASSWORD:', process.env.PGPASSWORD ? 'SET (hidden)' : 'NOT SET');
  
  // 2. Show what connection parameters will be used
  console.log('\n🔧 CONNECTION PARAMETERS:');
  const connectionString = process.env.DATABASE_URL || undefined;
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.DB_PORT || process.env.PGPORT || 5432;
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'nicsan_crm';
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password';
  
  console.log('Connection String:', connectionString ? 'USED' : 'NOT USED');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('Database:', database);
  console.log('User:', user);
  console.log('Password:', password ? 'SET' : 'NOT SET');
  
  // 3. Test Connection
  console.log('\n🔌 TESTING CONNECTION:');
  try {
    const pool = new Pool({
      connectionString: connectionString,
      host: host,
      port: port,
      database: database,
      user: user,
      password: password,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
        secureProtocol: 'TLSv1_2_method'
      } : (process.env.DB_SSL === 'true' || process.env.PGSSL === 'true' || process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false),
    });
    
    // Test connection
    const result = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✅ Connection successful!');
    console.log('Connected to database:', result.rows[0].current_database);
    console.log('Connected as user:', result.rows[0].current_user);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    // Check if this is staging or production database
    const dbName = result.rows[0].current_database;
    if (dbName === 'nicsan_crm_staging') {
      console.log('🎯 CORRECT: Connected to STAGING database');
    } else if (dbName === 'nicsan_crm') {
      console.log('⚠️  WRONG: Connected to PRODUCTION database (this is the problem!)');
    } else {
      console.log('❓ UNKNOWN: Connected to database:', dbName);
    }
    
    // Check users in current database
    console.log('\n👥 USERS IN CURRENT DATABASE:');
    const users = await pool.query('SELECT email, name, role FROM users');
    if (users.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.rows.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - ${user.role}`);
      });
    }
    
    // Test specific user login
    console.log('\n🔐 TESTING USER LOGIN:');
    const testEmail = 'admin@nicsan.in';
    const testPassword = 'NicsanAdmin2024!@#';
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    if (userResult.rows.length === 0) {
      console.log(`❌ User ${testEmail} not found in database`);
    } else {
      const user = userResult.rows[0];
      console.log(`✅ User ${testEmail} found`);
      console.log('Password hash preview:', user.password_hash.substring(0, 20) + '...');
      console.log('Hash length:', user.password_hash.length);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
      console.log('Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ PASSWORD MISMATCH - This is why login fails!');
      } else {
        console.log('✅ Password is correct');
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
  
  console.log('\n=====================================');
  console.log('🏁 DEBUG COMPLETE');
}

debugStagingConnection();
