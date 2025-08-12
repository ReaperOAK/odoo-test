const Joi = require('joi');
const { logger } = require('../config/database');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      
      // Replace request data with validated/sanitized data
      req[source] = value;
      next();
      
    } catch (err) {
      logger.error('Validation middleware error:', err);
      return res.status(500).json({
        success: false,
        message: 'Validation failed'
      });
    }
  };
};

// Common validation schemas
const schemas = {
  // User registration
  userRegistration: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).max(128).required(),
    isHost: Joi.boolean().default(false),
    hostProfile: Joi.when('isHost', {
      is: true,
      then: Joi.object({
        displayName: Joi.string().trim().min(2).max(100),
        phone: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/),
        address: Joi.string().trim().max(500),
        bio: Joi.string().trim().max(1000)
      }),
      otherwise: Joi.forbidden()
    })
  }),
  
  // User login
  userLogin: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required()
  }),
  
  // User profile update
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    hostProfile: Joi.object({
      displayName: Joi.string().trim().max(100).allow(''),
      phone: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/).allow(''),
      address: Joi.string().trim().max(500).allow(''),
      bio: Joi.string().trim().max(1000).allow('')
    })
  }),
  
  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  }),
  
  // Become host
  becomeHost: Joi.object({
    hostProfile: Joi.object({
      displayName: Joi.string().trim().min(2).max(100),
      phone: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow(''),
      address: Joi.string().trim().max(500).allow(''),
      bio: Joi.string().trim().max(1000).allow('')
    }).required()
  }),
  
  // Listing creation
  listingCreation: Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    category: Joi.string().valid('electronics', 'vehicles', 'sports', 'music', 'tools', 'furniture', 'other').required(),
    unitType: Joi.string().valid('hour', 'day', 'week').default('day'),
    basePrice: Joi.number().min(1).max(1000000).required(),
    depositType: Joi.string().valid('flat', 'percent').default('percent'),
    depositValue: Joi.number().min(0).when('depositType', {
      is: 'percent',
      then: Joi.number().max(100),
      otherwise: Joi.number()
    }).default(20),
    totalQuantity: Joi.number().integer().min(1).max(1000).default(1),
    location: Joi.string().trim().min(2).max(200).required(),
    images: Joi.array().items(Joi.string().trim()).max(10).default([]),
    features: Joi.array().items(Joi.string().trim().max(100)).max(20).default([]),
    rules: Joi.array().items(Joi.string().trim().max(200)).max(10).default([]),
    status: Joi.string().valid('draft', 'published', 'disabled').default('published')
  }),
  
  // Listing update
  listingUpdate: Joi.object({
    title: Joi.string().trim().min(5).max(200),
    description: Joi.string().trim().min(10).max(2000),
    category: Joi.string().valid('electronics', 'vehicles', 'sports', 'music', 'tools', 'furniture', 'other'),
    unitType: Joi.string().valid('hour', 'day', 'week'),
    basePrice: Joi.number().min(1).max(1000000),
    depositType: Joi.string().valid('flat', 'percent'),
    depositValue: Joi.number().min(0).when('depositType', {
      is: 'percent',
      then: Joi.number().max(100),
      otherwise: Joi.number()
    }),
    totalQuantity: Joi.number().integer().min(1).max(1000),
    location: Joi.string().trim().min(2).max(200),
    images: Joi.array().items(Joi.string().uri()).max(10),
    features: Joi.array().items(Joi.string().trim().max(100)).max(20),
    rules: Joi.array().items(Joi.string().trim().max(200)).max(10),
    status: Joi.string().valid('draft', 'published', 'disabled')
  }),
  
  // Order creation
  orderCreation: Joi.object({
    lines: Joi.array().items(
      Joi.object({
        listingId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        qty: Joi.number().integer().min(1).max(1000).required(),
        start: Joi.date().iso().greater('now').required(),
        end: Joi.date().iso().greater(Joi.ref('start')).required()
      })
    ).min(1).max(10).required(),
    paymentOption: Joi.string().valid('deposit', 'full').default('deposit'),
    specialInstructions: Joi.string().trim().max(1000).allow('')
  }),
  
  // Availability check
  availabilityCheck: Joi.object({
    start: Joi.date().iso().greater('now').required(),
    end: Joi.date().iso().greater(Joi.ref('start')).required(),
    qty: Joi.number().integer().min(1).max(1000).default(1)
  }),
  
  // Reservation status update
  reservationStatusUpdate: Joi.object({
    status: Joi.string().valid('picked', 'active', 'returned', 'cancelled', 'disputed').required(),
    pickupNotes: Joi.string().trim().max(1000).allow(''),
    returnNotes: Joi.string().trim().max(1000).allow(''),
    damageReport: Joi.object({
      description: Joi.string().trim().max(2000).allow(''),
      cost: Joi.number().min(0),
      images: Joi.array().items(Joi.string().uri()).max(5)
    })
  }),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('createdAt', '-createdAt', 'name', '-name', 'price', '-price').default('-createdAt'),
    search: Joi.string().trim().max(100).allow(''),
    category: Joi.string().valid('electronics', 'vehicles', 'sports', 'music', 'tools', 'furniture', 'other'),
    location: Joi.string().trim().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    status: Joi.string().valid('draft', 'published', 'disabled', 'pending', 'paid', 'failed', 'refunded', 'quote', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')
  }),
  
  // MongoDB ObjectId
  objectId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),
  
  // Payment confirmation
  paymentConfirmation: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required()
  }),
  
  // Payout creation
  payoutCreation: Joi.object({
    hostId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    amount: Joi.number().min(0.01).required(),
    method: Joi.string().valid('manual', 'razorpay_payout', 'bank_transfer').default('manual'),
    description: Joi.string().trim().max(500).allow(''),
    bankDetails: Joi.when('method', {
      is: 'bank_transfer',
      then: Joi.object({
        accountNumber: Joi.string().required(),
        ifscCode: Joi.string().uppercase().required(),
        accountHolderName: Joi.string().required(),
        bankName: Joi.string().required()
      }).required(),
      otherwise: Joi.forbidden()
    })
  })
};

// Export validation middleware functions
module.exports = {
  validate,
  
  // User validations
  validateUserRegistration: validate(schemas.userRegistration),
  validateUserLogin: validate(schemas.userLogin),
  validateUpdateProfile: validate(schemas.updateProfile),
  validateChangePassword: validate(schemas.changePassword),
  validateBecomeHost: validate(schemas.becomeHost),
  
  // Listing validations
  validateListingCreation: validate(schemas.listingCreation),
  validateListingUpdate: validate(schemas.listingUpdate),
  
  // Order validations
  validateOrderCreation: validate(schemas.orderCreation),
  
  // Query validations
  validateAvailabilityCheck: validate(schemas.availabilityCheck, 'query'),
  validatePagination: validate(schemas.pagination, 'query'),
  validateObjectId: validate(schemas.objectId, 'params'),
  
  // Status update validations
  validateReservationStatusUpdate: validate(schemas.reservationStatusUpdate),
  
  // Payment validations
  validatePaymentConfirmation: validate(schemas.paymentConfirmation),
  
  // Payout validations
  validatePayoutCreation: validate(schemas.payoutCreation),
  
  // Export schemas for testing
  schemas
};
