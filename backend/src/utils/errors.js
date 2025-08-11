/**
 * Custom error classes for the P2P marketplace application
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized to access this resource') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 402);
  }
}

// Error response helper
const sendErrorResponse = (res, error) => {
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = null;

  // Handle custom app errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  
  // Handle validation errors (Joi)
  else if (error.name === 'ValidationError' && error.details) {
    statusCode = 400;
    message = 'Validation failed';
    errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }
  
  // Handle MongoDB duplicate key errors
  else if (error.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
    const field = Object.keys(error.keyValue)[0];
    errors = [{ field, message: `${field} already exists` }];
  }
  
  // Handle MongoDB cast errors
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }
  
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  return sendErrorResponse(res, err);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  PaymentError,
  sendErrorResponse,
  asyncHandler,
  errorHandler
};
