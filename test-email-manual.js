import axios from 'axios';

console.log('🧪 Manual Email Test for Staging...\n');

const STAGING_API_URL = 'https://staging-api.nicsanin.com';

async function testEmailManually() {
  try {
    console.log('🔗 Testing staging backend connection...');
    
    // Test health endpoint first
    const healthResponse = await axios.get(`${STAGING_API_URL}/health`, {
      timeout: 10000
    });
    console.log('✅ Staging backend is healthy:', healthResponse.data);
    
    console.log('\n📧 Manual Email Test Instructions:');
    console.log('1. Go to your staging frontend');
    console.log('2. Login with your credentials');
    console.log('3. Upload a PDF (if you haven\'t already)');
    console.log('4. Go to Review/Confirm page');
    console.log('5. Fill in ALL required fields:');
    console.log('   - Customer Name: Test Customer');
    console.log('   - Customer Email: dhruv@nicsanin.com');
    console.log('   - Executive: Select any option');
    console.log('   - Ops Executive: Select any option');
    console.log('   - All other required fields');
    console.log('6. Click "Confirm Policy"');
    console.log('7. Check your email (including spam folder)');
    
    console.log('\n🔍 If no email is received, check:');
    console.log('- CloudWatch logs for any email-related activity');
    console.log('- Verify customer_email field is being set correctly');
    console.log('- Check if SMTP credentials are working');
    console.log('- Try a different email address');
    
    console.log('\n💡 Common issues:');
    console.log('- Customer Email field is empty');
    console.log('- Email goes to spam folder');
    console.log('- SMTP server blocks the connection');
    console.log('- Email service not triggered during confirmation');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEmailManually();
