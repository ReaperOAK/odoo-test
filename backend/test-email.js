// Load environment variables
require('dotenv').config();

const emailService = require('./src/services/email.service');
const config = require('./src/config');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Test configuration
  console.log('📋 Email Configuration:');
  console.log(`- Email Enabled: ${config.EMAIL_ENABLED}`);
  console.log(`- From Email: ${config.FROM_EMAIL}`);
  console.log(`- Resend API Key: ${config.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}\n`);

  // Test email data
  const testUser = {
    _id: 'test-user-id',
    name: 'Test User',
    firstName: 'Test',
    email: process.env.TEST_EMAIL || 'oaak78692@gmail.com'
  };

  const testOrder = {
    _id: 'test-order-id',
    orderNumber: 'ORD-123456',
    status: 'confirmed',
    totalAmount: 2500,
    createdAt: new Date(),
    lines: [
      {
        listingTitle: 'Professional Camera Kit',
        quantity: 1,
        unitPrice: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      }
    ]
  };

  const testPayment = {
    _id: 'test-payment-id',
    amount: 750, // Deposit amount
    status: 'paid',
    externalId: 'pay_test123',
    createdAt: new Date()
  };

  console.log('📧 Testing Email Functions:\n');

  try {
    // Test 1: Welcome Email
    console.log('1. Testing Welcome Email...');
    const welcomeResult = await emailService.sendWelcomeEmail(testUser);
    console.log(`   Result: ${welcomeResult.success ? '✅ Success' : '❌ Failed'}${welcomeResult.message ? ` - ${welcomeResult.message}` : ''}\n`);

    // Test 2: Host Welcome Email
    console.log('2. Testing Host Welcome Email...');
    const hostWelcomeResult = await emailService.sendHostWelcomeEmail(testUser);
    console.log(`   Result: ${hostWelcomeResult.success ? '✅ Success' : '❌ Failed'}${hostWelcomeResult.message ? ` - ${hostWelcomeResult.message}` : ''}\n`);

    // Test 3: Booking Confirmation
    console.log('3. Testing Booking Confirmation...');
    const bookingResult = await emailService.sendBookingConfirmation(testOrder, testUser);
    console.log(`   Result: ${bookingResult.success ? '✅ Success' : '❌ Failed'}${bookingResult.message ? ` - ${bookingResult.message}` : ''}\n`);

    // Test 4: Payment Confirmation
    console.log('4. Testing Payment Confirmation...');
    const paymentResult = await emailService.sendPaymentConfirmation(testOrder, testPayment, testUser);
    console.log(`   Result: ${paymentResult.success ? '✅ Success' : '❌ Failed'}${paymentResult.message ? ` - ${paymentResult.message}` : ''}\n`);

    // Test 5: Order Status Update
    console.log('5. Testing Order Status Update...');
    const statusResult = await emailService.sendOrderStatusUpdate(testOrder, testUser, 'pending');
    console.log(`   Result: ${statusResult.success ? '✅ Success' : '❌ Failed'}${statusResult.message ? ` - ${statusResult.message}` : ''}\n`);

    console.log('🎉 Email service test completed!\n');
    
    console.log('💡 To send real emails:');
    console.log('1. Get a Resend API key from https://resend.com/');
    console.log('2. Set RESEND_API_KEY in your .env file');
    console.log('3. Set FROM_EMAIL to your verified domain email');
    console.log('4. Ensure EMAIL_ENABLED=true (default)\n');

  } catch (error) {
    console.error('❌ Error testing email service:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testEmailService();
}

module.exports = testEmailService;
