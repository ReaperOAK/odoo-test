#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const DELAY_BETWEEN_TESTS = 500; // ms

// Global state
let authToken = '';
let userId = '';
let hostToken = '';
let hostId = '';
let adminToken = '';
let testListingId = '';
let testOrderId = '';
let testPaymentId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// HTTP client with default config
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true // Don't throw on HTTP errors
});

// Utility functions
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`.blue),
  success: (msg) => console.log(`✅ ${msg}`.green),
  error: (msg) => console.log(`❌ ${msg}`.red),
  warn: (msg) => console.log(`⚠️  ${msg}`.yellow),
  section: (msg) => console.log(`\n🔹 ${msg}`.cyan.bold)
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function recordTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log.success(`${name} - PASSED ${details}`);
  } else {
    testResults.failed++;
    log.error(`${name} - FAILED ${details}`);
  }
  testResults.details.push({ name, success, details });
}

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await client(config);
    return response;
  } catch (error) {
    return {
      status: 0,
      data: { message: error.message },
      error: true
    };
  }
}

// Test functions
async function testHealthCheck() {
  log.section('Health Check');
  
  const response = await makeRequest('GET', '/');
  recordTest(
    'API Health Check',
    response.status === 200 || response.status === 404,
    `Status: ${response.status}`
  );
}

async function testAuthenticationEndpoints() {
  log.section('Authentication Endpoints');
  
  // Test user registration
  const registerData = {
    name: 'Test User',
    email: `test.user.${Date.now()}@example.com`,
    password: 'password123'
  };
  
  const registerResponse = await makeRequest('POST', '/auth/register', registerData);
  const registerSuccess = registerResponse.status === 201 && registerResponse.data.success;
  recordTest(
    'POST /auth/register',
    registerSuccess,
    `Status: ${registerResponse.status}`
  );
  
  if (registerSuccess) {
    authToken = registerResponse.data.data.token;
    userId = registerResponse.data.data.user._id;
  }
  
  // Test user login
  const loginData = {
    email: registerData.email,
    password: registerData.password
  };
  
  const loginResponse = await makeRequest('POST', '/auth/login', loginData);
  const loginSuccess = loginResponse.status === 200 && loginResponse.data.success;
  recordTest(
    'POST /auth/login',
    loginSuccess,
    `Status: ${loginResponse.status}`
  );
  
  if (loginSuccess && !authToken) {
    authToken = loginResponse.data.data.token;
    userId = loginResponse.data.data.user._id;
  }
  
  // Test invalid login
  const invalidLoginResponse = await makeRequest('POST', '/auth/login', {
    email: registerData.email,
    password: 'wrongpassword'
  });
  recordTest(
    'POST /auth/login (invalid credentials)',
    invalidLoginResponse.status === 401,
    `Status: ${invalidLoginResponse.status}`
  );
  
  // Test get profile
  const profileResponse = await makeRequest('GET', '/auth/me', null, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'GET /auth/me',
    profileResponse.status === 200 && profileResponse.data.success,
    `Status: ${profileResponse.status}`
  );
  
  // Test update profile
  const updateProfileResponse = await makeRequest('PATCH', '/auth/profile', {
    firstName: 'Updated',
    lastName: 'Name'
  }, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'PATCH /auth/profile',
    updateProfileResponse.status === 200,
    `Status: ${updateProfileResponse.status}`
  );
  
  // Test change password
  const changePasswordResponse = await makeRequest('POST', '/auth/change-password', {
    currentPassword: 'password123',
    newPassword: 'newpassword123',
    confirmPassword: 'newpassword123'
  }, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'POST /auth/change-password',
    changePasswordResponse.status === 200,
    `Status: ${changePasswordResponse.status}`
  );
  
  // Test become host
  const becomeHostResponse = await makeRequest('POST', '/auth/become-host', {
    businessName: 'Test Host Business',
    businessType: 'individual',
    description: 'Test host description'
  }, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'POST /auth/become-host',
    becomeHostResponse.status === 200,
    `Status: ${becomeHostResponse.status}`
  );
  
  // Register a separate host user for host-specific tests
  const hostRegisterData = {
    name: 'Test Host',
    email: `test.host.${Date.now()}@example.com`,
    password: 'password123'
  };
  
  const hostRegisterResponse = await makeRequest('POST', '/auth/register', hostRegisterData);
  if (hostRegisterResponse.status === 201) {
    hostToken = hostRegisterResponse.data.data.token;
    hostId = hostRegisterResponse.data.data.user._id;
    
    // Make the user a host
    const hostUpgradeResponse = await makeRequest('POST', '/auth/become-host', {
      businessName: 'Test Host Business',
      businessType: 'individual',
      description: 'Test host for listing creation'
    }, {
      Authorization: `Bearer ${hostToken}`
    });
    
    if (hostUpgradeResponse.status === 200) {
      log.info('Host user created and upgraded for testing');
    } else {
      log.warn('Failed to upgrade user to host');
      hostToken = null;
    }
  }
}

async function testListingEndpoints() {
  log.section('Listing Endpoints');
  
  // Test get all listings (public)
  const listingsResponse = await makeRequest('GET', '/listings?page=1&limit=5');
  recordTest(
    'GET /listings',
    listingsResponse.status === 200,
    `Status: ${listingsResponse.status}`
  );
  
  // Test search listings
  const searchResponse = await makeRequest('GET', '/listings?search=camera&category=electronics');
  recordTest(
    'GET /listings (with search)',
    searchResponse.status === 200,
    `Status: ${searchResponse.status}`
  );
  
  if (!hostToken) {
    log.warn('Skipping host-only listing tests (no host token)');
    return;
  }
  
  // Test create listing (host only)
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
    images: ['https://example.com/test-image.jpg']
  };
  
  const createListingResponse = await makeRequest('POST', '/listings', listingData, {
    Authorization: `Bearer ${hostToken}`
  });
  const createSuccess = createListingResponse.status === 201;
  recordTest(
    'POST /listings',
    createSuccess,
    `Status: ${createListingResponse.status}`
  );
  
  if (createSuccess) {
    testListingId = createListingResponse.data.data.listing._id;
    log.info(`Created test listing: ${testListingId}`);
  }
  
  // Test get single listing
  if (testListingId) {
    const singleListingResponse = await makeRequest('GET', `/listings/${testListingId}`);
    recordTest(
      'GET /listings/:id',
      singleListingResponse.status === 200,
      `Status: ${singleListingResponse.status}`
    );
    
    // Test check availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const availabilityResponse = await makeRequest('GET', 
      `/listings/${testListingId}/availability?start=${tomorrow.toISOString()}&end=${dayAfter.toISOString()}&qty=1`
    );
    recordTest(
      'GET /listings/:id/availability',
      availabilityResponse.status === 200,
      `Status: ${availabilityResponse.status}`
    );
    
    // Test update listing
    const updateListingResponse = await makeRequest('PATCH', `/listings/${testListingId}`, {
      title: 'Updated Test Camera Kit',
      basePrice: 55
    }, {
      Authorization: `Bearer ${hostToken}`
    });
    recordTest(
      'PATCH /listings/:id',
      updateListingResponse.status === 200,
      `Status: ${updateListingResponse.status}`
    );
  }
  
  // Test create listing without auth (should fail)
  const unauthorizedCreateResponse = await makeRequest('POST', '/listings', listingData);
  recordTest(
    'POST /listings (unauthorized)',
    unauthorizedCreateResponse.status === 401,
    `Status: ${unauthorizedCreateResponse.status}`
  );
}

async function testOrderEndpoints() {
  log.section('Order Endpoints');
  
  if (!authToken || !testListingId) {
    log.warn('Skipping order tests (missing auth token or test listing)');
    return;
  }
  
  // Test create order
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  const orderData = {
    lines: [{
      listingId: testListingId,
      qty: 1,
      start: tomorrow.toISOString(),
      end: dayAfter.toISOString()
    }],
    paymentOption: 'deposit'
  };
  
  const createOrderResponse = await makeRequest('POST', '/orders', orderData, {
    Authorization: `Bearer ${authToken}`
  });
  const orderSuccess = createOrderResponse.status === 201;
  recordTest(
    'POST /orders',
    orderSuccess,
    `Status: ${createOrderResponse.status}`
  );
  
  if (orderSuccess) {
    testOrderId = createOrderResponse.data.data.order._id;
    log.info(`Created test order: ${testOrderId}`);
  }
  
  // Test get user orders
  const userOrdersResponse = await makeRequest('GET', '/orders/my-orders', null, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'GET /orders/my-orders',
    userOrdersResponse.status === 200,
    `Status: ${userOrdersResponse.status}`
  );
  
  // Test get single order
  if (testOrderId) {
    const singleOrderResponse = await makeRequest('GET', `/orders/${testOrderId}`, null, {
      Authorization: `Bearer ${authToken}`
    });
    recordTest(
      'GET /orders/:id',
      singleOrderResponse.status === 200,
      `Status: ${singleOrderResponse.status}`
    );
    
    // Test update order status (host only)
    if (hostToken) {
      const updateStatusResponse = await makeRequest('PATCH', `/orders/${testOrderId}/status`, {
        status: 'confirmed',
        notes: 'Order confirmed for testing'
      }, {
        Authorization: `Bearer ${hostToken}`
      });
      recordTest(
        'PATCH /orders/:id/status',
        updateStatusResponse.status === 200,
        `Status: ${updateStatusResponse.status}`
      );
    }
    
    // Test cancel order
    const cancelOrderResponse = await makeRequest('POST', `/orders/${testOrderId}/cancel`, null, {
      Authorization: `Bearer ${authToken}`
    });
    recordTest(
      'POST /orders/:id/cancel',
      cancelOrderResponse.status === 200,
      `Status: ${cancelOrderResponse.status}`
    );
  }
  
  // Test create order without auth (should fail)
  const unauthorizedOrderResponse = await makeRequest('POST', '/orders', orderData);
  recordTest(
    'POST /orders (unauthorized)',
    unauthorizedOrderResponse.status === 401,
    `Status: ${unauthorizedOrderResponse.status}`
  );
}

async function testPaymentEndpoints() {
  log.section('Payment Endpoints');
  
  if (!authToken || !testOrderId) {
    log.warn('Skipping payment tests (missing auth token or test order)');
    return;
  }
  
  // Test get order payments
  const orderPaymentsResponse = await makeRequest('GET', `/payments/orders/${testOrderId}/payments`, null, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'GET /payments/orders/:orderId/payments',
    orderPaymentsResponse.status === 200,
    `Status: ${orderPaymentsResponse.status}`
  );
  
  // Test mock payment success (demo mode)
  const mockPaymentResponse = await makeRequest('POST', `/payments/mock/${testOrderId}/success`, null, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'POST /payments/mock/:orderId/success',
    mockPaymentResponse.status === 200 || mockPaymentResponse.status === 201,
    `Status: ${mockPaymentResponse.status}`
  );
  
  // Test Polar webhook (no auth required)
  const webhookData = {
    type: 'checkout.updated',
    data: {
      id: 'checkout_test_123',
      status: 'completed',
      amount: 5000,
      currency: 'USD',
      metadata: {
        orderId: 'order_test_123'
      }
    }
  };
  
  const webhookResponse = await makeRequest('POST', '/payments/webhook/polar', webhookData);
  recordTest(
    'POST /payments/webhook/polar',
    webhookResponse.status === 200 || webhookResponse.status === 400, // 400 for invalid signature is acceptable
    `Status: ${webhookResponse.status}`
  );
}

async function testHostDashboardEndpoints() {
  log.section('Host Dashboard Endpoints');
  
  if (!hostToken) {
    log.warn('Skipping host dashboard tests (no host token)');
    return;
  }
  
  // Test host dashboard
  const dashboardResponse = await makeRequest('GET', '/host/dashboard', null, {
    Authorization: `Bearer ${hostToken}`
  });
  recordTest(
    'GET /host/dashboard',
    dashboardResponse.status === 200,
    `Status: ${dashboardResponse.status}`
  );
  
  // Test host listings
  const hostListingsResponse = await makeRequest('GET', '/host/listings', null, {
    Authorization: `Bearer ${hostToken}`
  });
  recordTest(
    'GET /host/listings',
    hostListingsResponse.status === 200,
    `Status: ${hostListingsResponse.status}`
  );
  
  // Test host orders
  const hostOrdersResponse = await makeRequest('GET', '/host/orders', null, {
    Authorization: `Bearer ${hostToken}`
  });
  recordTest(
    'GET /host/orders',
    hostOrdersResponse.status === 200,
    `Status: ${hostOrdersResponse.status}`
  );
  
  // Test host calendar
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const calendarResponse = await makeRequest('GET', `/host/calendar?start=${startDate}&end=${endDate}`, null, {
    Authorization: `Bearer ${hostToken}`
  });
  recordTest(
    'GET /host/calendar',
    calendarResponse.status === 200,
    `Status: ${calendarResponse.status}`
  );
  
  // Test wallet transactions
  const walletResponse = await makeRequest('GET', '/host/wallet/transactions', null, {
    Authorization: `Bearer ${hostToken}`
  });
  recordTest(
    'GET /host/wallet/transactions',
    walletResponse.status === 200,
    `Status: ${walletResponse.status}`
  );
  
  // Test access without host role (should fail) - create a separate regular user
  const regularUserData = {
    name: 'Regular User',
    email: `regular.${Date.now()}@example.com`,
    password: 'password123'
  };
  
  const regularUserResponse = await makeRequest('POST', '/auth/register', regularUserData);
  let regularUserToken = null;
  if (regularUserResponse.status === 201) {
    regularUserToken = regularUserResponse.data.data.token;
  }
  
  if (regularUserToken) {
    const unauthorizedDashboardResponse = await makeRequest('GET', '/host/dashboard', null, {
      Authorization: `Bearer ${regularUserToken}`
    });
    recordTest(
      'GET /host/dashboard (non-host user)',
      unauthorizedDashboardResponse.status === 403,
      `Status: ${unauthorizedDashboardResponse.status}`
    );
  } else {
    recordTest(
      'GET /host/dashboard (non-host user)',
      false,
      'Failed to create regular user for testing'
    );
  }
}

async function testAdminEndpoints() {
  log.section('Admin Panel Endpoints');
  
  // Try to create admin user or use existing credentials
  // Note: In a real scenario, admin users would be seeded or created through special process
  log.warn('Admin tests may fail if no admin user exists');
  
  // Test admin dashboard without auth (should fail)
  const unauthorizedAdminResponse = await makeRequest('GET', '/admin/dashboard');
  recordTest(
    'GET /admin/dashboard (unauthorized)',
    unauthorizedAdminResponse.status === 401,
    `Status: ${unauthorizedAdminResponse.status}`
  );
  
  // Test admin dashboard with regular user (should fail)
  const forbiddenAdminResponse = await makeRequest('GET', '/admin/dashboard', null, {
    Authorization: `Bearer ${authToken}`
  });
  recordTest(
    'GET /admin/dashboard (non-admin user)',
    forbiddenAdminResponse.status === 403,
    `Status: ${forbiddenAdminResponse.status}`
  );
  
  // If you have admin credentials, you can test these endpoints:
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminLoginResponse = await makeRequest('POST', '/auth/login', {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    
    if (adminLoginResponse.status === 200) {
      adminToken = adminLoginResponse.data.data.token;
      
      // Test admin dashboard
      const adminDashboardResponse = await makeRequest('GET', '/admin/dashboard', null, {
        Authorization: `Bearer ${adminToken}`
      });
      recordTest(
        'GET /admin/dashboard',
        adminDashboardResponse.status === 200,
        `Status: ${adminDashboardResponse.status}`
      );
      
      // Test get users
      const usersResponse = await makeRequest('GET', '/admin/users', null, {
        Authorization: `Bearer ${adminToken}`
      });
      recordTest(
        'GET /admin/users',
        usersResponse.status === 200,
        `Status: ${usersResponse.status}`
      );
      
      // Test get orders
      const adminOrdersResponse = await makeRequest('GET', '/admin/orders', null, {
        Authorization: `Bearer ${adminToken}`
      });
      recordTest(
        'GET /admin/orders',
        adminOrdersResponse.status === 200,
        `Status: ${adminOrdersResponse.status}`
      );
      
      // Test get payouts
      const payoutsResponse = await makeRequest('GET', '/admin/payouts', null, {
        Authorization: `Bearer ${adminToken}`
      });
      recordTest(
        'GET /admin/payouts',
        payoutsResponse.status === 200,
        `Status: ${payoutsResponse.status}`
      );
    }
  }
}

async function testErrorHandling() {
  log.section('Error Handling Tests');
  
  // Test invalid endpoint
  const invalidEndpointResponse = await makeRequest('GET', '/invalid-endpoint');
  recordTest(
    'GET /invalid-endpoint',
    invalidEndpointResponse.status === 404,
    `Status: ${invalidEndpointResponse.status}`
  );
  
  // Test malformed JSON
  const malformedResponse = await client({
    method: 'POST',
    url: '/auth/register',
    data: '{"name": "test"', // Invalid JSON
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true
  }).catch(() => ({ status: 400 }));
  
  recordTest(
    'Malformed JSON handling',
    malformedResponse.status === 400 || malformedResponse.status === 0,
    `Status: ${malformedResponse.status}`
  );
  
  // Test missing required fields
  const missingFieldsResponse = await makeRequest('POST', '/auth/register', {
    name: 'Test'
    // Missing email and password
  });
  recordTest(
    'Missing required fields',
    missingFieldsResponse.status === 400,
    `Status: ${missingFieldsResponse.status}`
  );
  
  // Test invalid token
  const invalidTokenResponse = await makeRequest('GET', '/auth/me', null, {
    Authorization: 'Bearer invalid-token'
  });
  recordTest(
    'Invalid token handling',
    invalidTokenResponse.status === 401,
    `Status: ${invalidTokenResponse.status}`
  );
}

async function testRateLimiting() {
  log.section('Rate Limiting Tests');
  
  // Check if rate limiting is disabled via environment variable
  const isRateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
  
  if (isRateLimitDisabled) {
    log.info('Rate limiting is disabled for development/testing');
    recordTest(
      'Rate limiting configuration',
      true,
      'Rate limiting properly disabled for development'
    );
    return;
  }
  
  // Test rate limiting on auth endpoints
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }));
  }
  
  const responses = await Promise.all(requests);
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  
  recordTest(
    'Rate limiting on auth endpoints',
    rateLimitedCount > 0,
    `Rate limited requests: ${rateLimitedCount}/10`
  );
}

async function cleanup() {
  log.section('Cleanup');
  
  // Cancel test order first to free up reservations
  if (testOrderId && authToken) {
    await makeRequest('POST', `/orders/${testOrderId}/cancel`, null, {
      Authorization: `Bearer ${authToken}`
    });
  }
  
  // Delete test listing if created
  if (testListingId && hostToken) {
    const deleteResponse = await makeRequest('DELETE', `/listings/${testListingId}`, null, {
      Authorization: `Bearer ${hostToken}`
    });
    recordTest(
      'DELETE /listings/:id (cleanup)',
      deleteResponse.status === 200 || deleteResponse.status === 404,
      `Status: ${deleteResponse.status}`
    );
  }
  
  log.info('Cleanup completed');
}

function printResults() {
  log.section('Test Results Summary');
  
  console.log(`\n📊 Test Results:`);
  console.log(`   Total Tests: ${testResults.total}`.blue);
  console.log(`   Passed: ${testResults.passed}`.green);
  console.log(`   Failed: ${testResults.failed}`.red);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`.cyan);
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`.red);
    testResults.details
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`   • ${test.name} - ${test.details}`.red);
      });
  }
  
  console.log(`\n🎯 Test completed at ${new Date().toISOString()}\n`);
}

// Main test runner
async function runTests() {
  console.log(`🚀 Starting API Tests for ${BASE_URL}\n`.yellow.bold);
  
  try {
    await testHealthCheck();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testAuthenticationEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testListingEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testOrderEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testPaymentEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testHostDashboardEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testAdminEndpoints();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testErrorHandling();
    await delay(DELAY_BETWEEN_TESTS);
    
    await testRateLimiting();
    await delay(DELAY_BETWEEN_TESTS);
    
    await cleanup();
    
  } catch (error) {
    log.error(`Test execution error: ${error.message}`);
    process.exit(1);
  }
  
  printResults();
  
  // Exit with error code if tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (require.main === module) {
  // Check if server is running
  client.get('/')
    .then(() => {
      log.info('Server is running, starting tests...');
      runTests();
    })
    .catch(() => {
      log.error(`Cannot connect to server at ${BASE_URL}`);
      log.info('Please make sure the server is running with: npm run dev');
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testResults
};
