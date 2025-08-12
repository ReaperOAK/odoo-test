const User = require('../models/User');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const Reservation = require('../models/Reservation');
const LateFee = require('../models/LateFee');
const emailService = require('../services/email.service');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get admin dashboard statistics
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Get comprehensive platform statistics
    const [
      totalUsers,
      totalHosts,
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      monthlyRevenue,
      weeklyOrders,
      activeRentals,
      disputedOrders,
      pendingPayouts,
      totalPayouts,
      lateFeeStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isHost: true }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'published' }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'completed' }),

      // Total platform revenue (commission)
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } }
      ]),

      // Monthly revenue
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } }
      ]),

      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ orderStatus: 'in_progress' }),
      Order.countDocuments({ orderStatus: 'disputed' }),

      // Pending payouts
      Payout.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Total processed payouts
      Payout.aggregate([
        { $match: { status: 'processed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Late fee statistics
      LateFee.aggregate([
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
            avgAmount: { $avg: '$currentAmount' }
          }
        }
      ])
    ]);

    // Get recent activity
    const recentOrders = await Order.find()
      .populate('renterId', 'name email')
      .populate('hostId', 'name hostProfile.displayName')
      .populate('lines.listingId', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentUsers = await User.find()
      .select('name email isHost createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get top performing listings
    const topListings = await Reservation.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$listingId',
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $multiply: ['$qty', { $divide: [{ $subtract: ['$end', '$start'] }, 1000 * 60 * 60 * 24] }]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'listings',
          localField: '_id',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $project: {
          totalBookings: 1,
          totalRevenue: 1,
          listing: { $arrayElemAt: ['$listing', 0] }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 }
    ]);

    // Calculate growth metrics
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [lastMonthUsers, lastMonthOrders, lastMonthRevenue] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
      }),
      Order.countDocuments({
        createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
      }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
          }
        },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } }
      ])
    ]);

    const thisMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0 ?
      ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0;

    const orderGrowth = lastMonthOrders > 0 ?
      ((weeklyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1) : 0;

    const revenueGrowth = (lastMonthRevenue[0]?.total || 0) > 0 ?
      (((monthlyRevenue[0]?.total || 0) - (lastMonthRevenue[0]?.total || 0)) /
        (lastMonthRevenue[0]?.total || 1) * 100).toFixed(1) : 0;

    logger.info('Fetched admin dashboard statistics', {
      adminId: req.user.id,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            hosts: totalHosts,
            customers: totalUsers - totalHosts,
            growth: parseFloat(userGrowth)
          },
          listings: {
            total: totalListings,
            active: activeListings,
            inactive: totalListings - activeListings
          },
          orders: {
            total: totalOrders,
            completed: completedOrders,
            active: activeRentals,
            disputed: disputedOrders,
            weekly: weeklyOrders,
            growth: parseFloat(orderGrowth)
          },
          revenue: {
            total: totalRevenue[0]?.total || 0,
            monthly: monthlyRevenue[0]?.total || 0,
            growth: parseFloat(revenueGrowth)
          },
          payouts: {
            pending: pendingPayouts[0]?.total || 0,
            processed: totalPayouts[0]?.total || 0
          },
          lateFees: {
            total: lateFeeStats[0]?.totalFees || 0,
            totalAmount: lateFeeStats[0]?.totalAmount || 0,
            active: lateFeeStats[0]?.activeFees || 0,
            paid: lateFeeStats[0]?.paidFees || 0,
            waived: lateFeeStats[0]?.waivedFees || 0,
            avgAmount: lateFeeStats[0]?.avgAmount || 0
          }
        },
        recentOrders,
        recentUsers,
        topListings
      }
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    next(error);
  }
};

/**
 * Get all users with filtering and search
 */
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (role) {
      if (role === 'host') {
        query.isHost = true;
      } else if (role === 'customer') {
        query.isHost = false;
      } else if (role === 'admin') {
        query.role = 'admin';
      }
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-passwordHash') // Exclude password hash
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get additional stats for each user
    const userIds = users.map(u => u._id);

    const [orderStats, listingStats] = await Promise.all([
      Order.aggregate([
        { $match: { $or: [{ renterId: { $in: userIds } }, { hostId: { $in: userIds } }] } },
        {
          $group: {
            _id: {
              userId: { $cond: [{ $in: ['$renterId', userIds] }, '$renterId', '$hostId'] }
            },
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: { $cond: [{ $in: ['$renterId', userIds] }, '$totalAmount', 0] }
            },
            totalEarned: {
              $sum: { $cond: [{ $in: ['$hostId', userIds] }, '$subtotal', 0] }
            }
          }
        }
      ]),

      Listing.aggregate([
        { $match: { ownerId: { $in: userIds } } },
        {
          $group: {
            _id: '$ownerId',
            totalListings: { $sum: 1 },
            activeListings: {
              $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const orderStatsMap = new Map(orderStats.map(s => [s._id.userId.toString(), s]));
    const listingStatsMap = new Map(listingStats.map(s => [s._id.toString(), s]));

    // Combine user data with stats
    const usersWithStats = users.map(user => {
      const orders = orderStatsMap.get(user._id.toString()) || {};
      const listings = listingStatsMap.get(user._id.toString()) || {};

      return {
        ...user,
        stats: {
          totalOrders: orders.totalOrders || 0,
          totalSpent: orders.totalSpent || 0,
          totalEarned: orders.totalEarned || 0,
          totalListings: listings.totalListings || 0,
          activeListings: listings.activeListings || 0
        }
      };
    });

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${users.length} users for admin`, {
      adminId: req.user.id,
      filters: { role, search, status }
    });

    res.json({
      success: true,
      data: {
        users: usersWithStats,
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
    logger.error('Error fetching users:', error);
    next(error);
  }
};

/**
 * Get all orders with advanced filtering
 */
const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      from,
      to,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let orders = await Order.find(query)
      .populate('renterId', 'name email')
      .populate('hostId', 'name email hostProfile.displayName')
      .populate('lines.listingId', 'title images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Apply search filter after population if needed
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order =>
        order.renterId.name.toLowerCase().includes(searchLower) ||
        order.renterId.email.toLowerCase().includes(searchLower) ||
        order.hostId.name.toLowerCase().includes(searchLower) ||
        order.lines.some(line =>
          line.listingId.title.toLowerCase().includes(searchLower)
        )
      );
    }

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${orders.length} orders for admin`, {
      adminId: req.user.id,
      filters: { status, paymentStatus, search }
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
    logger.error('Error fetching orders:', error);
    next(error);
  }
};

/**
 * Get single order by ID for admin
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id)
      .populate('renterId', 'name email phone')
      .populate('hostId', 'name email phone hostProfile.displayName')
      .populate('lines.listingId', 'title images category location pricing')
      .lean();

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Get associated reservations
    const reservations = await Reservation.find({ orderId: id })
      .populate('listingId', 'title images')
      .sort({ createdAt: -1 });

    // Get payments
    const payments = await Payment.find({ orderId: id })
      .sort({ createdAt: -1 });

    // Get late fees
    const lateFees = await LateFee.find({ orderId: id })
      .sort({ createdAt: -1 });

    logger.info(`Admin fetched order ${id}`, { adminId: req.user.id });

    res.json({
      success: true,
      data: {
        order,
        reservations,
        payments,
        lateFees
      }
    });
  } catch (error) {
    logger.error('Error fetching order by ID:', error);
    next(error);
  }
};

/**
 * Update order status as admin
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Validate status transitions (admin has more flexibility)
    const validStatuses = ['quote', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status: ${status}`, 400));
    }

    // Update order
    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    order.metadata = {
      ...order.metadata,
      adminNotes,
      lastUpdatedBy: req.user.id,
      lastUpdatedAt: new Date(),
      ...metadata
    };

    await order.save();

    // Update related reservations based on status
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
    } else if (status === 'cancelled') {
      await Reservation.updateMany(
        { orderId: id },
        { status: 'cancelled' }
      );
    }

    // Populate order for response
    const populatedOrder = await Order.findById(id)
      .populate('renterId', 'name email')
      .populate('hostId', 'name email hostProfile.displayName')
      .populate('lines.listingId', 'title images');

    logger.info(`Admin updated order ${id} status from ${previousStatus} to ${status}`, {
      adminId: req.user.id,
      notes: adminNotes
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: populatedOrder }
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

/**
 * Get all payouts
 */
const getPayouts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      from,
      to
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await Payout.find(query)
      .populate('hostId', 'name email hostProfile.displayName walletBalance')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get summary stats
    const [pendingTotal, processedTotal] = await Promise.all([
      Payout.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payout.aggregate([
        { $match: { status: 'processed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    logger.info(`Fetched ${payouts.length} payouts for admin`, {
      adminId: req.user.id,
      status
    });

    res.json({
      success: true,
      data: {
        payouts,
        summary: {
          pendingTotal: pendingTotal[0]?.total || 0,
          processedTotal: processedTotal[0]?.total || 0
        },
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
    logger.error('Error fetching payouts:', error);
    next(error);
  }
};

/**
 * Process payout (mock implementation)
 */
const processPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid payout ID', 400));
    }

    const payout = await Payout.findById(id).populate('hostId', 'name email walletBalance');
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }

    if (payout.status !== 'pending') {
      return next(new AppError('Only pending payouts can be processed', 400));
    }

    // Start transaction
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Update payout status
        payout.status = 'processed';
        payout.metadata = {
          ...payout.metadata,
          processedBy: req.user.id,
          processedAt: new Date(),
          notes
        };
        await payout.save({ session });

        // Deduct from host wallet balance
        const host = await User.findById(payout.hostId._id).session(session);
        if (host) {
          host.walletBalance = Math.max(0, host.walletBalance - payout.amount);
          await host.save({ session });
        }
      });

      logger.info(`Processed payout ${id}`, {
        adminId: req.user.id,
        hostId: payout.hostId._id,
        amount: payout.amount
      });

      // Send payout notification email (non-blocking)
      emailService.sendPayoutNotification(payout, payout.hostId)
        .catch(error => {
          logger.error('Failed to send payout notification email:', error);
        });

      res.json({
        success: true,
        message: 'Payout processed successfully',
        data: { payout }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error processing payout:', error);
    next(error);
  }
};

/**
 * Create manual payout
 */
const createPayout = async (req, res, next) => {
  try {
    const { hostId, amount, method = 'manual', notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return next(new AppError('Invalid host ID', 400));
    }

    if (!amount || amount <= 0) {
      return next(new AppError('Amount must be greater than 0', 400));
    }

    // Check if host exists and has sufficient balance
    const host = await User.findById(hostId);
    if (!host) {
      return next(new AppError('Host not found', 404));
    }

    if (!host.isHost) {
      return next(new AppError('User is not a host', 400));
    }

    if (host.walletBalance < amount) {
      return next(new AppError('Insufficient wallet balance', 400));
    }

    // Create payout
    const payout = new Payout({
      hostId,
      amount,
      method,
      status: 'pending',
      metadata: {
        createdBy: req.user.id,
        notes
      }
    });

    await payout.save();

    logger.info(`Created manual payout for host ${hostId}`, {
      adminId: req.user.id,
      amount,
      payoutId: payout._id
    });

    res.status(201).json({
      success: true,
      message: 'Payout created successfully',
      data: { payout }
    });
  } catch (error) {
    logger.error('Error creating payout:', error);
    next(error);
  }
};

/**
 * Update user role/status
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isHost, hostProfile } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid user ID', 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update allowed fields
    if (role !== undefined && ['user', 'host', 'admin'].includes(role)) {
      user.role = role;
    }

    if (isHost !== undefined) {
      user.isHost = isHost;
    }

    if (hostProfile && user.isHost) {
      user.hostProfile = { ...user.hostProfile, ...hostProfile };
    }

    await user.save();

    logger.info(`Updated user ${id}`, {
      adminId: req.user.id,
      updates: { role, isHost }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: user.toObject({ transform: (doc, ret) => { delete ret.passwordHash; return ret; } }) }
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
};

/**
 * Resolve dispute
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { resolution, refundAmount = 0, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.orderStatus !== 'disputed') {
      return next(new AppError('Order is not in disputed status', 400));
    }

    // Start transaction
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Update order status
        order.orderStatus = resolution === 'completed' ? 'completed' : 'cancelled';
        order.metadata = {
          ...order.metadata,
          disputeResolution: resolution,
          disputeResolvedBy: req.user.id,
          disputeResolvedAt: new Date(),
          disputeNotes: notes,
          refundAmount
        };
        await order.save({ session });

        // Handle refund if specified
        if (refundAmount > 0) {
          // In a real implementation, process refund through payment gateway
          order.paymentStatus = 'refunded';
          await order.save({ session });

          // Adjust host wallet if needed
          const host = await User.findById(order.hostId).session(session);
          if (host) {
            const adjustment = Math.min(refundAmount, host.walletBalance);
            host.walletBalance -= adjustment;
            await host.save({ session });
          }
        }
      });

      logger.info(`Resolved dispute for order ${orderId}`, {
        adminId: req.user.id,
        resolution,
        refundAmount
      });

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: { order }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error resolving dispute:', error);
    next(error);
  }
};

/**
 * Get platform analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue over time
    const revenueOverTime = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$platformCommission' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 },
          newHosts: { $sum: { $cond: ['$isHost', 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Category performance
    const categoryPerformance = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$listing.category', 0] },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $multiply: [
                '$qty',
                { $divide: [{ $subtract: ['$end', '$start'] }, 1000 * 60 * 60 * 24] },
                { $arrayElemAt: ['$listing.basePrice', 0] }
              ]
            }
          }
        }
      },
      { $sort: { bookings: -1 } }
    ]);

    logger.info(`Fetched analytics for period ${period}`, {
      adminId: req.user.id,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        revenueOverTime,
        userGrowth,
        categoryPerformance
      }
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    next(error);
  }
};

/**
 * Get system health metrics
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbStatus = await mongoose.connection.db.admin().ping();
    const dbResponseTime = Date.now() - startTime;

    // Get system stats
    const totalCollections = await mongoose.connection.db.listCollections().toArray();
    const dbStats = await mongoose.connection.db.stats();

    // Calculate storage usage percentage (assuming 1GB limit for demo)
    const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
    const storageUsed = dbStats.dataSize || 0;
    const storagePercentage = Math.round((storageUsed / storageLimit) * 100);

    // Mock payment gateway status (would be real in production)
    const paymentGatewayStatus = 'connected';

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus.ok === 1 ? 'healthy' : 'unhealthy',
          responseTime: `${dbResponseTime}ms`,
          collections: totalCollections.length,
          size: Math.round(storageUsed / (1024 * 1024)) // MB
        },
        storage: {
          used: storagePercentage,
          status: storagePercentage > 80 ? 'warning' : 'healthy'
        },
        paymentGateway: {
          status: paymentGatewayStatus
        },
        api: {
          responseTime: `${dbResponseTime}ms`,
          status: 'healthy'
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.json({
      success: true,
      data: {
        database: { status: 'unhealthy', responseTime: 'timeout' },
        storage: { used: 0, status: 'unknown' },
        paymentGateway: { status: 'disconnected' },
        api: { responseTime: 'timeout', status: 'unhealthy' }
      }
    });
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getPayouts,
  processPayout,
  createPayout,
  updateUser,
  resolveDispute,
  getAnalytics,
  getSystemHealth
};
