const mongoose = require('mongoose');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'p2p-marketplace' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;
      
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Create indexes
    await createIndexes();
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Create database indexes for performance
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Listing indexes
    await db.collection('listings').createIndex({ ownerId: 1 });
    await db.collection('listings').createIndex({ title: 'text', description: 'text' });
    await db.collection('listings').createIndex({ category: 1, status: 1 });
    await db.collection('listings').createIndex({ location: 1 });
    
    // Reservation indexes (critical for availability checks)
    await db.collection('reservations').createIndex({ listingId: 1, start: 1, end: 1 });
    await db.collection('reservations').createIndex({ orderId: 1 });
    await db.collection('reservations').createIndex({ status: 1 });
    
    // Order indexes
    await db.collection('orders').createIndex({ renterId: 1, createdAt: -1 });
    await db.collection('orders').createIndex({ hostId: 1, createdAt: -1 });
    await db.collection('orders').createIndex({ paymentStatus: 1, orderStatus: 1 });
    
    // Payment indexes
    await db.collection('payments').createIndex({ orderId: 1 });
    await db.collection('payments').createIndex({ razorpayOrderId: 1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

module.exports = {
  connectDB,
  logger
};
