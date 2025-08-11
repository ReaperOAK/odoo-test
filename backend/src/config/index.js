module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/p2p-marketplace',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  
  // Application settings
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'mock',
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  
  // Business logic
  PLATFORM_COMMISSION_PERCENT: parseInt(process.env.PLATFORM_COMMISSION_PERCENT) || 10,
  DEFAULT_DEPOSIT_PERCENT: parseInt(process.env.DEFAULT_DEPOSIT_PERCENT) || 30,
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for dev
  
  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};
