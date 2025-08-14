const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to policies table...');
    
    // Add missing columns
    const alterQueries = [
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS product_type VARCHAR(50)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS make VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS model VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS cc VARCHAR(20)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS manufacturing_year VARCHAR(4)'
    ];

    for (const query of alterQueries) {
      try {
        await pool.query(query);
        console.log(`✅ Added column: ${query.split(' ')[5]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Column already exists: ${query.split(' ')[5]}`);
        } else {
          console.error(`❌ Error adding column: ${error.message}`);
        }
      }
    }

    // Update existing records with default values
    console.log('🔧 Updating existing records with default values...');
    await pool.query(`
      UPDATE policies 
      SET 
        product_type = COALESCE(product_type, 'Comprehensive'),
        vehicle_type = COALESCE(vehicle_type, 'Private Car'),
        make = COALESCE(make, 'Unknown'),
        model = COALESCE(model, ''),
        cc = COALESCE(cc, ''),
        manufacturing_year = COALESCE(manufacturing_year, '')
      WHERE product_type IS NULL 
         OR vehicle_type IS NULL 
         OR make IS NULL
    `);

    console.log('✅ Database schema updated successfully!');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current policies table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
