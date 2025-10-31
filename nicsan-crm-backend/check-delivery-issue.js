/**
 * Diagnose WhatsApp Message Delivery Issue
 */

require('dotenv').config();
const axios = require('axios');

const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com'
};

async function checkDeliveryIssue() {
  console.log('🔍 Diagnosing WhatsApp Message Delivery Issue');
  console.log('='.repeat(80));
  
  try {
    // Check 1: Verify template exists and get its details
    console.log('\n📋 CHECK 1: Verifying Template Details...');
    try {
      const templateUrl = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.businessAccountId}/message_templates`;
      const templateResponse = await axios.get(templateUrl, {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`
        },
        params: {
          name: 'policy'
        }
      });
      
      if (templateResponse.data.data && templateResponse.data.data.length > 0) {
        const template = templateResponse.data.data[0];
        console.log('✅ Template "policy" found:');
        console.log('   Status:', template.status);
        console.log('   Category:', template.category);
        console.log('   Language:', template.language);
        console.log('   Quality:', template.quality?.score || 'N/A');
        
        if (template.category === 'MARKETING') {
          console.log('\n⚠️  ⚠️  ⚠️  CRITICAL ISSUE FOUND ⚠️  ⚠️  ⚠️');
          console.log('   Your template is categorized as MARKETING!');
          console.log('   MARKETING templates require recipients to OPT-IN');
          console.log('   Recipients who haven\'t opted in will NOT receive messages');
          console.log('   This is why the message was sent but not delivered!');
          console.log('\n   💡 SOLUTION: Change template category to UTILITY');
          console.log('   1. Go to WhatsApp Business Manager');
          console.log('   2. Navigate to Message Templates');
          console.log('   3. Find template "policy"');
          console.log('   4. Edit and change category from MARKETING to UTILITY');
          console.log('   5. Resubmit for approval (takes 1-3 business days)');
        } else if (template.category === 'UTILITY') {
          console.log('\n✅ Template category is UTILITY (correct for policy notifications)');
        }
      } else {
        console.log('⚠️  Template "policy" not found in your account');
      }
    } catch (templateError) {
      console.log('⚠️  Could not fetch template details:', templateError.response?.data?.error?.message || templateError.message);
      console.log('   This might indicate a permissions issue');
    }
    
    // Check 2: Verify phone number
    console.log('\n📱 CHECK 2: Phone Number Verification');
    console.log('   Phone Number: +919964226524');
    console.log('   ⚠️  Verify manually:');
    console.log('   1. Number is registered on WhatsApp');
    console.log('   2. Number has WhatsApp installed and active');
    console.log('   3. Number has not blocked your business number');
    console.log('   4. Number can receive messages from businesses');
    
    // Check 3: Check if message was actually accepted
    console.log('\n📊 CHECK 3: Message Status');
    console.log('   Template Message ID: wamid.HBgMOTE5OTY0MjI2NTI0FQIAERgSOTk3RDExM0YxMDg5OUNENDFDAA==');
    console.log('   Document Message ID: wamid.HBgMOTE5OTY0MjI2NTI0FQIAERgSRUE2QjMzQUZCNTc2Njg3QUI4AA==');
    console.log('   ⚠️  Note: WhatsApp Cloud API doesn\'t provide direct message status API');
    console.log('   Status updates are delivered via webhooks (if configured)');
    console.log('   Check WhatsApp Business Manager → Analytics for delivery reports');
    
    // Check 4: Common issues
    console.log('\n🔍 CHECK 4: Common Delivery Issues');
    console.log('\n   1. TEMPLATE CATEGORY (Most Likely):');
    console.log('      ❌ MARKETING category requires opt-in');
    console.log('      ✅ UTILITY category doesn\'t require opt-in');
    console.log('      → Check above template details');
    
    console.log('\n   2. PHONE NUMBER ISSUES:');
    console.log('      - Number not registered on WhatsApp');
    console.log('      - Number blocked your business');
    console.log('      - Privacy settings blocking business messages');
    
    console.log('\n   3. MESSAGING WINDOW:');
    console.log('      - Template messages bypass 24-hour window ✅');
    console.log('      - But MARKETING category may still block delivery ❌');
    
    console.log('\n   4. WHATSAPP SERVER DELAYS:');
    console.log('      - Messages may be delayed on WhatsApp servers');
    console.log('      - Check again after some time');
    console.log('      - Look in archived/spam messages');
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    console.log('\n🎯 MOST LIKELY CAUSE:');
    console.log('   Template category is MARKETING, which requires recipient opt-in');
    console.log('   Recipients who haven\'t opted in will not receive messages');
    console.log('\n✅ IMMEDIATE ACTION:');
    console.log('   1. Check template category above');
    console.log('   2. If MARKETING → Change to UTILITY in WhatsApp Business Manager');
    console.log('   3. Wait for template approval');
    console.log('   4. Resend message after approval');
    console.log('\n✅ ALTERNATIVE ACTIONS:');
    console.log('   1. Ask recipient to check archived/spam messages');
    console.log('   2. Verify phone number is correct and has WhatsApp');
    console.log('   3. Check WhatsApp Business Manager → Analytics for delivery status');
    console.log('   4. Try sending from WhatsApp Business Manager directly (to test)');
    
  } catch (error) {
    console.error('\n❌ Diagnostic Error:', error.message);
    console.error(error.stack);
  }
}

checkDeliveryIssue().then(() => process.exit(0));

