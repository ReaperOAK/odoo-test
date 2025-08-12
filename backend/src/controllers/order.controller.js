const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Listing = require('../models/Listing');
const ReservationService = require('../services/reservation.service');
const PolarService = require('../services/polar.service');
const emailService = require('../services/email.service');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Create new order with reservations
 */
const createOrder = async (req, res, next) => {
  try {
    const { lines, paymentOption = 'deposit' } = req.body;
    const renterId = req.user.id;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return next(new AppError('Order lines are required', 400));
    }

    // Validate each line
    for (const line of lines) {
      if (!line.listingId || !line.start || !line.end || !line.qty) {
        return next(new AppError('Invalid order line: listingId, start, end, and qty are required', 400));
      }

      if (new Date(line.start) >= new Date(line.end)) {
        return next(new AppError('End date must be after start date', 400));
      }

      if (line.qty <= 0) {
        return next(new AppError('Quantity must be greater than 0', 400));
      }
    }

    // Start transaction
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        // Create order using reservation service
        order = await ReservationService.createOrderAndReserve({
          renterId,
          lines,
          paymentOption
        }, session);
      });

      logger.info(`Created order ${order._id}`, {
        userId: renterId,
        lines: lines.length,
        totalAmount: order.totalAmount
      });

      // Populate order for response
      const populatedOrder = await Order.findById(order._id)
        .populate('lines.listingId', 'title images basePrice ownerId')
        .populate('hostId', 'name hostProfile')
        .populate('renterId', 'name email');

      // Send emails asynchronously (non-blocking)
      const sendEmails = async () => {
        try {
          // Send booking confirmation to customer
          await emailService.sendBookingConfirmation(populatedOrder, populatedOrder.renterId);
          
          // Send booking notification to host
          await emailService.sendBookingNotificationToHost(
            populatedOrder, 
            populatedOrder.hostId, 
            populatedOrder.renterId
          );
        } catch (error) {
          logger.error('Failed to send order emails:', error);
        }
      };
      sendEmails();

      res.status(201).json({
        success: true,
        data: { order: populatedOrder }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
};

/**
 * Get order by ID
 */
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id)
      .populate('lines.listingId', 'title images basePrice ownerId')
      .populate('hostId', 'name email hostProfile')
      .populate('renterId', 'name email');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check access permissions
    const isOwner = req.user.id === order.renterId._id.toString();
    const isHost = req.user.id === order.hostId._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isHost && !isAdmin) {
      return next(new AppError('Not authorized to view this order', 403));
    }

    // Get related reservations
    const reservations = await Reservation.find({ orderId: id })
      .populate('listingId', 'title images');

    // Get payment history
    const payments = await Payment.find({ orderId: id })
      .sort({ createdAt: -1 });

    logger.info(`Fetched order ${id}`, { userId: req.user.id });

    res.json({
      success: true,
      data: {
        order,
        reservations,
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(error);
  }
};

/**
 * Get orders for user (renter or host)
 */
const getUserOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role = 'renter' // 'renter' or 'host'
    } = req.query;

    const query = {};
    
    if (role === 'host') {
      query.hostId = req.user.id;
    } else {
      query.renterId = req.user.id;
    }

    if (status) {
      query.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('lines.listingId', 'title images basePrice')
      .populate('hostId', 'name hostProfile.displayName')
      .populate('renterId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${orders.length} orders for user`, {
      userId: req.user.id,
      role,
      status
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    next(error);
  }
};

/**
 * Initiate payment for order
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'polar' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id).populate('renterId', 'name email');
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the renter
    if (order.renterId._id.toString() !== req.user.id) {
      return next(new AppError('Not authorized to pay for this order', 403));
    }

    // Check if order is in correct state
    if (order.paymentStatus !== 'pending') {
      return next(new AppError('Order payment is not pending', 400));
    }

    if (order.orderStatus !== 'quote') {
      return next(new AppError('Order is not in quote status', 400));
    }

    // Create checkout session
    const checkoutData = await PolarService.createCheckoutSession({
      orderId: order._id.toString(),
      customerId: req.user.id,
      customerEmail: order.renterId.email,
      listingId: order.lines[0]?.listingId,
      productName: `Order ${order._id}`,
      total: order.totalAmount
    });

    // Update order with session ID
    order.polarSessionId = checkoutData.id;
    await order.save();

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      amount: order.totalAmount,
      method: paymentMethod,
      polarSessionId: checkoutData.id,
      status: 'initiated'
    });
    await payment.save();

    logger.info(`Initiated payment for order ${id}`, {
      userId: req.user.id,
      amount: order.totalAmount,
      sessionId: checkoutData.id
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        sessionId: checkoutData.id,
        checkoutUrl: checkoutData.url,
        amount: order.totalAmount,
        currency: checkoutData.currency
      }
    });
  } catch (error) {
    logger.error('Error initiating payment:', error);
    next(error);
  }
};

/**
 * Confirm payment (called after successful Polar payment)
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the renter
    if (order.renterId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to confirm payment for this order', 403));
    }

    // Verify payment with Polar
    const sessionData = await PolarService.verifyCheckoutSession(sessionId);

    if (!sessionData || sessionData.status !== 'completed') {
      return next(new AppError('Payment verification failed', 400));
    }

    // Start transaction to update order and payment
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update order status
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save({ session });

        // Update payment record
        const payment = await Payment.findOne({ 
          orderId: id, 
          polarSessionId: sessionId 
        }).session(session);
        
        if (payment) {
          payment.status = 'success';
          payment.polarPaymentId = sessionData.id;
          payment.raw = sessionData;
          await payment.save({ session });
        }

        // Update host wallet balance
        const host = await User.findById(order.hostId).session(session);
        if (host) {
          const hostEarnings = order.subtotal - order.platformCommission;
          host.walletBalance += hostEarnings;
          await host.save({ session });
        }

        // Update reservation statuses
        await Reservation.updateMany(
          { orderId: id },
          { status: 'reserved' },
          { session }
        );
      });

      logger.info(`Payment confirmed for order ${id}`, {
        userId: req.user.id,
        sessionId,
        amount: order.totalAmount
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: { order }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error confirming payment:', error);
    next(error);
  }
};

/**
 * Update order status (host/admin actions)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check permissions
    const isHost = req.user.id === order.hostId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return next(new AppError('Not authorized to update this order', 403));
    }

    // Validate status transitions
    const validTransitions = {
      'quote': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'disputed'],
      'disputed': ['completed', 'cancelled']
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      return next(new AppError(`Invalid status transition from ${order.orderStatus} to ${status}`, 400));
    }

    // Update order
    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    if (notes) {
      order.metadata = { 
        ...order.metadata, 
        statusNotes: notes,
        lastUpdatedBy: req.user.id,
        lastUpdatedAt: new Date()
      };
    }
    if (metadata) {
      order.metadata = { ...order.metadata, ...metadata };
    }

    await order.save();

    // Update related reservations if needed
    if (status === 'in_progress') {
      await Reservation.updateMany(
        { orderId: id },
        { status: 'active' }
      );
    } else if (status === 'completed') {
      await Reservation.updateMany(
        { orderId: id },
        { status: 'returned' }
      );
    }

    // Populate order for email
    const populatedOrder = await Order.findById(id)
      .populate('renterId', 'name email')
      .populate('hostId', 'name email');

    // Send status update email (non-blocking)
    emailService.sendOrderStatusUpdate(populatedOrder, populatedOrder.renterId, previousStatus)
      .catch(error => {
        logger.error('Failed to send order status update email:', error);
      });

    logger.info(`Updated order ${id} status to ${status}`, {
      userId: req.user.id,
      previousStatus: previousStatus
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id)
      .populate('renterId', 'name email')
      .populate('hostId', 'name email');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check permissions - only customer or admin can cancel
    const isOwner = req.user.id === order.renterId._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Not authorized to cancel this order', 403));
    }

    // Check if order can be cancelled
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return next(new AppError('Cannot cancel order with current status', 400));
    }

    // Update order status
    order.orderStatus = 'cancelled';
    order.metadata = {
      ...order.metadata,
      cancellationReason: reason,
      cancelledBy: req.user.id,
      cancelledAt: new Date()
    };

    await order.save();

    // Update related reservations
    await Reservation.updateMany(
      { orderId: id },
      { status: 'cancelled' }
    );

    // Send cancellation email (non-blocking)
    emailService.sendCancellationConfirmation(order, order.renterId, reason)
      .catch(error => {
        logger.error('Failed to send cancellation email:', error);
      });

    logger.info(`Cancelled order ${id}`, {
      userId: req.user.id,
      reason: reason
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrder,
  getUserOrders,
  initiatePayment,
  confirmPayment,
  cancelOrder,
  updateOrderStatus
};
