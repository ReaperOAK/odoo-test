const LateFeeService = require('../services/lateFee.service');
const LateFee = require('../models/LateFee');
const LateFeeConfig = require('../models/LateFeeConfig');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Get late fees for current user
 */
const getMyLateFees = async (req, res, next) => {
  try {
    const { status, type, orderId } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (orderId) filters.orderId = orderId;
    
    const lateFees = await LateFeeService.getLateFees(req.user.id, filters);
    
    res.json({
      success: true,
      data: {
        lateFees,
        total: lateFees.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all late fees (admin only)
 */
const getAllLateFees = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, renterId, hostId, orderId } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (renterId) query.renterId = renterId;
    if (hostId) query.hostId = hostId;
    if (orderId) query.orderId = orderId;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['orderId', 'renterId', 'hostId'],
      sort: { createdAt: -1 }
    };
    
    const lateFees = await LateFee.find(query)
      .populate('orderId renterId hostId')
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);
    
    const total = await LateFee.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        lateFees,
        total,
        page: options.page,
        pages: Math.ceil(total / options.limit),
        limit: options.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get late fee by ID
 */
const getLateFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lateFee = await LateFee.findById(id)
      .populate('orderId renterId hostId waivedBy');
    
    if (!lateFee) {
      throw new AppError('Late fee not found', 404);
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && 
        req.user.id !== lateFee.renterId.toString() && 
        req.user.id !== lateFee.hostId.toString()) {
      throw new AppError('Access denied', 403);
    }
    
    res.json({
      success: true,
      data: { lateFee }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create custom late fee (admin only)
 */
const createCustomLateFee = async (req, res, next) => {
  try {
    const { orderId, type, amount, reason } = req.body;
    
    if (!orderId || !amount || !reason) {
      throw new AppError('Order ID, amount, and reason are required', 400);
    }
    
    const lateFee = await LateFeeService.createCustomLateFee({
      orderId,
      type: type || 'custom',
      amount,
      reason,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: { lateFee },
      message: 'Custom late fee created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Waive late fee (admin only)
 */
const waiveLateFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      throw new AppError('Waiver reason is required', 400);
    }
    
    const lateFee = await LateFeeService.waiveLateFee(id, reason, req.user.id);
    
    res.json({
      success: true,
      data: { lateFee },
      message: 'Late fee waived successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark late fee as paid
 */
const markLateFeeAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lateFee = await LateFeeService.markLateFeeAsPaid(id);
    
    res.json({
      success: true,
      data: { lateFee },
      message: 'Late fee marked as paid successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process overdue items manually (admin only)
 */
const processOverdueItems = async (req, res, next) => {
  try {
    const results = await LateFeeService.processOverdueItems();
    
    res.json({
      success: true,
      data: results,
      message: 'Overdue items processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get late fee statistics (admin only)
 */
const getLateFeeStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const stats = await LateFeeService.getLateFeeStats(filters);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get late fee configurations (admin only)
 */
const getLateFeeConfigs = async (req, res, next) => {
  try {
    const configs = await LateFeeConfig.find().sort({ type: 1, priority: -1 });
    
    res.json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create late fee configuration (admin only)
 */
const createLateFeeConfig = async (req, res, next) => {
  try {
    const config = new LateFeeConfig(req.body);
    await config.save();
    
    res.status(201).json({
      success: true,
      data: { config },
      message: 'Late fee configuration created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('Configuration name already exists', 400);
    }
    next(error);
  }
};

/**
 * Update late fee configuration (admin only)
 */
const updateLateFeeConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const config = await LateFeeConfig.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!config) {
      throw new AppError('Configuration not found', 404);
    }
    
    res.json({
      success: true,
      data: { config },
      message: 'Late fee configuration updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete late fee configuration (admin only)
 */
const deleteLateFeeConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const config = await LateFeeConfig.findByIdAndDelete(id);
    
    if (!config) {
      throw new AppError('Configuration not found', 404);
    }
    
    res.json({
      success: true,
      message: 'Late fee configuration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update late fee amount manually (for existing fees)
 */
const updateLateFeeAmount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lateFee = await LateFee.findById(id);
    if (!lateFee) {
      throw new AppError('Late fee not found', 404);
    }
    
    if (lateFee.status !== 'active') {
      throw new AppError('Can only update active late fees', 400);
    }
    
    await lateFee.updateAmount();
    
    res.json({
      success: true,
      data: { lateFee },
      message: 'Late fee amount updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLateFees,
  getAllLateFees,
  getLateFeeById,
  createCustomLateFee,
  waiveLateFee,
  markLateFeeAsPaid,
  processOverdueItems,
  getLateFeeStats,
  getLateFeeConfigs,
  createLateFeeConfig,
  updateLateFeeConfig,
  deleteLateFeeConfig,
  updateLateFeeAmount
};
