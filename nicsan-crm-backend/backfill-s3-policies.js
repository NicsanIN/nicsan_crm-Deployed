#!/usr/bin/env node

/**
 * Backfill Script: Upload Missing Policies to S3
 * 
 * This script finds policies in the database that don't have S3 keys
 * and uploads them to S3 with the proper structure.
 */

const { query } = require('./config/database');
const { generatePolicyS3Key, uploadJSONToS3 } = require('./config/aws');

async function backfillMissingPolicies() {
  console.log('🔄 Starting S3 Policy Backfill Process...\n');

  try {
    // 1. Find policies without S3 keys
    console.log('📋 Finding policies without S3 keys...');
    const missingS3Result = await query(`
      SELECT id, policy_number, source, created_at, *
      FROM policies 
      WHERE s3_key IS NULL OR s3_key = ''
      ORDER BY created_at DESC
    `);

    const missingPolicies = missingS3Result.rows;
    console.log(`Found ${missingPolicies.length} policies without S3 keys\n`);

    if (missingPolicies.length === 0) {
      console.log('✅ All policies already have S3 keys!');
      return;
    }

    // 2. Process each policy
    let successCount = 0;
    let errorCount = 0;

    for (const policy of missingPolicies) {
      try {
        console.log(`📄 Processing policy ${policy.id} (${policy.policy_number})...`);
        
        // Generate S3 key
        const s3Key = generatePolicyS3Key(policy.id, policy.source || 'MANUAL_FORM');
        
        // Prepare policy data for S3 (exclude database-specific fields)
        const policyData = { ...policy };
        delete policyData.id; // Don't include database ID in S3 data
        
        // Upload to S3
        await uploadJSONToS3(policyData, s3Key);
        
        // Update database with S3 key
        await query(
          'UPDATE policies SET s3_key = $1 WHERE id = $2',
          [s3Key, policy.id]
        );
        
        console.log(`✅ Policy ${policy.id} uploaded to S3: ${s3Key}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to process policy ${policy.id}:`, error.message);
        errorCount++;
      }
    }

    // 3. Summary
    console.log('\n📊 Backfill Summary:');
    console.log(`✅ Successfully uploaded: ${successCount} policies`);
    console.log(`❌ Failed uploads: ${errorCount} policies`);
    console.log(`📋 Total processed: ${missingPolicies.length} policies`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some policies failed to upload. Check the errors above.');
    } else {
      console.log('\n🎉 All policies successfully backfilled to S3!');
    }

  } catch (error) {
    console.error('💥 Backfill process failed:', error);
    process.exit(1);
  }
}

// Run the backfill
if (require.main === module) {
  backfillMissingPolicies()
    .then(() => {
      console.log('\n✅ Backfill process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backfill process failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillMissingPolicies };
