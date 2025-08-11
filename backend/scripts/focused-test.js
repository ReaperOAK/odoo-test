/**
 * Quick Test Script - Runs tests with delays to avoid rate limiting
 */

const axios = require('axios');
const colors = require('colors');

// Base URL for the API
const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test' + Date.now() + '@example.com',
  password: 'TestPassword123!'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// Store tokens for authenticated requests
let userToken = null;
let testListingId = null;

// Helper function with delay between requests
const makeRequest = async (method, endpoint, data = null, token = null, expectStatus = [200, 201], delayMs = 2000) => {
  totalTests++;
  
  // Add delay to avoid rate limiting
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios(config);
    const statusOk = Array.isArray(expectStatus) ? expectStatus.includes(response.status) : response.status === expectStatus;
    
    if (statusOk) {
      console.log(`✅ ${method} ${endpoint} - PASSED`.green + ` Status: ${response.status}`);
      passedTests++;
      return response;
    } else {
      console.log(`❌ ${method} ${endpoint} - FAILED`.red + ` Status: ${response.status} (Expected: ${expectStatus})`);
      failedTests.push(`${method} ${endpoint} - Status: ${response.status}`);
      return response;
    }
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const statusOk = Array.isArray(expectStatus) ? expectStatus.includes(status) : status === expectStatus;
    
    if (statusOk) {
      console.log(`✅ ${method} ${endpoint} - PASSED`.green + ` Status: ${status}`);
      passedTests++;
      return error.response;
    } else {
      console.log(`❌ ${method} ${endpoint} - FAILED`.red + ` Status: ${status} (Expected: ${expectStatus})`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`.yellow);
      }
      failedTests.push(`${method} ${endpoint} - Status: ${status}`);
      return error.response;
    }
  }
};

const runFocusedTests = async () => {
  console.log('🚀 Starting Focused API Tests (with delays)'.cyan);
  console.log('ℹ️  Testing specific failing endpoints'.yellow);
  console.log('');

  try {
    // Test 1: Register a user
    console.log('🔹 Testing User Registration'.blue);
    const registerResponse = await makeRequest('POST', '/auth/register', testUser, null, [200, 201], 0);
    if (registerResponse?.data?.data?.token) {
      userToken = registerResponse.data.data.token;
      console.log('ℹ️  User token obtained successfully'.green);
      console.log(`ℹ️  Token: ${userToken.substring(0, 20)}...`.gray);
    } else {
      console.log('❌ No token received from registration'.red);
      if (registerResponse?.data) {
        console.log('Response:', JSON.stringify(registerResponse.data, null, 2).gray);
      }
    }
    console.log('');

    // Test 2: Change Password (this was failing with 500)
    if (userToken) {
      console.log('🔹 Testing Password Change'.blue);
      await makeRequest('POST', '/auth/change-password', {
        currentPassword: testUser.password,
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }, userToken, [200, 201], 3000);
      console.log('');
    } else {
      console.log('⚠️  Skipping password change test (no user token)'.yellow);
    }

    // Test 3: Create a listing as host (this was failing with 400)
    if (userToken) {
      console.log('🔹 Testing Become Host'.blue);
      const hostData = {
        businessName: 'Test Host Business',
        businessType: 'individual',
        description: 'A test host business for API testing purposes',
        website: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      };
      const hostResponse = await makeRequest('POST', '/auth/become-host', hostData, userToken, [200, 201], 3000);
      console.log('');

      console.log('🔹 Testing Listing Creation'.blue);
      const listingData = {
        title: 'Test Electronics Listing',
        description: 'A comprehensive test listing for API testing purposes with detailed information',
        category: 'electronics',
        unitType: 'day',
        basePrice: 100,
        depositType: 'percent',
        depositValue: 20,
        totalQuantity: 1,
        location: '123 Test St, Test City, Test State',
        features: ['wifi', 'parking', 'power-supply'],
        rules: ['no-smoking', 'return-clean']
      };

      const createListingResponse = await makeRequest('POST', '/listings', listingData, userToken, [200, 201], 3000);
      if (createListingResponse?.data?.listing?._id) {
        testListingId = createListingResponse.data.listing._id;
        console.log('ℹ️  Listing created successfully'.green);
      }
      console.log('');
    } else {
      console.log('⚠️  Skipping host tests (no user token)'.yellow);
    }

    // Test 4: Host Dashboard Access (non-host user should get 403)
    console.log('🔹 Testing Host Dashboard Access Control'.blue);
    
    // Create a regular user (non-host)
    const regularUser = {
      name: 'Regular User',
      email: 'regular' + Date.now() + '@example.com',
      password: 'RegularPassword123!'
    };

    const regularUserResponse = await makeRequest('POST', '/auth/register', regularUser, null, [200, 201], 3000);
    let regularUserToken = null;
    if (regularUserResponse?.data?.data?.token) {
      regularUserToken = regularUserResponse.data.data.token;
    }

    if (regularUserToken) {
      // This should fail with 403 (Forbidden) since user is not a host
      await makeRequest('GET', '/host/dashboard', null, regularUserToken, [403], 3000);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test execution failed:'.red, error.message);
  }

  // Print Results
  console.log('🔹 Test Results Summary'.blue);
  console.log('');
  console.log('📊 Test Results:'.cyan);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`.green);
  console.log(`   Failed: ${failedTests.length}`.red);
  console.log(`   Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log('');

  if (failedTests.length > 0) {
    console.log('❌ Failed Tests:'.red);
    failedTests.forEach(test => {
      console.log(`   • ${test}`.red);
    });
    console.log('');
  }

  console.log(`🎯 Test completed at ${new Date().toISOString()}`.cyan);
  
  process.exit(failedTests.length > 0 ? 1 : 0);
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get('http://localhost:5000');
    console.log('ℹ️  Server is running, starting focused tests...'.cyan);
    runFocusedTests();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.'.red);
    console.log('   Run: npm start'.yellow);
    process.exit(1);
  }
};

checkServer();
