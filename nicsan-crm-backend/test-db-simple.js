const { Client } = require('pg');
require('dotenv').config();

console.log('🔍 Simple Database Connection Test...');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('SSL:', process.env.DB_SSL);

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
});

async function testSimpleConnection() {
  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query successful:', result.rows[0]);
    
    await client.end();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
  }
}

testSimpleConnection();
