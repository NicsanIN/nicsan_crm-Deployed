#!/usr/bin/env node

/**
 * Migration Script: Add s3_key column to policies table
 */

const { query } = require('./config/database');

async function addS3KeyColumn() {
  console.log('🔄 Adding s3_key column to policies table...\n');

  try {
    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' AND column_name = 's3_key'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ s3_key column already exists!');
      return;
    }

    // Add the column
    await query(`
      ALTER TABLE policies 
      ADD COLUMN s3_key VARCHAR(500)
    `);

    console.log('✅ Successfully added s3_key column to policies table');

    // Verify the column was added
    const verifyColumn = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'policies' AND column_name = 's3_key'
    `);

    if (verifyColumn.rows.length > 0) {
      const column = verifyColumn.rows[0];
      console.log(`✅ Column verified: ${column.column_name} (${column.data_type}(${column.character_maximum_length}))`);
    }

  } catch (error) {
    console.error('❌ Failed to add s3_key column:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addS3KeyColumn()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addS3KeyColumn };
