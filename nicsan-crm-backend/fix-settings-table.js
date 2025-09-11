const { query } = require('./config/database');

async function createSettingsTable() {
  try {
    console.log('🔧 Creating settings table...');
    
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
    
    console.log('✅ Settings table created successfully');
    
    // Insert default settings
    console.log('🔧 Inserting default settings...');
    
    const defaultSettings = [
      { key: 'brokeragePercent', value: '15', description: 'Default brokerage percentage' },
      { key: 'repDailyCost', value: '1800', description: 'Daily cost per sales rep' },
      { key: 'expectedConversion', value: '83', description: 'Expected conversion rate percentage' },
      { key: 'premiumGrowth', value: '12', description: 'Expected premium growth percentage' },
      { key: 'companyName', value: 'Nicsan Insurance', description: 'Company name' },
      { key: 'companyAddress', value: '123 Insurance Street, Mumbai', description: 'Company address' },
      { key: 'companyPhone', value: '+91-9876543210', description: 'Company phone number' },
      { key: 'companyEmail', value: 'info@nicsan.in', description: 'Company email' }
    ];
    
    for (const setting of defaultSettings) {
      await query(`
        INSERT INTO settings (key, value, description) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (key) DO NOTHING
      `, [setting.key, setting.value, setting.description]);
    }
    
    console.log('✅ Default settings inserted successfully');
    console.log('🎉 Settings table setup completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up settings table:', error);
    process.exit(1);
  }
}

createSettingsTable();
