/**
 * Debug Order Creation Issue
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api';

const debugOrder = async () => {
  try {
    console.log('🔧 Debugging Order Creation Issue'.cyan);
    console.log('');

    // Step 1: Register user
    const userData = {
      name: 'Debug Order User',
      email: 'debugorder' + Date.now() + '@example.com',
      password: 'DebugPassword123!'
    };

    console.log('Step 1: Registering user...'.blue);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
    const userToken = registerResponse.data.data.token;
    console.log('✅ User registration successful'.green);

    // Step 2: Register and create a host user
    const hostData = {
      name: 'Debug Host',
      email: 'debugorderhost' + Date.now() + '@example.com',
      password: 'DebugPassword123!'
    };

    console.log('Step 2: Registering host user...'.blue);
    const hostRegisterResponse = await axios.post(`${BASE_URL}/auth/register`, hostData);
    const hostToken = hostRegisterResponse.data.data.token;

    // Make host
    await axios.post(`${BASE_URL}/auth/become-host`, {
      businessName: 'Debug Host Business',
      businessType: 'individual',
      description: 'Debug host for order testing'
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    console.log('✅ Host creation successful'.green);

    // Step 3: Create a listing
    console.log('Step 3: Creating listing...'.blue);
    const listingData = {
      title: 'Debug Order Listing',
      description: 'A test listing for order debugging purposes',
      category: 'electronics',
      basePrice: 50,
      unitType: 'day',
      location: 'Debug City',
      totalQuantity: 5,
      depositType: 'percent',
      depositValue: 20,
      images: ['https://example.com/debug-image.jpg']
    };

    const listingResponse = await axios.post(`${BASE_URL}/listings`, listingData, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const listingId = listingResponse.data.data.listing._id;
    console.log('✅ Listing creation successful'.green);
    console.log('Listing ID:', listingId);

    // Step 4: Create order with exact same data as test
    console.log('Step 4: Creating order...'.blue);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const orderData = {
      lines: [{
        listingId: listingId,
        qty: 1,
        start: tomorrow.toISOString(),
        end: dayAfter.toISOString()
      }],
      paymentOption: 'deposit'
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    try {
      const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ Order creation successful'.green);
      console.log('Response:', orderResponse.data);
    } catch (error) {
      console.log('❌ Order creation failed'.red);
      console.log('Status:', error.response?.status);
      console.log('Error:', JSON.stringify(error.response?.data, null, 2));
      
      // Let's also check if the listing is available
      console.log('');
      console.log('Step 5: Checking listing availability...'.blue);
      try {
        const availabilityResponse = await axios.get(`${BASE_URL}/listings/${listingId}/availability`, {
          params: {
            start: tomorrow.toISOString(),
            end: dayAfter.toISOString(),
            qty: 1
          }
        });
        console.log('✅ Availability check successful'.green);
        console.log('Availability:', availabilityResponse.data);
      } catch (availError) {
        console.log('❌ Availability check failed'.red);
        console.log('Availability Error:', availError.response?.data);
      }
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
    debugOrder();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.'.red);
    process.exit(1);
  }
};

checkAndRun();
