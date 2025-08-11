/**
 * Test Configuration - Disables Rate Limiting
 * Used for running API tests without rate limiting interference
 */

const rateLimit = require('express-rate-limit');

// Create a no-op rate limiter for testing
const noLimitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // very high limit
  message: {
    success: false,
    message: 'Rate limit exceeded'
  },
  skip: () => true // Skip all rate limiting
});

/**
 * Disable all rate limiting
 */
const disabledLimiter = (req, res, next) => {
  next();
};

module.exports = {
  apiLimiter: disabledLimiter,
  authLimiter: disabledLimiter,
  paymentLimiter: disabledLimiter,
  uploadLimiter: disabledLimiter,
  searchLimiter: disabledLimiter,
  createStrictLimiter: () => disabledLimiter,
  createCustomLimiter: () => disabledLimiter
};
