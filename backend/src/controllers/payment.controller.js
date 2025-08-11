const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const RazorpayService = require('../services/razorpay.service');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Handle Razorpay webhook
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      logger.warn('Invalid webhook signature', { signature: webhookSignature });
      return next(new AppError('Invalid webhook signature', 400));
    }

    const { event, payload } = req.body;

    logger.info('Received Razorpay webhook', { event, paymentId: payload.payment?.entity?.id });

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(payload.order.entity);
        break;
      default:
        logger.info('Unhandled webhook event', { event });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    next(error);
  }
};

/**
 * Handle successful payment capture
 */
const handlePaymentCaptured = async (paymentEntity) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Find payment record
      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id
      }).session(session);

      if (!payment) {
        logger.warn('Payment record not found for webhook', { orderId: paymentEntity.order_id });
        return;
      }

      // Update payment status
      payment.status = 'success';
      payment.razorpayPaymentId = paymentEntity.id;
      payment.raw = paymentEntity;
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

      // Update reservation statuses
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
    });
  } catch (error) {
    logger.error('Error processing payment capture:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentEntity) => {
  try {
    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: paymentEntity.order_id
    });

    if (!payment) {
      logger.warn('Payment record not found for failed payment', { orderId: paymentEntity.order_id });
      return;
    }

    // Update payment status
    payment.status = 'failed';
    payment.razorpayPaymentId = paymentEntity.id;
    payment.raw = paymentEntity;
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
      errorDescription: paymentEntity.error_description
    });
  } catch (error) {
    logger.error('Error processing payment failure:', error);
    throw error;
  }
};

/**
 * Handle order paid event
 */
const handleOrderPaid = async (orderEntity) => {
  try {
    const order = await Order.findOne({ razorpayOrderId: orderEntity.id });
    if (!order) {
      logger.warn('Order not found for paid event', { razorpayOrderId: orderEntity.id });
      return;
    }

    // This is usually already handled by payment.captured, but adding for completeness
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      await order.save();
    }

    logger.info('Order paid event processed', { orderId: order._id });
  } catch (error) {
    logger.error('Error processing order paid event:', error);
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
    const paymentData = await RazorpayService.createOrder({
      amount: payment.amount,
      currency: 'INR',
      orderId: payment.orderId._id.toString(),
      customerInfo: {
        name: req.user.name,
        email: req.user.email
      }
    });

    // Create new payment record
    const newPayment = new Payment({
      orderId: payment.orderId._id,
      amount: payment.amount,
      method: payment.method,
      razorpayOrderId: paymentData.razorpayOrderId,
      status: 'initiated'
    });
    await newPayment.save();

    // Update order with new Razorpay order ID
    payment.orderId.razorpayOrderId = paymentData.razorpayOrderId;
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
        razorpayOrderId: paymentData.razorpayOrderId,
        amount: payment.amount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
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
        payment.razorpayPaymentId = mockPaymentId;
        await payment.save({ session });

        // Update order
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.razorpayOrderId = mockOrderId;
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
  handleRazorpayWebhook,
  getOrderPayments,
  getPayment,
  retryPayment,
  mockPaymentSuccess
};
