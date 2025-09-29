const { query } = require('./config/database');

async function fixTelecallersTable() {
  try {
    console.log('🔧 Adding missing columns to telecallers table...');
    
    // Add missing columns
    await query(`
      ALTER TABLE telecallers 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS branch VARCHAR(255)
    `);
    
    console.log('✅ Columns added successfully');
    
    // Verify the table structure
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'telecallers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current telecallers table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTelecallersTable();
