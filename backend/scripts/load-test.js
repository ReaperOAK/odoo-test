#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

// Load testing configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 20;
const DELAY_BETWEEN_REQUESTS = parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 100;

// Statistics tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  statusCodes: {},
  errors: {}
};

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 50000,
  validateStatus: () => true
});

function log(message, color = 'white') {
  console.log(message[color] || message);
}

function updateStats(responseTime, statusCode, error = null) {
  stats.totalRequests++;
  stats.totalResponseTime += responseTime;
  stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
  stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);
  
  if (statusCode >= 200 && statusCode < 400) {
    stats.successfulRequests++;
  } else {
    stats.failedRequests++;
  }
  
  stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
  
  if (error) {
    const errorKey = error.code || error.message || 'Unknown';
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
  }
}

async function makeTestRequest(url, method = 'GET', data = null, headers = {}) {
  const startTime = Date.now();
  
  try {
    const response = await client({
      method,
      url,
      data,
      headers
    });
    
    const responseTime = Date.now() - startTime;
    updateStats(responseTime, response.status);
    
    return { success: true, status: response.status, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const status = error.response?.status || 0;
    updateStats(responseTime, status, error);
    
    return { success: false, status, responseTime, error: error.message };
  }
}

async function simulateUser(userId) {
  log(`👤 User ${userId} starting...`, 'cyan');
  
  const userStats = {
    requests: 0,
    successes: 0,
    failures: 0
  };
  
  // Register user
  const email = `loadtest.user.${userId}.${Date.now()}@example.com`;
  const registerResult = await makeTestRequest('/auth/register', 'POST', {
    name: `Load Test User ${userId}`,
    email,
    password: 'password123'
  });
  
  userStats.requests++;
  if (registerResult.success) {
    userStats.successes++;
  } else {
    userStats.failures++;
  }
  
  let token = null;
  if (registerResult.success) {
    // Login to get token
    const loginResult = await makeTestRequest('/auth/login', 'POST', {
      email,
      password: 'password123'
    });
    
    userStats.requests++;
    if (loginResult.success) {
      userStats.successes++;
      // Extract token (this would need to be adjusted based on actual response)
      // For now, we'll simulate having a token
      token = 'simulated-token';
    } else {
      userStats.failures++;
    }
  }
  
  // Make multiple requests
  const requests = [
    () => makeTestRequest('/listings'),
    () => makeTestRequest('/listings?page=1&limit=5'),
    () => makeTestRequest('/listings?search=camera'),
    () => makeTestRequest('/listings?category=electronics'),
  ];
  
  if (token) {
    requests.push(
      () => makeTestRequest('/auth/me', 'GET', null, { Authorization: `Bearer ${token}` }),
      () => makeTestRequest('/orders/my-orders', 'GET', null, { Authorization: `Bearer ${token}` })
    );
  }
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const randomRequest = requests[Math.floor(Math.random() * requests.length)];
    const result = await randomRequest();
    
    userStats.requests++;
    if (result.success) {
      userStats.successes++;
    } else {
      userStats.failures++;
    }
    
    // Delay between requests
    if (DELAY_BETWEEN_REQUESTS > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
  
  log(`👤 User ${userId} completed: ${userStats.successes}/${userStats.requests} successful`, 'green');
  return userStats;
}

async function runLoadTest() {
  log('🚀 Starting Load Test...', 'yellow');
  log(`📊 Configuration:`, 'blue');
  log(`   • Concurrent Users: ${CONCURRENT_USERS}`);
  log(`   • Requests per User: ${REQUESTS_PER_USER}`);
  log(`   • Delay between Requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  log(`   • Target: ${BASE_URL}\n`);
  
  const startTime = Date.now();
  
  // Create concurrent users
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Wait for all users to complete
  log('⏳ Running concurrent users...', 'yellow');
  const userResults = await Promise.all(userPromises);
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate final statistics
  const avgResponseTime = stats.totalResponseTime / stats.totalRequests;
  const requestsPerSecond = (stats.totalRequests / totalTime) * 1000;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  
  // Print results
  log('\n📈 Load Test Results:', 'yellow');
  log('=' * 50, 'gray');
  
  log(`🕐 Duration: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`, 'blue');
  log(`📊 Total Requests: ${stats.totalRequests}`, 'blue');
  log(`✅ Successful: ${stats.successfulRequests} (${successRate.toFixed(1)}%)`, 'green');
  log(`❌ Failed: ${stats.failedRequests} (${(100 - successRate).toFixed(1)}%)`, 'red');
  
  log(`\n⚡ Performance:`, 'cyan');
  log(`   • Requests/sec: ${requestsPerSecond.toFixed(2)}`);
  log(`   • Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
  log(`   • Min Response Time: ${stats.minResponseTime}ms`);
  log(`   • Max Response Time: ${stats.maxResponseTime}ms`);
  
  log(`\n📋 Status Code Distribution:`, 'cyan');
  Object.entries(stats.statusCodes)
    .sort(([a], [b]) => a - b)
    .forEach(([code, count]) => {
      const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
      const color = code.startsWith('2') ? 'green' : code.startsWith('4') ? 'yellow' : 'red';
      log(`   • ${code}: ${count} (${percentage}%)`, color);
    });
  
  if (Object.keys(stats.errors).length > 0) {
    log(`\n🐛 Error Distribution:`, 'red');
    Object.entries(stats.errors)
      .sort(([, a], [, b]) => b - a)
      .forEach(([error, count]) => {
        const percentage = ((count / stats.failedRequests) * 100).toFixed(1);
        log(`   • ${error}: ${count} (${percentage}% of errors)`, 'red');
      });
  }
  
  log(`\n👥 Per-User Summary:`, 'cyan');
  userResults.forEach((result, index) => {
    const userSuccessRate = (result.successes / result.requests) * 100;
    log(`   • User ${index + 1}: ${result.successes}/${result.requests} (${userSuccessRate.toFixed(1)}%)`);
  });
  
  // Performance assessment
  log(`\n🎯 Performance Assessment:`, 'magenta');
  if (successRate >= 95) {
    log('   • Success Rate: Excellent ✨', 'green');
  } else if (successRate >= 90) {
    log('   • Success Rate: Good ✅', 'yellow');
  } else {
    log('   • Success Rate: Needs Improvement ⚠️', 'red');
  }
  
  if (avgResponseTime <= 200) {
    log('   • Response Time: Excellent ⚡', 'green');
  } else if (avgResponseTime <= 500) {
    log('   • Response Time: Good ✅', 'yellow');
  } else if (avgResponseTime <= 1000) {
    log('   • Response Time: Acceptable ⚠️', 'yellow');
  } else {
    log('   • Response Time: Slow 🐌', 'red');
  }
  
  if (requestsPerSecond >= 100) {
    log('   • Throughput: High 🚀', 'green');
  } else if (requestsPerSecond >= 50) {
    log('   • Throughput: Medium ✅', 'yellow');
  } else {
    log('   • Throughput: Low ⚠️', 'red');
  }
  
  log('\n✨ Load test completed!', 'green');
  
  // Exit with error code if success rate is too low
  if (successRate < 90) {
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  // Check if server is running
  client.get('/')
    .then(() => {
      log('Server is running, starting load test...', 'green');
      runLoadTest().catch(error => {
        log(`Load test failed: ${error.message}`, 'red');
        process.exit(1);
      });
    })
    .catch(() => {
      log(`Cannot connect to server at ${BASE_URL}`, 'red');
      log('Please make sure the server is running with: npm run dev', 'yellow');
      process.exit(1);
    });
}

module.exports = { runLoadTest, stats };
