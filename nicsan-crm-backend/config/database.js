const { Pool } = require('pg');

// PostgreSQL Configuration (Secondary Storage)
const pool = new Pool({
  // Use DATABASE_URL if available, otherwise fall back to individual variables
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE || 'nicsan_crm',
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password',
  ssl: process.env.DB_SSL === 'true' || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'ops',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create policies table
    await query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(255) UNIQUE NOT NULL,
        vehicle_number VARCHAR(255) NOT NULL,
        insurer VARCHAR(255) NOT NULL,
        product_type VARCHAR(255) DEFAULT 'Private Car',
        vehicle_type VARCHAR(255) DEFAULT 'Private Car',
        make VARCHAR(255),
        model VARCHAR(255),
        cc VARCHAR(50),
        manufacturing_year VARCHAR(10),
        issue_date DATE,
        expiry_date DATE,
        idv DECIMAL(15,2) DEFAULT 0,
        ncb DECIMAL(15,2) DEFAULT 0,
        discount DECIMAL(15,2) DEFAULT 0,
        net_od DECIMAL(15,2) DEFAULT 0,
        ref VARCHAR(255),
        total_od DECIMAL(15,2) DEFAULT 0,
        net_premium DECIMAL(15,2) DEFAULT 0,
        total_premium DECIMAL(15,2) NOT NULL,
        cashback_percentage DECIMAL(15,2) DEFAULT 0,
        cashback_amount DECIMAL(15,2) DEFAULT 0,
        customer_paid DECIMAL(15,2) DEFAULT 0,
        customer_cheque_no VARCHAR(255),
        our_cheque_no VARCHAR(255),
        executive VARCHAR(255),
        caller_name VARCHAR(255),
        mobile VARCHAR(20),
        rollover VARCHAR(255),
        customer_name VARCHAR(255),
        branch VARCHAR(255),
        remark TEXT,
        brokerage DECIMAL(15,2) DEFAULT 0,
        cashback DECIMAL(15,2) DEFAULT 0,
        source VARCHAR(50) DEFAULT 'MANUAL_FORM',
        s3_key VARCHAR(500),
        confidence_score DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pdf_uploads table
    await query(`
      CREATE TABLE IF NOT EXISTS pdf_uploads (
        id SERIAL PRIMARY KEY,
        upload_id VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        insurer VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'UPLOADED',
        extracted_data JSONB,
        manual_extras JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add branch column if it doesn't exist (migration)
    await query(`
      ALTER TABLE policies 
      ADD COLUMN IF NOT EXISTS branch VARCHAR(255)
    `);

    // Insert default settings
    await query(`
      INSERT INTO settings (key, value, description) VALUES
      ('brokeragePercent', '15', 'Percentage of GWP that we earn as brokerage'),
      ('repDailyCost', '2000', 'Daily cost per sales representative'),
      ('expectedConversion', '25', 'Expected conversion rate for lead valuation'),
      ('premiumGrowth', '10', 'Expected premium growth rate for LTV calculations')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase
};

