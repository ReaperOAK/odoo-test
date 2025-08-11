#!/usr/bin/env node

const axios = require('axios');

// Simple test runner for quick API validation
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function quickTest() {
  console.log('🚀 Quick API Test Starting...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing server connection...');
    await axios.get(BASE_URL.replace('/api', ''));
    console.log('✅ Server is running\n');
    
    // Test 2: Public endpoints
    console.log('2. Testing public endpoints...');
    const listingsResponse = await axios.get(`${BASE_URL}/listings`);
    console.log(`✅ GET /listings - Status: ${listingsResponse.status}`);
    
    // Test 3: Registration
    console.log('\n3. Testing user registration...');
    const registerData = {
      name: 'Quick Test User',
      email: `quicktest.${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log(`✅ POST /auth/register - Status: ${registerResponse.status}`);
    
    const token = registerResponse.data.data.token;
    
    // Test 4: Authentication
    console.log('\n4. Testing authentication...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ GET /auth/me - Status: ${profileResponse.status}`);
    
    console.log('\n🎉 Quick test completed successfully!');
    console.log('📝 Run "npm run test" for comprehensive testing.');
    
  } catch (error) {
    console.error('\n❌ Quick test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running with: npm run dev');
    }
    
    process.exit(1);
  }
}

quickTest();
