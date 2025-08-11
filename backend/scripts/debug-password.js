/**
 * Simple Test for Password Change Issue
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api';

const testUser = {
  name: 'Test User ' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  password: 'TestPassword123!'
};

const runPasswordTest = async () => {
  console.log('🔍 Testing Password Change Issue'.cyan);
  console.log('');

  try {
    // Step 1: Register user
    console.log('📝 Registering user...'.yellow);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (!registerResponse.data.data?.token) {
      console.log('❌ Failed to get token from registration'.red);
      return;
    }

    const token = registerResponse.data.data.token;
    console.log('✅ User registered successfully'.green);
    console.log('');

    // Step 2: Wait a bit to avoid rate limiting
    console.log('⏳ Waiting 3 seconds...'.gray);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Try to change password
    console.log('🔒 Attempting password change...'.yellow);
    
    const passwordChangeData = {
      currentPassword: testUser.password,
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    };

    try {
      const changeResponse = await axios.post(`${BASE_URL}/auth/change-password`, passwordChangeData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Password change successful'.green);
      console.log('Response:', JSON.stringify(changeResponse.data, null, 2));

    } catch (error) {
      console.log('❌ Password change failed'.red);
      console.log('Status:', error.response?.status);
      console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
      
      // Let's also check what user data we have
      console.log('');
      console.log('🔍 Checking user profile...'.blue);
      try {
        const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('User Profile:', JSON.stringify(profileResponse.data, null, 2));
      } catch (profileError) {
        console.log('Failed to get profile:', profileError.response?.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Check server and run test
const checkServer = async () => {
  try {
    await axios.get('http://localhost:5000');
    console.log('✅ Server is running'.green);
    console.log('');
    runPasswordTest();
  } catch (error) {
    console.error('❌ Server is not running'.red);
    process.exit(1);
  }
};

checkServer();
