#!/usr/bin/env node

/**
 * Check Policy Statistics Script
 * This will help us understand the current state of policies in the database
 */

const { query } = require('./config/database');

async function checkPolicyStats() {
  console.log('📊 Checking Policy Statistics...\n');

  try {
    // 1. Total policies count
    const totalResult = await query('SELECT COUNT(*) as total FROM policies');
    console.log(`📋 Total policies in database: ${totalResult.rows[0].total}`);

    // 2. Policies with S3 keys
    const withS3Result = await query('SELECT COUNT(*) as count FROM policies WHERE s3_key IS NOT NULL AND s3_key != \'\'');
    console.log(`✅ Policies with S3 keys: ${withS3Result.rows[0].count}`);

    // 3. Policies without S3 keys
    const withoutS3Result = await query('SELECT COUNT(*) as count FROM policies WHERE s3_key IS NULL OR s3_key = \'\'');
    console.log(`❌ Policies without S3 keys: ${withoutS3Result.rows[0].count}`);

    // 4. Policies by source
    const sourceResult = await query(`
      SELECT source, COUNT(*) as count 
      FROM policies 
      GROUP BY source 
      ORDER BY count DESC
    `);
    console.log('\n📊 Policies by source:');
    sourceResult.rows.forEach(row => {
      console.log(`  ${row.source || 'NULL'}: ${row.count}`);
    });

    // 5. Recent policies (last 10)
    const recentResult = await query(`
      SELECT id, policy_number, source, s3_key, created_at 
      FROM policies 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('\n📅 Recent policies (last 10):');
    recentResult.rows.forEach(row => {
      const hasS3 = row.s3_key ? '✅' : '❌';
      console.log(`  ${hasS3} ${row.policy_number} (${row.source || 'NULL'}) - ${row.created_at}`);
    });

    // 6. Check for policies with empty string s3_key
    const emptyStringResult = await query('SELECT COUNT(*) as count FROM policies WHERE s3_key = \'\'');
    console.log(`\n🔍 Policies with empty string s3_key: ${emptyStringResult.rows[0].count}`);

    // 7. Check for policies with NULL s3_key
    const nullResult = await query('SELECT COUNT(*) as count FROM policies WHERE s3_key IS NULL');
    console.log(`🔍 Policies with NULL s3_key: ${nullResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error checking policy stats:', error);
    throw error;
  }
}

// Run the check
if (require.main === module) {
  checkPolicyStats()
    .then(() => {
      console.log('\n✅ Policy statistics check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Policy statistics check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPolicyStats };
