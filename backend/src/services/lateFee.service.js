const LateFee = require('../models/LateFee');
const LateFeeConfig = require('../models/LateFeeConfig');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');

class LateFeeService {
  
  /**
   * Process all overdue items and apply late fees
   */
  static async processOverdueItems() {
    try {
      logger.info('Starting automatic late fee processing...');
      
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0,
        notifications: 0
      };
      
      // Get overdue orders
      const { overduePayments, overdueReturns } = await LateFee.findOverdueOrders();
      
      // Process overdue payments
      for (const order of overduePayments) {
        try {
          await this.processOverduePayment(order);
          results.processed++;
        } catch (error) {
          logger.error(`Error processing overdue payment for order ${order._id}:`, error);
          results.errors++;
        }
      }
      
      // Process overdue returns
      for (const order of overdueReturns) {
        try {
          await this.processOverdueReturn(order);
          results.processed++;
        } catch (error) {
          logger.error(`Error processing overdue return for order ${order._id}:`, error);
          results.errors++;
        }
      }
      
      // Update existing active late fees
      const activeFees = await LateFee.findActive();
      for (const fee of activeFees) {
        try {
          const wasUpdated = await fee.updateAmount();
          if (wasUpdated) results.updated++;
        } catch (error) {
          logger.error(`Error updating late fee ${fee._id}:`, error);
          results.errors++;
        }
      }
      
      logger.info('Late fee processing completed:', results);
      return results;
      
    } catch (error) {
      logger.error('Error in processOverdueItems:', error);
      throw error;
    }
  }
  
  /**
   * Process overdue payment
   */
  static async processOverduePayment(order) {
    const config = await LateFeeConfig.getApplicableConfig('payment_overdue', order);
    if (!config || !config.autoApply) return;
    
    // Check if late fee already exists
    const existingFee = await LateFee.findOne({
      orderId: order._id,
      type: 'payment_overdue',
      status: { $in: ['active', 'disputed'] }
    });
    
    if (existingFee) {
      return await existingFee.updateAmount();
    }
    
    // Calculate days overdue
    const dueDate = new Date(Math.max(...order.lines.map(line => new Date(line.end))));
    const now = new Date();
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysOverdue <= config.gracePeriodDays) return;
    
    // Create new late fee
    const amount = config.calculateFee(order, daysOverdue);
    
    const lateFee = new LateFee({
      orderId: order._id,
      renterId: order.renterId._id,
      hostId: order.hostId._id,
      type: 'payment_overdue',
      baseAmount: config.baseAmount,
      dailyRate: config.dailyRate,
      maxAmount: config.maxAmount,
      currentAmount: amount,
      daysOverdue: daysOverdue,
      dueDate: dueDate,
      description: `Late payment fee for order ${order._id.toString().slice(-8)}`,
      reason: `Payment overdue by ${daysOverdue} days`,
      autoApplied: true
    });
    
    await lateFee.save();
    
    // Send notifications
    await this.sendLateFeeNotification(lateFee, 'applied');
    
    logger.info(`Applied late payment fee of ₹${amount} to order ${order._id}`);
    return lateFee;
  }
  
  /**
   * Process overdue return
   */
  static async processOverdueReturn(order) {
    const config = await LateFeeConfig.getApplicableConfig('return_overdue', order);
    if (!config || !config.autoApply) return;
    
    // Check if late fee already exists
    const existingFee = await LateFee.findOne({
      orderId: order._id,
      type: 'return_overdue',
      status: { $in: ['active', 'disputed'] }
    });
    
    if (existingFee) {
      return await existingFee.updateAmount();
    }
    
    // Calculate days overdue
    const dueDate = new Date(Math.max(...order.lines.map(line => new Date(line.end))));
    const now = new Date();
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysOverdue <= config.gracePeriodDays) return;
    
    // Create new late fee
    const amount = config.calculateFee(order, daysOverdue);
    
    const lateFee = new LateFee({
      orderId: order._id,
      renterId: order.renterId._id,
      hostId: order.hostId._id,
      type: 'return_overdue',
      baseAmount: config.baseAmount,
      dailyRate: config.dailyRate,
      maxAmount: config.maxAmount,
      currentAmount: amount,
      daysOverdue: daysOverdue,
      dueDate: dueDate,
      description: `Late return fee for order ${order._id.toString().slice(-8)}`,
      reason: `Item return overdue by ${daysOverdue} days`,
      autoApplied: true
    });
    
    await lateFee.save();
    
    // Send notifications
    await this.sendLateFeeNotification(lateFee, 'applied');
    
    logger.info(`Applied late return fee of ₹${amount} to order ${order._id}`);
    return lateFee;
  }
  
  /**
   * Create custom late fee
   */
  static async createCustomLateFee(data) {
    const { orderId, type, amount, reason, createdBy } = data;
    
    const order = await Order.findById(orderId).populate('renterId hostId');
    if (!order) {
      throw new Error('Order not found');
    }
    
    const lateFee = new LateFee({
      orderId: order._id,
      renterId: order.renterId._id,
      hostId: order.hostId._id,
      type: type || 'custom',
      baseAmount: amount,
      dailyRate: 0,
      maxAmount: amount,
      currentAmount: amount,
      daysOverdue: 0,
      dueDate: new Date(),
      description: `Custom late fee for order ${order._id.toString().slice(-8)}`,
      reason: reason,
      autoApplied: false,
      metadata: { createdBy }
    });
    
    await lateFee.save();
    
    // Send notifications
    await this.sendLateFeeNotification(lateFee, 'applied');
    
    logger.info(`Created custom late fee of ₹${amount} for order ${order._id}`);
    return lateFee;
  }
  
  /**
   * Waive late fee
   */
  static async waiveLateFee(lateFeeId, reason, waivedBy) {
    const lateFee = await LateFee.findById(lateFeeId);
    if (!lateFee) {
      throw new Error('Late fee not found');
    }
    
    if (lateFee.status !== 'active') {
      throw new Error('Late fee is not active and cannot be waived');
    }
    
    await lateFee.waive(reason, waivedBy);
    
    // Send notifications
    await this.sendLateFeeNotification(lateFee, 'waived');
    
    logger.info(`Waived late fee ${lateFeeId} by ${waivedBy}`);
    return lateFee;
  }
  
  /**
   * Mark late fee as paid
   */
  static async markLateFeeAsPaid(lateFeeId) {
    const lateFee = await LateFee.findById(lateFeeId);
    if (!lateFee) {
      throw new Error('Late fee not found');
    }
    
    await lateFee.markPaid();
    
    // Send notifications
    await this.sendLateFeeNotification(lateFee, 'paid');
    
    logger.info(`Marked late fee ${lateFeeId} as paid`);
    return lateFee;
  }
  
  /**
   * Send late fee notifications
   */
  static async sendLateFeeNotification(lateFee, type) {
    try {
      const order = await Order.findById(lateFee.orderId);
      const renter = await User.findById(lateFee.renterId);
      const host = await User.findById(lateFee.hostId);
      
      const notification = {
        type: type,
        method: 'email', // This would integrate with your notification service
        recipient: lateFee.renterId
      };
      
      lateFee.notifications.push(notification);
      await lateFee.save();
      
      // Here you would integrate with your actual notification service
      // For now, just log the notification
      logger.info(`Sent ${type} notification for late fee ${lateFee._id} to user ${renter.email}`);
      
      return true;
    } catch (error) {
      logger.error(`Error sending late fee notification:`, error);
      return false;
    }
  }
  
  /**
   * Get late fees for a user
   */
  static async getLateFees(userId, filters = {}) {
    const query = {
      $or: [
        { renterId: userId },
        { hostId: userId }
      ]
    };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.orderId) {
      query.orderId = filters.orderId;
    }
    
    return await LateFee.find(query)
      .populate('orderId renterId hostId')
      .sort({ createdAt: -1 });
  }
  
  /**
   * Get late fee statistics
   */
  static async getLateFeeStats(filters = {}) {
    const matchStage = {};
    
    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
    }
    
    const stats = await LateFee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFees: { $sum: 1 },
          totalAmount: { $sum: '$currentAmount' },
          activeFees: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          paidFees: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          waivedFees: {
            $sum: { $cond: [{ $eq: ['$status', 'waived'] }, 1, 0] }
          },
          avgAmount: { $avg: '$currentAmount' },
          avgDaysOverdue: { $avg: '$daysOverdue' }
        }
      }
    ]);
    
    return stats[0] || {
      totalFees: 0,
      totalAmount: 0,
      activeFees: 0,
      paidFees: 0,
      waivedFees: 0,
      avgAmount: 0,
      avgDaysOverdue: 0
    };
  }
  
  /**
   * Initialize default late fee configurations
   */
  static async initializeDefaultConfigs() {
    try {
      // Payment overdue config
      const paymentConfig = await LateFeeConfig.findOne({ type: 'payment_overdue', isDefault: true });
      if (!paymentConfig) {
        await new LateFeeConfig({
          name: 'Default Payment Overdue',
          type: 'payment_overdue',
          gracePeriodDays: 1,
          baseAmount: 50,
          dailyRate: 25,
          maxAmount: 500,
          calculationMethod: 'fixed',
          description: 'Default late fee for overdue payments',
          isDefault: true,
          autoApply: true
        }).save();
        logger.info('Created default payment overdue configuration');
      }
      
      // Return overdue config
      const returnConfig = await LateFeeConfig.findOne({ type: 'return_overdue', isDefault: true });
      if (!returnConfig) {
        await new LateFeeConfig({
          name: 'Default Return Overdue',
          type: 'return_overdue',
          gracePeriodDays: 0,
          baseAmount: 100,
          dailyRate: 50,
          maxAmount: 1000,
          calculationMethod: 'fixed',
          description: 'Default late fee for overdue item returns',
          isDefault: true,
          autoApply: true
        }).save();
        logger.info('Created default return overdue configuration');
      }
      
    } catch (error) {
      logger.error('Error initializing default late fee configurations:', error);
    }
  }
}

module.exports = LateFeeService;
