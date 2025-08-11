const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { logger } = require('../config/database');
const config = require('../config');

class RazorpayService {
  constructor() {
    if (config.PAYMENT_MODE === 'mock') {
      this.razorpay = null;
      logger.info('Razorpay service initialized in MOCK mode');
    } else {
      this.razorpay = new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET
      });
      logger.info('Razorpay service initialized in LIVE mode');
    }
  }
  
  /**
   * Create Razorpay order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Razorpay order response
   */
  async createOrder(orderData) {
    try {
      const { orderId, amount, currency = 'INR', receipt } = orderData;
      
      if (config.PAYMENT_MODE === 'mock') {
        return this.createMockOrder(orderData);
      }
      
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receipt || `order_${orderId}`,
        payment_capture: 1
      });
      
      // Create payment record
      const payment = new Payment({
        orderId,
        amount,
        currency,
        method: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
        status: 'initiated',
        gateway: 'razorpay',
        gatewayResponse: razorpayOrder
      });
      
      await payment.save();
      
      logger.info(`Razorpay order created: ${razorpayOrder.id} for order: ${orderId}`);
      
      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        payment: payment
      };
      
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }
  
  /**
   * Create mock order for demo/testing
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Mock order response
   */
  async createMockOrder(orderData) {
    const { orderId, amount, currency = 'INR' } = orderData;
    
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create payment record
    const payment = new Payment({
      orderId,
      amount,
      currency,
      method: 'mock',
      razorpayOrderId: mockOrderId,
      status: 'initiated',
      gateway: 'mock',
      gatewayResponse: {
        id: mockOrderId,
        amount: amount * 100,
        currency,
        receipt: `mock_receipt_${orderId}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      }
    });
    
    await payment.save();
    
    logger.info(`Mock order created: ${mockOrderId} for order: ${orderId}`);
    
    return {
      id: mockOrderId,
      amount: amount * 100,
      currency,
      receipt: `mock_receipt_${orderId}`,
      status: 'created',
      payment: payment
    };
  }
  
  /**
   * Verify payment signature
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @returns {boolean} Verification result
   */
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (config.PAYMENT_MODE === 'mock') {
      // In mock mode, always return true for testing
      return true;
    }
    
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      return expectedSignature === razorpaySignature;
    } catch (error) {
      logger.error('Error verifying payment signature:', error);
      return false;
    }
  }
  
  /**
   * Verify webhook signature
   * @param {string} webhookBody - Webhook payload body
   * @param {string} webhookSignature - Webhook signature
   * @returns {boolean} Verification result
   */
  verifyWebhookSignature(webhookBody, webhookSignature) {
    if (config.PAYMENT_MODE === 'mock') {
      return true;
    }
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookBody)
        .digest('hex');
      
      return expectedSignature === webhookSignature;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
  
  /**
   * Process successful payment
   * @param {Object} paymentData - Payment data from Razorpay
   * @returns {Promise<Object>} Updated payment and order
   */
  async processSuccessfulPayment(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      // Find payment record
      const payment = await Payment.findByRazorpayOrderId(razorpay_order_id);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      // Verify signature (skip for mock payments)
      if (payment.method !== 'mock') {
        const isValidSignature = this.verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
        
        if (!isValidSignature) {
          throw new Error('Invalid payment signature');
        }
      }
      
      // Update payment record
      payment.status = 'success';
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      await payment.save();
      
      // Get and update order
      const order = await Order.findById(payment.orderId)
        .populate('renterId', 'name email')
        .populate('hostId', 'name email hostProfile.displayName');
      
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.addTimelineEntry('payment_success', order.renterId._id, `Payment successful: ₹${payment.amount}`);
        await order.save();
        
        // Update host wallet balance
        await this.updateHostWallet(order);
      }
      
      logger.info(`Payment processed successfully: ${razorpay_payment_id}`);
      
      return { payment, order };
      
    } catch (error) {
      logger.error('Error processing successful payment:', error);
      throw error;
    }
  }
  
  /**
   * Process mock payment success (for demo mode)
   * @param {string} mockOrderId - Mock order ID
   * @returns {Promise<Object>} Updated payment and order
   */
  async processMockPaymentSuccess(mockOrderId) {
    try {
      const payment = await Payment.findByRazorpayOrderId(mockOrderId);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Update payment record
      payment.status = 'success';
      payment.razorpayPaymentId = mockPaymentId;
      payment.razorpaySignature = 'mock_signature';
      await payment.save();
      
      // Get and update order
      const order = await Order.findById(payment.orderId)
        .populate('renterId', 'name email')
        .populate('hostId', 'name email hostProfile.displayName');
      
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.addTimelineEntry('payment_success', order.renterId._id, `Mock payment successful: ₹${payment.amount}`);
        await order.save();
        
        // Update host wallet balance
        await this.updateHostWallet(order);
      }
      
      logger.info(`Mock payment processed successfully: ${mockPaymentId}`);
      
      return { payment, order };
      
    } catch (error) {
      logger.error('Error processing mock payment:', error);
      throw error;
    }
  }
  
  /**
   * Update host wallet balance after successful payment
   * @param {Object} order - Order object
   */
  async updateHostWallet(order) {
    try {
      const User = require('../models/User');
      const host = await User.findById(order.hostId);
      
      if (host) {
        const hostEarnings = order.subtotal - order.platformCommission;
        host.walletBalance += hostEarnings;
        await host.save();
        
        logger.info(`Host wallet updated: ${host._id}, amount: ₹${hostEarnings}`);
      }
    } catch (error) {
      logger.error('Error updating host wallet:', error);
    }
  }
  
  /**
   * Process payment failure
   * @param {Object} paymentData - Payment failure data
   * @returns {Promise<Object>} Updated payment and order
   */
  async processFailedPayment(paymentData) {
    try {
      const { razorpay_order_id, error } = paymentData;
      
      const payment = await Payment.findByRazorpayOrderId(razorpay_order_id);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      // Update payment record
      payment.status = 'failed';
      payment.failureReason = error?.description || 'Payment failed';
      await payment.save();
      
      // Update order
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'failed';
        order.addTimelineEntry('payment_failed', null, payment.failureReason);
        await order.save();
      }
      
      logger.info(`Payment failed: ${razorpay_order_id}, reason: ${payment.failureReason}`);
      
      return { payment, order };
      
    } catch (error) {
      logger.error('Error processing failed payment:', error);
      throw error;
    }
  }
  
  /**
   * Handle webhook events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhook(event) {
    try {
      const { event: eventType, payload } = event;
      
      switch (eventType) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(payload.payment.entity);
          
        case 'payment.failed':
          return await this.handlePaymentFailed(payload.payment.entity);
          
        default:
          logger.info(`Unhandled webhook event: ${eventType}`);
          return { success: true, message: 'Event acknowledged' };
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }
  
  /**
   * Handle payment captured webhook
   * @param {Object} paymentEntity - Payment entity from webhook
   */
  async handlePaymentCaptured(paymentEntity) {
    const { id: paymentId, order_id: orderId, amount, status } = paymentEntity;
    
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (payment && payment.status !== 'success') {
      payment.status = 'success';
      payment.razorpayPaymentId = paymentId;
      payment.markWebhookReceived('webhook_signature', paymentEntity);
      await payment.save();
      
      logger.info(`Webhook processed - Payment captured: ${paymentId}`);
    }
    
    return { success: true, paymentId };
  }
  
  /**
   * Handle payment failed webhook
   * @param {Object} paymentEntity - Payment entity from webhook
   */
  async handlePaymentFailed(paymentEntity) {
    const { id: paymentId, order_id: orderId, error_description } = paymentEntity;
    
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.failureReason = error_description || 'Payment failed';
      payment.markWebhookReceived('webhook_signature', paymentEntity);
      await payment.save();
      
      logger.info(`Webhook processed - Payment failed: ${paymentId}`);
    }
    
    return { success: true, paymentId };
  }
}

// Export singleton instance
module.exports = new RazorpayService();
