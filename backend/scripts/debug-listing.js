/**
 * Debug Listing Creation Issue
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api';

const debugListing = async () => {
  try {
    console.log('🔧 Debugging Listing Creation Issue'.cyan);
    console.log('');

    // Step 1: Register and create a host user
    const hostData = {
      name: 'Debug Host',
      email: 'debughost' + Date.now() + '@example.com',
      password: 'DebugPassword123!'
    };

    console.log('Step 1: Registering host user...'.blue);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, hostData);
    console.log('✅ Registration successful'.green);
    
    const token = registerResponse.data.data.token;

    // Step 2: Become host
    console.log('Step 2: Becoming host...'.blue);
    const becomeHostResponse = await axios.post(`${BASE_URL}/auth/become-host`, {
      businessName: 'Debug Host Business',
      businessType: 'individual',
      description: 'Debug host for listing creation'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Become host successful'.green);

    // Step 3: Create listing with exact same data as test
    console.log('Step 3: Creating listing...'.blue);
    const listingData = {
      title: 'Test Camera Kit',
      description: 'Professional camera for testing purposes',
      category: 'electronics',
      basePrice: 50,
      unitType: 'day',
      location: 'Test City',
      totalQuantity: 2,
      depositType: 'percent',
      depositValue: 20,
      images: ['test-image.jpg']
    };

    console.log('Listing data:', JSON.stringify(listingData, null, 2));

    try {
      const createResponse = await axios.post(`${BASE_URL}/listings`, listingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Listing creation successful'.green);
      console.log('Response:', createResponse.data);
    } catch (error) {
      console.log('❌ Listing creation failed'.red);
      console.log('Status:', error.response?.status);
      console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug failed:'.red, error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
  }
};

// Check server and run debug
const checkAndRun = async () => {
  try {
    await axios.get('http://localhost:5000');
    console.log('ℹ️  Server is running, starting debug...'.cyan);
    debugListing();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.'.red);
    process.exit(1);
  }
};

checkAndRun();
