const { Client } = require('pg');
require('dotenv').config();

console.log('🔍 Creating Database...');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function createDatabase() {
  try {
    console.log('🔄 Connecting to postgres database...');
    await client.connect();
    console.log('✅ Connected to postgres database');
    
    // Check if database already exists
    const checkDb = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'nicsan_crm'
    `);
    
    if (checkDb.rows.length > 0) {
      console.log('✅ Database nicsan_crm already exists');
    } else {
      console.log('🔄 Creating database nicsan_crm...');
      await client.query('CREATE DATABASE nicsan_crm');
      console.log('✅ Database nicsan_crm created successfully');
    }
    
    await client.end();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    console.error('Error code:', error.code);
  }
}

createDatabase();
