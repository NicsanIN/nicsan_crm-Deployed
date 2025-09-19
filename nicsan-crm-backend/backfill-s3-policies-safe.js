#!/usr/bin/env node

/**
 * Safe Backfill Script: Upload Missing Policies to S3
 * 
 * This script safely finds and uploads policies that are missing from S3.
 * Includes dry-run mode and batch processing for safety.
 */

const { query } = require('./config/database');
const { generatePolicyS3Key, uploadJSONToS3 } = require('./config/aws');
const { withPrefix } = require('./utils/s3Prefix');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 10; // Process 10 policies at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillMissingPolicies() {
  console.log('🔄 Starting S3 Policy Backfill Process...');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE RUN'}\n`);

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

    // 2. Show preview of what will be processed
    console.log('📋 Policies to be processed:');
    missingPolicies.slice(0, 5).forEach(policy => {
      console.log(`  - ID: ${policy.id}, Policy: ${policy.policy_number}, Source: ${policy.source || 'MANUAL_FORM'}, Created: ${policy.created_at}`);
    });
    if (missingPolicies.length > 5) {
      console.log(`  ... and ${missingPolicies.length - 5} more`);
    }
    console.log('');

    if (DRY_RUN) {
      console.log('🔍 DRY RUN: No changes will be made. Remove --dry-run to execute.');
      return;
    }

    // 3. Process in batches
    let successCount = 0;
    let errorCount = 0;
    const totalBatches = Math.ceil(missingPolicies.length / BATCH_SIZE);

    for (let i = 0; i < missingPolicies.length; i += BATCH_SIZE) {
      const batch = missingPolicies.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} policies)...`);

      for (const policy of batch) {
        try {
          console.log(`📄 Processing policy ${policy.id} (${policy.policy_number})...`);
          
          // Generate S3 key with proper prefix
          const s3Key = withPrefix(generatePolicyS3Key(policy.id, policy.source || 'MANUAL_FORM'));
          
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

      // Delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < missingPolicies.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // 4. Summary
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

// Show usage information
function showUsage() {
  console.log('Usage:');
  console.log('  node backfill-s3-policies-safe.js           # Live run');
  console.log('  node backfill-s3-policies-safe.js --dry-run # Dry run (preview only)');
  console.log('');
}

// Run the backfill
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }

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
