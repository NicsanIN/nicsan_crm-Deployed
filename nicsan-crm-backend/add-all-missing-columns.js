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

async function addAllMissingColumns() {
  try {
    console.log('🔧 Testing database connection...');
    
    // Test connection first
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', testResult.rows[0]);
    
    console.log('🔧 Adding all missing columns to policies table...');
    
    // Add all missing columns
    const alterQueries = [
      // Date columns
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS issue_date DATE',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS expiry_date DATE',
      
      // Numeric columns
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS idv DECIMAL(12,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS ncb DECIMAL(5,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS net_od DECIMAL(12,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS total_od DECIMAL(12,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS net_premium DECIMAL(12,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS cashback_percentage DECIMAL(5,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS cashback_amount DECIMAL(12,2)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS customer_paid DECIMAL(12,2)',
      
      // String columns
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS ref VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS customer_cheque_no VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS our_cheque_no VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS executive VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS caller_name VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS mobile VARCHAR(15)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS rollover VARCHAR(100)',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS remark TEXT',
      'ALTER TABLE policies ADD COLUMN IF NOT EXISTS source VARCHAR(20)',
      
      // Vehicle-related columns (if not already added)
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

    // Update existing records with default values
    console.log('🔧 Updating existing records with default values...');
    await pool.query(`
      UPDATE policies 
      SET 
        issue_date = COALESCE(issue_date, CURRENT_DATE),
        expiry_date = COALESCE(expiry_date, CURRENT_DATE + INTERVAL '1 year'),
        idv = COALESCE(idv, 0),
        ncb = COALESCE(ncb, 0),
        discount = COALESCE(discount, 0),
        net_od = COALESCE(net_od, 0),
        total_od = COALESCE(total_od, 0),
        net_premium = COALESCE(net_premium, 0),
        cashback_percentage = COALESCE(cashback_percentage, 0),
        cashback_amount = COALESCE(cashback_amount, 0),
        customer_paid = COALESCE(customer_paid, 0),
        ref = COALESCE(ref, ''),
        customer_cheque_no = COALESCE(customer_cheque_no, ''),
        our_cheque_no = COALESCE(our_cheque_no, ''),
        executive = COALESCE(executive, 'Unknown'),
        caller_name = COALESCE(caller_name, 'Unknown'),
        mobile = COALESCE(mobile, '0000000000'),
        rollover = COALESCE(rollover, ''),
        remark = COALESCE(remark, ''),
        source = COALESCE(source, 'MANUAL_FORM'),
        product_type = COALESCE(product_type, 'Comprehensive'),
        vehicle_type = COALESCE(vehicle_type, 'Private Car'),
        make = COALESCE(make, 'Unknown'),
        model = COALESCE(model, ''),
        cc = COALESCE(cc, ''),
        manufacturing_year = COALESCE(manufacturing_year, '')
      WHERE issue_date IS NULL 
         OR expiry_date IS NULL
         OR idv IS NULL
         OR ncb IS NULL
         OR discount IS NULL
         OR net_od IS NULL
         OR total_od IS NULL
         OR net_premium IS NULL
         OR cashback_percentage IS NULL
         OR cashback_amount IS NULL
         OR customer_paid IS NULL
         OR executive IS NULL
         OR caller_name IS NULL
         OR mobile IS NULL
         OR source IS NULL
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

addAllMissingColumns();
