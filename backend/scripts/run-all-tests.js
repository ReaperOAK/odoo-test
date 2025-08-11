#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const colors = require('colors');

// Test suite configuration
const testSuites = [
  {
    name: 'Quick Health Check',
    script: 'quick-test.js',
    description: 'Basic connectivity and health check',
    timeout: 50000
  },
  {
    name: 'Comprehensive API Tests',
    script: 'test.js',
    description: 'Full API endpoint testing suite',
    timeout: 120000
  },
  {
    name: 'Load Testing',
    script: 'load-test.js',
    description: 'Performance and load testing',
    timeout: 180000,
    optional: true
  }
];

function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`[color] || message);
}

function runTest(testSuite) {
  return new Promise((resolve, reject) => {
    log(`🚀 Starting: ${testSuite.name}`, 'cyan');
    log(`📝 ${testSuite.description}`, 'gray');
    
    const scriptPath = path.join(__dirname, testSuite.script);
    const testProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    const timeout = setTimeout(() => {
      testProcess.kill('SIGTERM');
      reject(new Error(`Test suite timed out after ${testSuite.timeout}ms`));
    }, testSuite.timeout);
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        log(`✅ ${testSuite.name} completed successfully`, 'green');
        resolve({ name: testSuite.name, success: true, code });
      } else {
        log(`❌ ${testSuite.name} failed with exit code ${code}`, 'red');
        resolve({ name: testSuite.name, success: false, code });
      }
    });
    
    testProcess.on('error', (error) => {
      clearTimeout(timeout);
      log(`💥 ${testSuite.name} crashed: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🧪 P2P Marketplace API Test Suite'.yellow.bold);
  console.log('=' * 50);
  
  const startTime = Date.now();
  const results = [];
  
  // Check if --load flag is provided
  const includeLoadTests = process.argv.includes('--load');
  const suites = includeLoadTests 
    ? testSuites 
    : testSuites.filter(suite => !suite.optional);
  
  if (!includeLoadTests) {
    log('💡 Use --load flag to include load testing', 'yellow');
  }
  
  console.log(`\n📊 Running ${suites.length} test suite(s)...\n`);
  
  for (const testSuite of suites) {
    try {
      const result = await runTest(testSuite);
      results.push(result);
      console.log(''); // Add spacing between tests
    } catch (error) {
      log(`💥 Fatal error in ${testSuite.name}: ${error.message}`, 'red');
      results.push({ 
        name: testSuite.name, 
        success: false, 
        error: error.message 
      });
      
      // Continue with other tests unless it's a critical failure
      if (error.message.includes('ECONNREFUSED')) {
        log('🛑 Server connection failed - stopping test suite', 'red');
        break;
      }
    }
  }
  
  // Print summary
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📈 Test Suite Summary'.yellow.bold);
  console.log('=' * 50);
  console.log(`🕐 Total Duration: ${(totalTime / 1000).toFixed(1)}s`.blue);
  console.log(`📊 Test Suites: ${results.length}`.blue);
  console.log(`✅ Passed: ${passed}`.green);
  console.log(`❌ Failed: ${failed}`.red);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`.cyan);
  
  if (failed > 0) {
    console.log('\n❌ Failed Test Suites:'.red);
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.name} ${r.error ? `(${r.error})` : `(exit code: ${r.code})`}`.red);
      });
  }
  
  if (passed === results.length) {
    console.log('\n🎉 All test suites passed! 🚀'.green.bold);
  } else {
    console.log('\n⚠️  Some test suites failed. Check the logs above.'.yellow);
  }
  
  console.log('\n📚 For detailed documentation, see: scripts/TEST_README.md');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (require.main === module) {
  log('🔍 Checking server availability...', 'blue');
  
  // Quick server check
  const axios = require('axios');
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
  
  axios.get(BASE_URL, { timeout: 5000 })
    .then(() => {
      log('✅ Server is running', 'green');
      runAllTests();
    })
    .catch((error) => {
      log('❌ Server check failed:', 'red');
      if (error.code === 'ECONNREFUSED') {
        log('🛑 Cannot connect to server', 'red');
        log('💡 Make sure the server is running with: npm run dev', 'yellow');
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
      process.exit(1);
    });
}

module.exports = { runAllTests };
