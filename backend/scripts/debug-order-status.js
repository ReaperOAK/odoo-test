/**
 * Debug Order Status Update Issue
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api';

const debugOrderStatus = async () => {
  try {
    console.log('🔧 Debugging Order Status Update Issue'.cyan);
    console.log('');

    // Step 1: Register user
    const userData = {
      name: 'Debug Status User',
      email: 'debugstatus' + Date.now() + '@example.com',
      password: 'DebugPassword123!'
    };

    console.log('Step 1: Registering user...'.blue);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
    const userToken = registerResponse.data.data.token;

    // Step 2: Register and create a host user
    const hostData = {
      name: 'Debug Status Host',
      email: 'debugstatushost' + Date.now() + '@example.com',
      password: 'DebugPassword123!'
    };

    const hostRegisterResponse = await axios.post(`${BASE_URL}/auth/register`, hostData);
    const hostToken = hostRegisterResponse.data.data.token;

    // Make host
    await axios.post(`${BASE_URL}/auth/become-host`, {
      businessName: 'Debug Status Host Business',
      businessType: 'individual',
      description: 'Debug host for status testing'
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    console.log('✅ Host creation successful'.green);

    // Step 3: Create a listing
    const listingData = {
      title: 'Debug Status Listing',
      description: 'A test listing for status debugging purposes',
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

    // Step 4: Create order
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

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const orderId = orderResponse.data.data.order._id;
    console.log('✅ Order creation successful'.green);
    console.log('Order ID:', orderId);
    console.log('Order Status:', orderResponse.data.data.order.orderStatus);

    // Step 5: Try to update order status
    console.log('Step 5: Updating order status...'.blue);
    const statusData = {
      status: 'confirmed',
      notes: 'Order confirmed for testing'
    };

    console.log('Status update data:', JSON.stringify(statusData, null, 2));

    try {
      const statusResponse = await axios.patch(`${BASE_URL}/orders/${orderId}/status`, statusData, {
        headers: { Authorization: `Bearer ${hostToken}` }
      });
      console.log('✅ Status update successful'.green);
      console.log('Response:', statusResponse.data);
    } catch (error) {
      console.log('❌ Status update failed'.red);
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
    debugOrderStatus();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.'.red);
    process.exit(1);
  }
};

checkAndRun();
