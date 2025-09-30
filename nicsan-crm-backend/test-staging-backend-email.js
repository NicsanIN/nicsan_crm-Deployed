const axios = require('axios');

console.log('🧪 Testing Staging Backend Email...\n');

const STAGING_API_URL = 'https://staging-api.nicsanin.com';

async function testStagingEmail() {
  try {
    console.log('🔗 Testing staging backend connection...');
    
    // Test health endpoint first
    const healthResponse = await axios.get(`${STAGING_API_URL}/health`, {
      timeout: 10000
    });
    console.log('✅ Staging backend is healthy:', healthResponse.data);
    
    // Test login to get auth token
    console.log('\n🔐 Testing login...');
    const loginResponse = await axios.post(`${STAGING_API_URL}/api/auth/login`, {
      email: 'ops@nicsan.in',
      password: 'NicsanOps2024!@#'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Test email endpoint (if it exists)
      console.log('\n📧 Testing email configuration...');
      try {
        const emailTestResponse = await axios.post(`${STAGING_API_URL}/api/test-email`, {
          to: 'dhruv@nicsanin.com',
          subject: 'Staging Email Test',
          message: 'This is a test email from staging backend'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log('✅ Email test endpoint response:', emailTestResponse.data);
      } catch (emailError) {
        if (emailError.response?.status === 404) {
          console.log('ℹ️  No email test endpoint found - this is normal');
        } else {
          console.log('❌ Email test failed:', emailError.response?.data || emailError.message);
        }
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Staging backend test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testStagingEmail();
