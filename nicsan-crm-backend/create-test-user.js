const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🔍 Creating Test User...');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function createTestUser() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if test user already exists
    const existingUser = await client.query(`
      SELECT id, email, name, role FROM users WHERE email = 'admin@nicsan.in'
    `);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Test user already exists:');
      console.log('  - Email:', existingUser.rows[0].email);
      console.log('  - Name:', existingUser.rows[0].name);
      console.log('  - Role:', existingUser.rows[0].role);
      console.log('  - ID:', existingUser.rows[0].id);
    } else {
      // Create test user
      const hashedPassword = await bcrypt.hash('founder123', 10);
      
      const result = await client.query(`
        INSERT INTO users (email, name, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role
      `, ['founder@nicsan.com', 'Founder User', hashedPassword, 'founder']);
      
      console.log('✅ Test user created successfully:');
      console.log('  - Email:', result.rows[0].email);
      console.log('  - Name:', result.rows[0].name);
      console.log('  - Role:', result.rows[0].role);
      console.log('  - ID:', result.rows[0].id);
      console.log('  - Password: founder123');
    }
    
    // Create ops user as well
    const existingOpsUser = await client.query(`
      SELECT id, email, name, role FROM users WHERE email = 'ops@nicsan.in'
    `);
    
    if (existingOpsUser.rows.length > 0) {
      console.log('✅ Ops user already exists:');
      console.log('  - Email:', existingOpsUser.rows[0].email);
      console.log('  - Name:', existingOpsUser.rows[0].name);
      console.log('  - Role:', existingOpsUser.rows[0].role);
    } else {
      const hashedPassword = await bcrypt.hash('ops123', 10);
      
      const result = await client.query(`
        INSERT INTO users (email, name, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role
      `, ['ops@nicsan.in', 'Ops User', hashedPassword, 'ops']);
      
      console.log('✅ Ops user created successfully:');
      console.log('  - Email:', result.rows[0].email);
      console.log('  - Name:', result.rows[0].name);
      console.log('  - Role:', result.rows[0].role);
      console.log('  - Password: ops123');
    }
    
    await client.end();
    console.log('✅ Test users setup completed');
    
    console.log('\n📋 Login Credentials:');
    console.log('Founder Account:');
    console.log('  - Email: founder@nicsan.com');
    console.log('  - Password: founder123');
    console.log('  - Role: founder (full access)');
    console.log('\nOps Account:');
    console.log('  - Email: ops@nicsan.in');
    console.log('  - Password: ops123');
    console.log('  - Role: ops (limited access)');
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error.message);
    console.error('Full error:', error);
  }
}

createTestUser();
