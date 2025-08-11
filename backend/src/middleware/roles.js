const { logger } = require('../config/database');

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Access denied for user ${req.user._id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Check if user is host or admin
 */
const requireHost = requireRole(['host', 'admin']);

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwner - Function to get resource owner ID from request
 */
const requireOwnershipOrAdmin = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get resource owner ID
      const resourceOwnerId = await getResourceOwner(req);
      
      if (!resourceOwnerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      // Check if user owns the resource
      if (req.user._id.toString() !== resourceOwnerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only access your own resources'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Check if user can access listing (owner or admin)
 */
const requireListingOwnership = requireOwnershipOrAdmin(async (req) => {
  const Listing = require('../models/Listing');
  const listing = await Listing.findById(req.params.id);
  return listing?.ownerId;
});

/**
 * Check if user can access order (renter, host, or admin)
 */
const requireOrderAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }
    
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if user is renter or host
    const userId = req.user._id.toString();
    const isRenter = order.renterId.toString() === userId;
    const isHost = order.hostId.toString() === userId;
    
    if (!isRenter && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access orders you are involved in'
      });
    }
    
    // Attach order to request for use in controller
    req.order = order;
    next();
    
  } catch (error) {
    logger.error('Order access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed'
    });
  }
};

/**
 * Check if user is verified host
 */
const requireVerifiedHost = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user.isHost) {
      return res.status(403).json({
        success: false,
        message: 'Host account required'
      });
    }
    
    if (!req.user.hostProfile?.verified && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Verified host account required'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Verified host check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed'
    });
  }
};

module.exports = {
  requireRole,
  requireAdmin,
  requireHost,
  requireOwnershipOrAdmin,
  requireListingOwnership,
  requireOrderAccess,
  requireVerifiedHost
};
