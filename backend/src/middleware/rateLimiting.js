const rateLimit = require('express-rate-limit');
const { logger } = require('../config/database');
const config = require('../config');

/**
 * No-op middleware for when rate limiting is disabled
 */
const noLimitMiddleware = (req, res, next) => {
  next();
};

/**
 * General API rate limiting
 */
const apiLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
const authLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Endpoint: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 900
    });
  }
});

/**
 * Rate limiting for order creation (prevent spam orders)
 */
const orderCreationLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 order creation requests per 5 minutes
  message: {
    success: false,
    message: 'Too many order creation attempts, please wait before creating another order.',
    retryAfter: 300
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    const identifier = req.user ? `User: ${req.user._id}` : `IP: ${req.ip}`;
    logger.warn(`Order creation rate limit exceeded for ${identifier}`);
    res.status(429).json({
      success: false,
      message: 'Too many order creation attempts, please wait before creating another order.',
      retryAfter: 300
    });
  }
});

/**
 * Rate limiting for payment attempts
 */
const paymentLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each user to 5 payment attempts per 10 minutes
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later.',
    retryAfter: 600
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    const identifier = req.user ? `User: ${req.user._id}` : `IP: ${req.ip}`;
    logger.warn(`Payment rate limit exceeded for ${identifier}`);
    res.status(429).json({
      success: false,
      message: 'Too many payment attempts, please try again later.',
      retryAfter: 600
    });
  }
});

/**
 * Rate limiting for listing creation (prevent spam listings)
 */
const listingCreationLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 listing creations per hour
  message: {
    success: false,
    message: 'Too many listings created, please wait before creating more.',
    retryAfter: 3600
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    const identifier = req.user ? `User: ${req.user._id}` : `IP: ${req.ip}`;
    logger.warn(`Listing creation rate limit exceeded for ${identifier}`);
    res.status(429).json({
      success: false,
      message: 'Too many listings created, please wait before creating more.',
      retryAfter: 3600
    });
  }
});

/**
 * Rate limiting for search/browse endpoints
 */
const searchLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down.',
    retryAfter: 60
  },
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please slow down.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiting for admin actions
 */
const adminActionLimiter = config.RATE_LIMIT_DISABLED ? noLimitMiddleware : rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit admin users to 20 actions per minute
  message: {
    success: false,
    message: 'Too many admin actions, please slow down.',
    retryAfter: 60
  },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    const identifier = req.user ? `Admin: ${req.user._id}` : `IP: ${req.ip}`;
    logger.warn(`Admin action rate limit exceeded for ${identifier}`);
    res.status(429).json({
      success: false,
      message: 'Too many admin actions, please slow down.',
      retryAfter: 60
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderCreationLimiter,
  paymentLimiter,
  listingCreationLimiter,
  searchLimiter,
  adminActionLimiter
};
