#!/usr/bin/env node

/**
 * Fix database permissions for Nicsan CRM
 * This script grants the necessary permissions to fix the telecallers_id_seq error
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing database permissions...');
    
    // Grant permissions on telecallers_id_seq sequence
    await client.query('GRANT USAGE, SELECT ON SEQUENCE telecallers_id_seq TO PUBLIC');
    console.log('✅ Granted permissions on telecallers_id_seq sequence');
    
    // Grant permissions on telecallers table
    await client.query('GRANT ALL PRIVILEGES ON TABLE telecallers TO PUBLIC');
    console.log('✅ Granted permissions on telecallers table');
    
    // Grant permissions on all sequences
    const sequences = await client.query(`
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `);
    
    for (const seq of sequences.rows) {
      try {
        await client.query(`GRANT USAGE, SELECT ON SEQUENCE ${seq.sequencename} TO PUBLIC`);
        console.log(`✅ Granted permissions on sequence: ${seq.sequencename}`);
      } catch (error) {
        console.warn(`⚠️ Could not grant permissions on sequence ${seq.sequencename}:`, error.message);
      }
    }
    
    // Grant permissions on all tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    for (const table of tables.rows) {
      try {
        await client.query(`GRANT ALL PRIVILEGES ON TABLE ${table.tablename} TO PUBLIC`);
        console.log(`✅ Granted permissions on table: ${table.tablename}`);
      } catch (error) {
        console.warn(`⚠️ Could not grant permissions on table ${table.tablename}:`, error.message);
      }
    }
    
    console.log('🎉 Database permissions fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixPermissions()
    .then(() => {
      console.log('✅ Permission fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Permission fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPermissions };

