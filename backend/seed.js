const mongoose = require('mongoose');
require('dotenv').config();

// Set seeding mode to allow past dates in reservations
process.env.SEEDING_MODE = 'true';

// Import models
const User = require('./src/models/User');
const Listing = require('./src/models/Listing');
const Order = require('./src/models/Order');
const Reservation = require('./src/models/Reservation');
const Payment = require('./src/models/Payment');
const Payout = require('./src/models/Payout');

const logger = require('./src/utils/logger');

// Demo data
const createSeedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    if (process.argv.includes('--reset')) {
      await Promise.all([
        User.deleteMany({}),
        Listing.deleteMany({}),
        Order.deleteMany({}),
        Reservation.deleteMany({}),
        Payment.deleteMany({}),
        Payout.deleteMany({})
      ]);
      logger.info('Cleared existing data');
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@marketplace.com',
      passwordHash: 'admin123', // Let the model hash this
      role: 'admin',
      isHost: false
    });
    logger.info('Created admin user');

    // Create hosts
    const host1 = await User.create({
      name: 'John Electronics',
      email: 'john@electronics.com',
      passwordHash: 'host123', // Let the model hash this
      isHost: true,
      role: 'host',
      hostProfile: {
        displayName: 'John\'s Electronics',
        verified: true,
        phone: '+919876543210',
        address: 'Electronics Market, Mumbai, Maharashtra',
        govtIdUrl: 'https://example.com/govt-id-1.jpg'
      },
      walletBalance: 15000
    });

    const host2 = await User.create({
      name: 'Sarah sports',
      email: 'sarah@sports.com',
      passwordHash: 'host123', // Let the model hash this
      isHost: true,
      role: 'host',
      hostProfile: {
        displayName: 'Sarah\'s sports Equipment',
        verified: true,
        phone: '+919876543211',
        address: 'sports Complex, Delhi, Delhi',
        govtIdUrl: 'https://example.com/govt-id-2.jpg'
      },
      walletBalance: 8500
    });

    const host3 = await User.create({
      name: 'Mike music',
      email: 'mike@music.com',
      passwordHash: 'host123', // Let the model hash this
      isHost: true,
      role: 'host',
      hostProfile: {
        displayName: 'Mike\'s music Studio',
        verified: false,
        phone: '+919876543212',
        address: 'music Street, Bangalore, Karnataka'
      },
      walletBalance: 3200
    });

    logger.info('Created host users');

    // Create customers
    const customers = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@customer.com',
        passwordHash: 'customer123', // Let the model hash this
        isHost: false,
        role: 'user'
      },
      {
        name: 'Bob Smith',
        email: 'bob@customer.com',
        passwordHash: 'customer123', // Let the model hash this
        isHost: false,
        role: 'user'
      },
      {
        name: 'Carol Wilson',
        email: 'carol@customer.com',
        passwordHash: 'customer123', // Let the model hash this
        isHost: false,
        role: 'user'
      },
      {
        name: 'David Brown',
        email: 'david@customer.com',
        passwordHash: 'customer123', // Let the model hash this
        isHost: false,
        role: 'user'
      },
      {
        name: 'Eva Davis',
        email: 'eva@customer.com',
        passwordHash: 'customer123', // Let the model hash this
        isHost: false,
        role: 'user'
      }
    ]);

    logger.info('Created customer users');

    // Create listings
    const listings = await Listing.create([
      // Host 1 - Electronics
      {
        ownerId: host1._id,
        title: 'Professional DSLR Camera Canon EOS R5',
        description: 'High-end mirrorless camera perfect for photography and videography. Includes 24-105mm lens, extra battery, and memory cards.',
        images: [
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'
        ],
        category: 'electronics',
        unitType: 'day',
        basePrice: 2500,
        depositType: 'percent',
        depositValue: 30,
        totalQuantity: 2,
        location: 'Mumbai, Maharashtra',
        status: 'published',
        metadata: {
          features: ['4K Video', '45MP Sensor', 'Weather Sealed'],
          accessories: ['Lens', 'Battery', 'Charger', 'Memory Card']
        }
      },
      {
        ownerId: host1._id,
        title: 'MacBook Pro 16-inch M2 Max',
        description: 'Latest MacBook Pro with M2 Max chip. Perfect for video editing, development, and creative work. Includes charger and protective case.',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'
        ],
        category: 'electronics',
        unitType: 'day',
        basePrice: 3000,
        depositType: 'percent',
        depositValue: 25,
        totalQuantity: 1,
        location: 'Mumbai, Maharashtra',
        status: 'published',
        metadata: {
          specs: ['M2 Max Chip', '32GB RAM', '1TB SSD'],
          software: ['Final Cut Pro', 'Logic Pro', 'Adobe Creative Suite']
        }
      },
      {
        ownerId: host1._id,
        title: 'Professional Audio Recording Setup',
        description: 'Complete audio recording setup with microphones, audio interface, and studio monitors. Ideal for podcasting and music production.',
        images: [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500'
        ],
        category: 'electronics',
        unitType: 'day',
        basePrice: 1800,
        depositType: 'flat',
        depositValue: 5000,
        totalQuantity: 1,
        location: 'Mumbai, Maharashtra',
        status: 'published'
      },

      // Host 2 - sports Equipment
      {
        ownerId: host2._id,
        title: 'Mountain Bike - Trek X-Caliber 9',
        description: 'High-quality mountain bike perfect for trails and city riding. Well-maintained with recent tune-up. Helmet and lock included.',
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
          'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=500'
        ],
        category: 'sports',
        unitType: 'day',
        basePrice: 800,
        depositType: 'percent',
        depositValue: 20,
        totalQuantity: 3,
        location: 'Delhi, Delhi',
        status: 'published',
        metadata: {
          size: 'Medium (17.5")',
          features: ['29" wheels', '1x drivetrain', 'Air fork'],
          accessories: ['Helmet', 'Lock', 'Water bottle']
        }
      },
      {
        ownerId: host2._id,
        title: 'Professional Tennis Racket Set',
        description: 'Wilson Pro Staff rackets used by professionals. Includes 2 rackets, strings, grips, and tennis balls.',
        images: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
          'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500'
        ],
        category: 'sports',
        unitType: 'day',
        basePrice: 400,
        depositType: 'percent',
        depositValue: 25,
        totalQuantity: 2,
        location: 'Delhi, Delhi',
        status: 'published'
      },
      {
        ownerId: host2._id,
        title: 'Camping Gear Complete Set',
        description: 'Everything you need for camping: 4-person tent, sleeping bags, camping stove, lanterns, and cooking equipment.',
        images: [
          'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500',
          'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=500'
        ],
        category: 'sports',
        unitType: 'day',
        basePrice: 1200,
        depositType: 'percent',
        depositValue: 30,
        totalQuantity: 1,
        location: 'Delhi, Delhi',
        status: 'published',
        metadata: {
          capacity: '4 persons',
          items: ['Tent', 'Sleeping bags', 'Camping stove', 'Lanterns', 'Cookware']
        }
      },

      // Host 3 - music Equipment
      {
        ownerId: host3._id,
        title: 'Electric Guitar - Fender Stratocaster',
        description: 'Classic Fender Stratocaster electric guitar. Perfect for gigs, recording, or practice. Includes amplifier and cables.',
        images: [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
          'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=500'
        ],
        category: 'music',
        unitType: 'day',
        basePrice: 1000,
        depositType: 'percent',
        depositValue: 35,
        totalQuantity: 2,
        location: 'Bangalore, Karnataka',
        status: 'published',
        metadata: {
          model: 'American Professional II',
          includes: ['Amplifier', 'Cables', 'Picks', 'Strap']
        }
      },
      {
        ownerId: host3._id,
        title: 'DJ Controller and Mixer Setup',
        description: 'Professional DJ setup with controller, mixer, and speakers. Perfect for parties and events. Includes laptop with DJ software.',
        images: [
          'https://images.unsplash.com/photo-1571330735066-03a8881b1cb6?w=500',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
        ],
        category: 'music',
        unitType: 'day',
        basePrice: 2200,
        depositType: 'flat',
        depositValue: 8000,
        totalQuantity: 1,
        location: 'Bangalore, Karnataka',
        status: 'published'
      }
    ]);

    logger.info('Created listings');

    // Create some sample orders and reservations
    const currentDate = new Date();
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(currentDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);

    // Order 1 - Completed
    const order1 = await Order.create({
      renterId: customers[0]._id,
      hostId: host1._id,
      lines: [{
        listingId: listings[0]._id, // Camera
        qty: 1,
        start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        unitPrice: 2500,
        lineTotal: 7500 // 3 days * 2500 * 1
      }],
      subtotal: 7500,
      depositAmount: 2250, // 30%
      platformCommission: 750, // 10%
      totalAmount: 2250, // Deposit only
      paymentStatus: 'paid',
      orderStatus: 'completed',
      razorpayOrderId: 'order_demo_completed_1'
    });

    await Reservation.create({
      listingId: listings[0]._id,
      orderId: order1._id,
      qty: 1,
      start: order1.lines[0].start,
      end: order1.lines[0].end,
      status: 'returned'
    });

    await Payment.create({
      orderId: order1._id,
      amount: 2250,
      method: 'mock',
      razorpayOrderId: 'order_demo_completed_1',
      razorpayPaymentId: 'pay_demo_completed_1',
      status: 'success'
    });

    // Order 2 - In Progress
    const order2 = await Order.create({
      renterId: customers[1]._id,
      hostId: host2._id,
      lines: [{
        listingId: listings[3]._id, // Mountain Bike
        qty: 1,
        start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        end: tomorrow,
        unitPrice: 800,
        lineTotal: 1600 // 2 days
      }],
      subtotal: 1600,
      depositAmount: 320, // 20%
      platformCommission: 160, // 10%
      totalAmount: 320,
      paymentStatus: 'paid',
      orderStatus: 'in_progress',
      razorpayOrderId: 'order_demo_active_1'
    });

    await Reservation.create({
      listingId: listings[3]._id,
      orderId: order2._id,
      qty: 1,
      start: order2.lines[0].start,
      end: order2.lines[0].end,
      status: 'picked'
    });

    await Payment.create({
      orderId: order2._id,
      amount: 320,
      method: 'mock',
      razorpayOrderId: 'order_demo_active_1',
      razorpayPaymentId: 'pay_demo_active_1',
      status: 'success'
    });

    // Order 3 - Confirmed (future booking)
    const order3 = await Order.create({
      renterId: customers[2]._id,
      hostId: host1._id,
      lines: [{
        listingId: listings[1]._id, // MacBook
        qty: 1,
        start: tomorrow,
        end: dayAfterTomorrow,
        unitPrice: 3000,
        lineTotal: 6000 // 2 days * 3000 * 1
      }],
      subtotal: 6000,
      depositAmount: 1500, // 25%
      platformCommission: 600, // 10%
      totalAmount: 1500,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      razorpayOrderId: 'order_demo_future_1'
    });

    await Reservation.create({
      listingId: listings[1]._id,
      orderId: order3._id,
      qty: 1,
      start: order3.lines[0].start,
      end: order3.lines[0].end,
      status: 'reserved'
    });

    await Payment.create({
      orderId: order3._id,
      amount: 1500,
      method: 'mock',
      razorpayOrderId: 'order_demo_future_1',
      razorpayPaymentId: 'pay_demo_future_1',
      status: 'success'
    });

    logger.info('Created sample orders and reservations');

    // Create some payouts
    await Payout.create([
      {
        hostId: host1._id,
        amount: 6750, // Order 1 earnings
        status: 'processed',
        method: 'manual',
        metadata: {
          processedBy: admin._id,
          processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Processed manually for demo'
        }
      },
      {
        hostId: host2._id,
        amount: 1440, // Order 2 earnings
        status: 'pending',
        method: 'manual'
      }
    ]);

    logger.info('Created sample payouts');

    // Log demo credentials
    console.log('\n🎉 Demo data created successfully!\n');
    console.log('📧 Demo Credentials:');
    console.log('====================');
    console.log('Admin: admin@marketplace.com / admin123');
    console.log('Host 1: john@electronics.com / host123 (Electronics)');
    console.log('Host 2: sarah@sports.com / host123 (sports)');
    console.log('Host 3: mike@music.com / host123 (music - Unverified)');
    console.log('Customer 1: alice@customer.com / customer123');
    console.log('Customer 2: bob@customer.com / customer123');
    console.log('Customer 3: carol@customer.com / customer123');
    console.log('Customer 4: david@customer.com / customer123');
    console.log('Customer 5: eva@customer.com / customer123');
    console.log('\n📊 Created Data:');
    console.log('================');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Listings: ${await Listing.countDocuments()}`);
    console.log(`Orders: ${await Order.countDocuments()}`);
    console.log(`Reservations: ${await Reservation.countDocuments()}`);
    console.log(`Payments: ${await Payment.countDocuments()}`);
    console.log(`Payouts: ${await Payout.countDocuments()}`);
    console.log('\n🚀 Server ready! Run: npm start');

  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the seed script
createSeedData();
