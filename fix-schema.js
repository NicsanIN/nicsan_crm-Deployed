const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Fixing Database Schema...');
console.log('============================');

async function fixSchema() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    console.log('🗄️ Creating tables...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ops', 'founder')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create policies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_number VARCHAR(100) UNIQUE NOT NULL,
        vehicle_number VARCHAR(50) NOT NULL,
        insurer VARCHAR(100) NOT NULL,
        product_type VARCHAR(50) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100),
        cc VARCHAR(20),
        manufacturing_year VARCHAR(4),
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        idv DECIMAL(12,2) NOT NULL,
        ncb DECIMAL(5,2) NOT NULL,
        discount DECIMAL(5,2) DEFAULT 0,
        net_od DECIMAL(12,2) NOT NULL,
        ref VARCHAR(100),
        total_od DECIMAL(12,2) NOT NULL,
        net_premium DECIMAL(12,2) NOT NULL,
        total_premium DECIMAL(12,2) NOT NULL,
        cashback_percentage DECIMAL(5,2) DEFAULT 0,
        cashback_amount DECIMAL(12,2) DEFAULT 0,
        customer_paid DECIMAL(12,2) NOT NULL,
        customer_cheque_no VARCHAR(100),
        our_cheque_no VARCHAR(100),
        executive VARCHAR(100) NOT NULL,
        caller_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        rollover VARCHAR(100),
        remark TEXT,
        source VARCHAR(20) NOT NULL CHECK (source IN ('PDF_UPLOAD', 'MANUAL_FORM', 'MANUAL_GRID', 'CSV_IMPORT')),
        confidence_score DECIMAL(3,2),
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PARSING', 'NEEDS_REVIEW', 'SAVED', 'REJECTED')),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Policies table created');
    
    // Create pdf_uploads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pdf_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_url VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED')),
        confidence_score DECIMAL(3,2),
        extracted_data JSONB,
        error_message TEXT,
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ PDF uploads table created');
    
    // Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Audit logs table created');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_vehicle_number ON policies(vehicle_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_insurer ON policies(insurer)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at)');
    console.log('✅ Indexes created');
    
    console.log();
    console.log('🎉 Schema setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - policies');
    console.log('   - pdf_uploads');
    console.log('   - audit_logs');
    console.log();
    console.log('🚀 Next steps:');
    console.log('   1. node create-test-user.js');
    console.log('   2. npm run dev');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixSchema();



