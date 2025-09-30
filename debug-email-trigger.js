import axios from 'axios';

console.log('🔍 Debugging Email Trigger in Staging...\n');

const STAGING_API_URL = 'https://staging-api.nicsanin.com';

async function debugEmailTrigger() {
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
      
      // Check if there are any uploads to work with
      console.log('\n📋 Checking for available uploads...');
      const uploadsResponse = await axios.get(`${STAGING_API_URL}/api/upload`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('📋 Available uploads:', uploadsResponse.data.length);
      
      if (uploadsResponse.data.length > 0) {
        const upload = uploadsResponse.data[0];
        console.log('📄 First upload details:');
        console.log('- ID:', upload.id);
        console.log('- Status:', upload.status);
        console.log('- Customer Email:', upload.customer_email);
        console.log('- Has S3 Key:', !!upload.s3_key);
        
        // Check if this upload can be confirmed
        if (upload.status === 'PROCESSED' && upload.s3_key) {
          console.log('\n✅ This upload can be confirmed and should trigger email');
          console.log('💡 Try confirming this upload in the staging frontend');
          console.log('📧 Make sure to set a valid customer_email in the form');
        } else {
          console.log('\n❌ This upload cannot be confirmed yet');
          console.log('- Status should be PROCESSED');
          console.log('- Must have S3 key');
        }
      } else {
        console.log('\n❌ No uploads available to test with');
        console.log('💡 You need to upload a PDF first, then try confirming it');
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

debugEmailTrigger();
