const Order = require('../models/Order');
const User = require('../models/User');
const Payout = require('../models/Payout');
const { logger } = require('../config/database');

class PayoutService {
  /**
   * Calculate pending payout amount for a host
   * @param {string} hostId - Host user ID
   * @returns {Promise<number>} Pending payout amount
   */
  static async calculatePendingPayout(hostId) {
    try {
      // Find all completed orders where payment is successful but not yet paid out
      const orders = await Order.find({
        hostId,
        orderStatus: 'completed',
        paymentStatus: 'paid'
      });
      
      let totalEarnings = 0;
      
      orders.forEach(order => {
        const hostEarnings = order.subtotal - order.platformCommission;
        totalEarnings += hostEarnings;
      });
      
      // Subtract already processed payouts
      const processedPayouts = await Payout.find({
        hostId,
        status: { $in: ['processed', 'processing'] }
      });
      
      const alreadyPaid = processedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      return Math.max(0, totalEarnings - alreadyPaid);
      
    } catch (error) {
      logger.error('Error calculating pending payout:', error);
      throw error;
    }
  }
  
  /**
   * Create payout record for host
   * @param {string} hostId - Host user ID
   * @param {number} amount - Payout amount
   * @param {string} method - Payout method
   * @param {Object} additionalData - Additional payout data
   * @returns {Promise<Object>} Created payout
   */
  static async createPayout(hostId, amount, method = 'manual', additionalData = {}) {
    try {
      // Validate host exists and is a host
      const host = await User.findById(hostId);
      if (!host || !host.isHost) {
        throw new Error('Invalid host ID');
      }
      
      // Check if host has sufficient wallet balance
      if (host.walletBalance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ₹${host.walletBalance}, Requested: ₹${amount}`);
      }
      
      // Find orders that contribute to this payout
      const orders = await Order.find({
        hostId,
        orderStatus: 'completed',
        paymentStatus: 'paid'
      }).limit(20); // For tracking purposes
      
      const payout = new Payout({
        hostId,
        amount,
        method,
        orderIds: orders.map(order => order._id),
        description: additionalData.description || `Payout for completed orders`,
        bankDetails: additionalData.bankDetails,
        status: 'pending'
      });
      
      await payout.save();
      
      logger.info(`Payout created: ${payout._id} for host: ${hostId}, amount: ₹${amount}`);
      
      return payout;
      
    } catch (error) {
      logger.error('Error creating payout:', error);
      throw error;
    }
  }
  
  /**
   * Process manual payout (mock for demo)
   * @param {string} payoutId - Payout ID
   * @param {string} processedBy - Admin user ID
   * @param {Object} additionalData - Additional processing data
   * @returns {Promise<Object>} Updated payout
   */
  static async processManualPayout(payoutId, processedBy, additionalData = {}) {
    try {
      const payout = await Payout.findById(payoutId).populate('hostId');
      if (!payout) {
        throw new Error('Payout not found');
      }
      
      if (payout.status !== 'pending') {
        throw new Error(`Cannot process payout with status: ${payout.status}`);
      }
      
      // In demo mode, we'll mark as processed immediately
      payout.markAsProcessed(processedBy, additionalData.notes || 'Manual payout processed');
      
      // Simulate processing delay in demo mode
      if (process.env.DEMO_MODE === 'true') {
        payout.status = 'processing';
        await payout.save();
        
        // Simulate async processing (in real implementation, this would be actual bank transfer)
        setTimeout(async () => {
          try {
            payout.status = 'processed';
            await payout.save();
            logger.info(`Demo payout completed: ${payoutId}`);
          } catch (error) {
            logger.error('Error completing demo payout:', error);
          }
        }, 2000);
      } else {
        await payout.save();
      }
      
      logger.info(`Payout processed: ${payoutId} by admin: ${processedBy}`);
      
      return payout;
      
    } catch (error) {
      logger.error('Error processing manual payout:', error);
      throw error;
    }
  }
  
  /**
   * Get payout statistics for admin dashboard
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Payout statistics
   */
  static async getPayoutStatistics(startDate, endDate) {
    try {
      const stats = await Payout.getStats(startDate, endDate);
      
      // Get pending payouts count and amount
      const pendingPayouts = await Payout.find({ status: 'pending' });
      const pendingAmount = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Get host count with pending payouts
      const hostsWithPendingPayouts = [...new Set(pendingPayouts.map(p => p.hostId.toString()))].length;
      
      return {
        byStatus: stats,
        pending: {
          count: pendingPayouts.length,
          amount: pendingAmount,
          hostsCount: hostsWithPendingPayouts
        },
        summary: {
          totalProcessed: stats.find(s => s._id === 'processed')?.totalAmount || 0,
          totalPending: pendingAmount,
          totalFailed: stats.find(s => s._id === 'failed')?.totalAmount || 0
        }
      };
      
    } catch (error) {
      logger.error('Error getting payout statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get host payout history
   * @param {string} hostId - Host user ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Payout history with pagination
   */
  static async getHostPayoutHistory(hostId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const payouts = await Payout.find({ hostId })
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Payout.countDocuments({ hostId });
      
      return {
        payouts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      logger.error('Error getting host payout history:', error);
      throw error;
    }
  }
  
  /**
   * Bulk process payouts for multiple hosts
   * @param {Array} payoutIds - Array of payout IDs
   * @param {string} processedBy - Admin user ID
   * @returns {Promise<Object>} Bulk processing results
   */
  static async bulkProcessPayouts(payoutIds, processedBy) {
    try {
      const results = {
        success: [],
        failed: []
      };
      
      for (const payoutId of payoutIds) {
        try {
          const payout = await this.processManualPayout(payoutId, processedBy);
          results.success.push({ payoutId, payout });
        } catch (error) {
          results.failed.push({ payoutId, error: error.message });
        }
      }
      
      logger.info(`Bulk payout processing completed. Success: ${results.success.length}, Failed: ${results.failed.length}`);
      
      return results;
      
    } catch (error) {
      logger.error('Error in bulk payout processing:', error);
      throw error;
    }
  }
  
  /**
   * Auto-generate payouts for hosts with completed orders
   * @param {number} minimumAmount - Minimum amount to generate payout
   * @returns {Promise<Array>} Generated payouts
   */
  static async autoGeneratePayouts(minimumAmount = 500) {
    try {
      // Find hosts with completed orders that haven't been paid out
      const hosts = await User.find({ 
        isHost: true, 
        walletBalance: { $gte: minimumAmount } 
      });
      
      const generatedPayouts = [];
      
      for (const host of hosts) {
        try {
          const pendingAmount = await this.calculatePendingPayout(host._id);
          
          if (pendingAmount >= minimumAmount) {
            const payout = await this.createPayout(
              host._id,
              pendingAmount,
              'manual',
              { description: 'Auto-generated payout for completed orders' }
            );
            
            generatedPayouts.push(payout);
          }
        } catch (error) {
          logger.error(`Error generating payout for host ${host._id}:`, error);
        }
      }
      
      logger.info(`Auto-generated ${generatedPayouts.length} payouts`);
      
      return generatedPayouts;
      
    } catch (error) {
      logger.error('Error in auto-generating payouts:', error);
      throw error;
    }
  }
}

module.exports = PayoutService;
