#!/usr/bin/env node

const colors = require('colors');
const PolarService = require('../src/services/polar.service');

console.log('🧪 Testing Polar.sh Integration'.cyan.bold);
console.log('================================'.gray);

async function testPolarIntegration() {
  try {
    console.log('\n📋 Test 1: Create Mock Checkout Session'.yellow);
    
    const mockOrderData = {
      orderId: 'test_order_123',
      customerId: 'test_customer_456',
      customerEmail: 'test@example.com',
      listingId: 'test_listing_789',
      productName: 'Test Rental Item',
      total: 50.00
    };

    const checkoutSession = await PolarService.createCheckoutSession(mockOrderData);
    
    console.log('✅ Checkout session created:'.green);
    console.log(`   Session ID: ${checkoutSession.id}`);
    console.log(`   URL: ${checkoutSession.url}`);
    console.log(`   Amount: $${checkoutSession.amount / 100}`);
    console.log(`   Currency: ${checkoutSession.currency}`);

    console.log('\n📋 Test 2: Verify Mock Checkout Session'.yellow);
    
    const sessionData = await PolarService.verifyCheckoutSession(checkoutSession.id);
    
    console.log('✅ Session verification:'.green);
    console.log(`   Status: ${sessionData.status}`);
    console.log(`   Payment Method: ${sessionData.payment_method}`);

    console.log('\n📋 Test 3: Create Mock Refund'.yellow);
    
    const refund = await PolarService.createRefund(checkoutSession.id, 25.00, 'test_refund');
    
    console.log('✅ Refund created:'.green);
    console.log(`   Refund ID: ${refund.id}`);
    console.log(`   Amount: $${refund.amount / 100}`);
    console.log(`   Status: ${refund.status}`);

    console.log('\n📋 Test 4: Webhook Signature Validation'.yellow);
    
    const isValid = PolarService.validateWebhookSignature('test_payload', 'test_signature', 'test_secret');
    
    console.log('✅ Webhook validation:'.green);
    console.log(`   Validation result: ${isValid ? 'Valid' : 'Invalid'} (expected for test mode)`);

    console.log('\n🎉 All tests completed successfully!'.green.bold);
    console.log('\n💡 Note: This test uses mock mode. In production, configure:'.cyan);
    console.log('   - POLAR_ACCESS_TOKEN with your actual token');
    console.log('   - POLAR_WEBHOOK_SECRET with your webhook secret');
    console.log('   - Set PAYMENT_MODE=live for real payments');

  } catch (error) {
    console.error('\n❌ Test failed:'.red.bold);
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testPolarIntegration();
