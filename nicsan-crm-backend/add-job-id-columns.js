const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nicsan_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function addJobIdColumns() {
  try {
    console.log('🔧 Adding missing columns to pdf_uploads table...');
    
    // Check if columns exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pdf_uploads' 
      AND column_name IN ('job_id', 'progress')
    `);
    
    const existingColumns = checkResult.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);
    
    // Add job_id column if it doesn't exist
    if (!existingColumns.includes('job_id')) {
      console.log('➕ Adding job_id column...');
      await pool.query(`
        ALTER TABLE pdf_uploads 
        ADD COLUMN job_id VARCHAR(255)
      `);
      console.log('✅ job_id column added successfully');
    } else {
      console.log('ℹ️  job_id column already exists');
    }
    
    // Add progress column if it doesn't exist
    if (!existingColumns.includes('progress')) {
      console.log('➕ Adding progress column...');
      await pool.query(`
        ALTER TABLE pdf_uploads 
        ADD COLUMN progress INTEGER DEFAULT 0
      `);
      console.log('✅ progress column added successfully');
    } else {
      console.log('ℹ️  progress column already exists');
    }
    
    // Update status constraint to include 'REVIEW'
    console.log('🔧 Updating status constraint...');
    try {
      await pool.query(`
        ALTER TABLE pdf_uploads 
        DROP CONSTRAINT IF EXISTS pdf_uploads_status_check
      `);
      
      await pool.query(`
        ALTER TABLE pdf_uploads 
        ADD CONSTRAINT pdf_uploads_status_check 
        CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW'))
      `);
      console.log('✅ Status constraint updated successfully');
    } catch (error) {
      console.log('⚠️  Could not update status constraint:', error.message);
    }
    
    // Verify final structure
    const finalResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pdf_uploads'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final pdf_uploads table structure:');
    finalResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });
    
    console.log('\n🎉 Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

addJobIdColumns();
