const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Setting up Database Schema (Fixed)...');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function setupSchema() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    // Create tables in correct order
    console.log('📖 Creating tables...');
    
    // 1. Create users table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ops', 'founder')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');
    
    // 2. Create policies table
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
      );
    `);
    console.log('✅ Policies table created');
    
    // 3. Create pdf_uploads table
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
      );
    `);
    console.log('✅ PDF uploads table created');
    
    // 4. Create audit_logs table
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
      );
    `);
    console.log('✅ Audit logs table created');
    
    // 5. Create indexes
    console.log('📊 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_vehicle_number ON policies(vehicle_number);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_insurer ON policies(insurer);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_policies_created_by ON policies(created_by);');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_pdf_uploads_status ON pdf_uploads(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pdf_uploads_uploaded_by ON pdf_uploads(uploaded_by);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pdf_uploads_created_at ON pdf_uploads(created_at);');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);');
    console.log('✅ Indexes created');
    
    // 6. Create trigger function
    console.log('🔧 Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // 7. Create triggers
    await client.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');
    await client.query('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    
    await client.query('DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;');
    await client.query('CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    
    await client.query('DROP TRIGGER IF EXISTS update_pdf_uploads_updated_at ON pdf_uploads;');
    await client.query('CREATE TRIGGER update_pdf_uploads_updated_at BEFORE UPDATE ON pdf_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('✅ Triggers created');
    
    console.log('✅ Database schema setup completed successfully');
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    console.error('Full error:', error);
  }
}

setupSchema();
