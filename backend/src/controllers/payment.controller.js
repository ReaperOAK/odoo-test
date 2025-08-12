const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const PolarService = require('../services/polar.service');
const emailService = require('../services/email.service');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Handle Polar webhook
 */
const handlePolarWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-polar-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValidSignature = PolarService.validateWebhookSignature(
      webhookBody,
      webhookSignature,
      process.env.POLAR_WEBHOOK_SECRET
    );

    if (!isValidSignature && process.env.PAYMENT_MODE !== 'mock') {
      logger.warn('Invalid webhook signature', { signature: webhookSignature });
      return next(new AppError('Invalid webhook signature', 400));
    }

    const event = req.body;

    logger.info('Received Polar webhook', { 
      type: event.type, 
      sessionId: event.data?.id 
    });

    const result = await PolarService.processWebhookEvent(event);

    switch (result.type) {
      case 'checkout_completed':
        await handleCheckoutCompleted(result);
        break;
      case 'payment_succeeded':
        await handlePaymentSucceeded(result);
        break;
      case 'payment_failed':
        await handlePaymentFailed(result);
        break;
      case 'refund_created':
        await handleRefundCreated(result);
        break;
      default:
        logger.info('Unhandled webhook event', { type: result.type });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    next(error);
  }
};

/**
 * Handle successful checkout completion
 */
const handleCheckoutCompleted = async (result) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Find payment record
      const payment = await Payment.findOne({
        polarSessionId: result.sessionId
      }).session(session);

      if (!payment) {
        logger.warn('Payment record not found for webhook', { sessionId: result.sessionId });
        return;
      }

      // Update payment status
      payment.status = 'success';
      payment.polarPaymentId = result.sessionId;
      payment.raw = result;
      await payment.save({ session });

      // Find and update order
      const order = await Order.findById(payment.orderId).session(session);
      if (!order) {
        logger.warn('Order not found for payment', { orderId: payment.orderId });
        return;
      }

      // Update order status
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      await order.save({ session });

      // Update host wallet balance
      const host = await User.findById(order.hostId).session(session);
      if (host) {
        const hostEarnings = order.subtotal - order.platformCommission;
        host.walletBalance += hostEarnings;
        await host.save({ session });
      }

      await Reservation.updateMany(
        { orderId: order._id },
        { status: 'reserved' },
        { session }
      );

      logger.info('Payment processed successfully via webhook', {
        orderId: order._id,
        paymentId: payment._id,
        amount: payment.amount
      });

      // Send payment confirmation email outside of transaction (non-blocking)
      setImmediate(async () => {
        try {
          const populatedOrder = await Order.findById(order._id)
            .populate('renterId', 'name email');
          
          if (populatedOrder && populatedOrder.renterId) {
            await emailService.sendPaymentConfirmation(populatedOrder, payment, populatedOrder.renterId);
          }
        } catch (error) {
          logger.error('Failed to send payment confirmation email:', error);
        }
      });
    });
  } catch (error) {
    logger.error('Error processing checkout completion:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (result) => {
  try {
    // Find payment record
    const payment = await Payment.findOne({
      polarSessionId: result.sessionId || result.paymentId
    });

    if (!payment) {
      logger.warn('Payment record not found for succeeded payment', { 
        sessionId: result.sessionId,
        paymentId: result.paymentId 
      });
      return;
    }

    // Update payment status if not already succeeded
    if (payment.status !== 'success') {
      payment.status = 'success';
      payment.polarPaymentId = result.paymentId;
      payment.raw = result;
      await payment.save();

      logger.info('Payment success processed via webhook', {
        orderId: payment.orderId,
        paymentId: payment._id,
        amount: payment.amount
      });
    }
  } catch (error) {
    logger.error('Error processing payment success:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (result) => {
  try {
    // Find payment record
    const payment = await Payment.findOne({
      polarSessionId: result.sessionId || result.paymentId
    });

    if (!payment) {
      logger.warn('Payment record not found for failed payment', { 
        sessionId: result.sessionId,
        paymentId: result.paymentId 
      });
      return;
    }

    // Update payment status
    payment.status = 'failed';
    payment.polarPaymentId = result.paymentId;
    payment.raw = result;
    await payment.save();

    // Find and update order
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'failed';
      await order.save();
    }

    logger.info('Payment failure processed via webhook', {
      orderId: order?._id,
      paymentId: payment._id,
      error: result.error
    });
  } catch (error) {
    logger.error('Error processing payment failure:', error);
    throw error;
  }
};

/**
 * Handle refund created event
 */
const handleRefundCreated = async (result) => {
  try {
    // Find payment record
    const payment = await Payment.findOne({
      polarPaymentId: result.paymentId
    });

    if (!payment) {
      logger.warn('Payment record not found for refund', { paymentId: result.paymentId });
      return;
    }

    // Create refund record or update existing one
    payment.refundId = result.refundId;
    payment.refundAmount = result.amount / 100; // Convert from cents
    payment.refundStatus = result.status;
    await payment.save();

    logger.info('Refund processed via webhook', {
      orderId: payment.orderId,
      paymentId: payment._id,
      refundId: result.refundId,
      amount: result.amount
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Get payment history for order
 */
const getOrderPayments = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    // Check if order exists and user has access
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const isRenter = req.user.id === order.renterId.toString();
    const isHost = req.user.id === order.hostId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isHost && !isAdmin) {
      return next(new AppError('Not authorized to view payments for this order', 403));
    }

    // Get payments
    const payments = await Payment.find({ orderId })
      .sort({ createdAt: -1 })
      .select('-raw'); // Exclude raw payment data for security

    logger.info(`Fetched ${payments.length} payments for order ${orderId}`, { userId: req.user.id });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    logger.error('Error fetching order payments:', error);
    next(error);
  }
};

/**
 * Get payment details by ID
 */
const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid payment ID', 400));
    }

    const payment = await Payment.findById(id)
      .populate({
        path: 'orderId',
        populate: {
          path: 'renterId hostId',
          select: 'name email'
        }
      });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Check access permissions
    const isRenter = req.user.id === payment.orderId.renterId._id.toString();
    const isHost = req.user.id === payment.orderId.hostId._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isHost && !isAdmin) {
      return next(new AppError('Not authorized to view this payment', 403));
    }

    // Remove sensitive data based on user role
    const paymentData = payment.toObject();
    if (!isAdmin) {
      delete paymentData.raw;
    }

    logger.info(`Fetched payment ${id}`, { userId: req.user.id });

    res.json({
      success: true,
      data: { payment: paymentData }
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    next(error);
  }
};

/**
 * Retry failed payment
 */
const retryPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid payment ID', 400));
    }

    const payment = await Payment.findById(id).populate('orderId');
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Check if user is the renter
    if (payment.orderId.renterId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to retry this payment', 403));
    }

    // Check if payment can be retried
    if (payment.status !== 'failed') {
      return next(new AppError('Only failed payments can be retried', 400));
    }

    // Create new payment attempt
    const checkoutData = await PolarService.createCheckoutSession({
      orderId: payment.orderId._id.toString(),
      customerId: req.user.id,
      customerEmail: req.user.email,
      listingId: payment.orderId.lines[0]?.listingId,
      productName: `Retry Payment - Order ${payment.orderId._id}`,
      total: payment.amount
    });

    // Create new payment record
    const newPayment = new Payment({
      orderId: payment.orderId._id,
      amount: payment.amount,
      method: payment.method,
      polarSessionId: checkoutData.id,
      status: 'initiated'
    });
    await newPayment.save();

    // Update order with new Polar session ID
    payment.orderId.polarSessionId = checkoutData.id;
    await payment.orderId.save();

    logger.info(`Created retry payment for order ${payment.orderId._id}`, {
      userId: req.user.id,
      originalPaymentId: id,
      newPaymentId: newPayment._id
    });

    res.json({
      success: true,
      data: {
        paymentId: newPayment._id,
        sessionId: checkoutData.id,
        checkoutUrl: checkoutData.url,
        amount: payment.amount,
        currency: checkoutData.currency
      }
    });
  } catch (error) {
    logger.error('Error retrying payment:', error);
    next(error);
  }
};

/**
 * Mock payment success (for demo mode)
 */
const mockPaymentSuccess = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Only allow in mock mode
    if (process.env.PAYMENT_MODE !== 'mock') {
      return next(new AppError('Mock payments only allowed in demo mode', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the renter
    if (order.renterId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to mock payment for this order', 403));
    }

    // Create mock payment success
    const mockPaymentId = `mock_pay_${Date.now()}`;
    const mockOrderId = `mock_order_${Date.now()}`;

    // Start transaction
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Create/update payment record
        let payment = await Payment.findOne({ orderId }).session(session);
        if (!payment) {
          payment = new Payment({
            orderId,
            amount: order.totalAmount,
            method: 'mock',
            razorpayOrderId: mockOrderId,
            status: 'initiated'
          });
        }

        payment.status = 'success';
        payment.polarPaymentId = mockPaymentId;
        await payment.save({ session });

        // Update order
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.polarSessionId = mockOrderId;
        await order.save({ session });

        // Update host wallet
        const host = await User.findById(order.hostId).session(session);
        if (host) {
          const hostEarnings = order.subtotal - order.platformCommission;
          host.walletBalance += hostEarnings;
          await host.save({ session });
        }

        // Update reservations
        await Reservation.updateMany(
          { orderId },
          { status: 'reserved' },
          { session }
        );
      });

      logger.info(`Mock payment processed for order ${orderId}`, {
        userId: req.user.id,
        amount: order.totalAmount
      });

      res.json({
        success: true,
        message: 'Mock payment processed successfully',
        data: {
          paymentId: mockPaymentId,
          orderId: order._id
        }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error processing mock payment:', error);
    next(error);
  }
};

module.exports = {
  handlePolarWebhook,
  getOrderPayments,
  getPayment,
  retryPayment,
  mockPaymentSuccess
};
