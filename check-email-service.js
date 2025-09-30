import axios from 'axios';

console.log('🔍 Checking Email Service Configuration...\n');

const STAGING_API_URL = 'https://staging-api.nicsanin.com';

async function checkEmailService() {
  try {
    console.log('🔗 Testing staging backend connection...');
    
    // Test health endpoint first
    const healthResponse = await axios.get(`${STAGING_API_URL}/health`, {
      timeout: 10000
    });
    console.log('✅ Staging backend is healthy:', healthResponse.data);
    
    // Test if there's a debug endpoint that shows environment variables
    console.log('\n🔧 Checking environment configuration...');
    try {
      const debugResponse = await axios.get(`${STAGING_API_URL}/api/debug`, {
        timeout: 10000
      });
      console.log('✅ Debug endpoint response:', debugResponse.data);
    } catch (debugError) {
      if (debugError.response?.status === 404) {
        console.log('ℹ️  No debug endpoint found - this is normal');
      } else {
        console.log('❌ Debug endpoint error:', debugError.response?.data || debugError.message);
      }
    }
    
    // Test if we can access the email service directly
    console.log('\n📧 Testing email service availability...');
    try {
      const emailResponse = await axios.get(`${STAGING_API_URL}/api/email/health`, {
        timeout: 10000
      });
      console.log('✅ Email service health:', emailResponse.data);
    } catch (emailError) {
      if (emailError.response?.status === 404) {
        console.log('ℹ️  No email health endpoint found - this is normal');
      } else {
        console.log('❌ Email service error:', emailError.response?.data || emailError.message);
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. Go to staging frontend and confirm a policy');
    console.log('2. Check CloudWatch logs for any email-related activity');
    console.log('3. Verify the customer_email field is being set correctly');
    console.log('4. Check spam folder for emails');
    
  } catch (error) {
    console.error('❌ Check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

checkEmailService();
