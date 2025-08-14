const { Pool } = require('pg');
require('dotenv').config();

console.log('🗄️ Creating nicsan_crm Database...');
console.log('==================================');

async function createDatabase() {
  // Connect to default postgres database first
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    console.log('🗄️ Creating nicsan_crm database...');
    
    // Create the database
    await client.query('CREATE DATABASE nicsan_crm');
    console.log('✅ Database "nicsan_crm" created successfully!');
    
    client.release();
    
    console.log();
    console.log('🎉 Database creation completed!');
    console.log('📊 Database: nicsan_crm');
    console.log('🔌 Port: 5432');
    console.log('👤 User: postgres');
    console.log();
    console.log('🚀 Next steps:');
    console.log('   1. node setup-schema.js');
    console.log('   2. node create-test-user.js');
    console.log('   3. npm run dev');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database "nicsan_crm" already exists!');
      console.log('🚀 You can proceed to the next step.');
    } else {
      console.error('❌ Failed to create database:', error.message);
      console.error('Error code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

createDatabase();


