const { Pool } = require('pg');
require('dotenv').config();

// Use the same connection method as your working backend
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'nicsan_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function fixPdfUploadsTable() {
  try {
    console.log('🔧 Testing database connection...');
    
    // Test connection first
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', testResult.rows[0]);
    
    console.log('🔧 Checking if pdf_uploads table exists...');
    
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pdf_uploads'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('🔧 Creating pdf_uploads table...');
      
      // Create the table with all required columns
      await pool.query(`
        CREATE TABLE pdf_uploads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          s3_key VARCHAR(500) NOT NULL,
          s3_url VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW')),
          confidence_score DECIMAL(3,2),
          extracted_data JSONB,
          error_message TEXT,
          uploaded_by UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ pdf_uploads table created successfully!');
    } else {
      console.log('🔧 pdf_uploads table exists, checking for missing columns...');
      
      // Add missing columns if they don't exist
      const alterQueries = [
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS s3_url VARCHAR(500)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS file_size BIGINT',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS status VARCHAR(20)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS extracted_data JSONB',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS error_message TEXT',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id)',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      ];

      for (const query of alterQueries) {
        try {
          await pool.query(query);
          const columnName = query.split(' ')[5];
          console.log(`✅ Added column: ${columnName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            const columnName = query.split(' ')[5];
            console.log(`ℹ️  Column already exists: ${columnName}`);
          } else {
            console.error(`❌ Error adding column: ${error.message}`);
          }
        }
      }
      
      // Update status column constraint if needed
      try {
        await pool.query(`
          ALTER TABLE pdf_uploads DROP CONSTRAINT IF EXISTS pdf_uploads_status_check;
        `);
        await pool.query(`
          ALTER TABLE pdf_uploads ADD CONSTRAINT pdf_uploads_status_check 
          CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW'));
        `);
        console.log('✅ Status column constraint updated');
      } catch (error) {
        console.log(`ℹ️  Status constraint already correct: ${error.message}`);
      }
    }
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pdf_uploads' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current pdf_uploads table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n✅ pdf_uploads table structure fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing pdf_uploads table:', error);
  } finally {
    await pool.end();
  }
}

fixPdfUploadsTable();
