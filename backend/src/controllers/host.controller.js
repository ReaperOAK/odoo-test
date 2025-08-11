const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get host dashboard statistics
 */
const getHostDashboard = async (req, res, next) => {
  try {
    const hostId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Get basic stats
    const [
      totalListings,
      activeListings,
      totalOrders,
      pendingPickups,
      activeRentals,
      thisMonthRevenue,
      thisWeekOrders,
      walletBalance
    ] = await Promise.all([
      Listing.countDocuments({ ownerId: hostId }),
      Listing.countDocuments({ ownerId: hostId, status: 'published' }),
      Order.countDocuments({ hostId }),
      Order.countDocuments({ 
        hostId, 
        orderStatus: 'confirmed',
        createdAt: { $gte: today }
      }),
      Order.countDocuments({ 
        hostId, 
        orderStatus: 'in_progress'
      }),
      Order.aggregate([
        {
          $match: {
            hostId: new mongoose.Types.ObjectId(hostId),
            paymentStatus: 'paid',
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $subtract: ['$subtotal', '$platformCommission'] } }
          }
        }
      ]),
      Order.countDocuments({
        hostId,
        createdAt: { $gte: startOfWeek }
      }),
      User.findById(hostId).select('walletBalance')
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ hostId })
      .populate('renterId', 'name email')
      .populate('lines.listingId', 'title images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get upcoming pickups/returns
    const upcomingPickups = await Order.find({
      hostId,
      orderStatus: 'confirmed'
    })
      .populate('renterId', 'name email')
      .populate('lines.listingId', 'title')
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    const upcomingReturns = await Order.find({
      hostId,
      orderStatus: 'in_progress'
    })
      .populate('renterId', 'name email')
      .populate('lines.listingId', 'title')
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // Calculate utilization rate
    const utilizationData = await Reservation.aggregate([
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $match: {
          'listing.ownerId': new mongoose.Types.ObjectId(hostId),
          status: { $in: ['reserved', 'picked', 'active', 'returned'] },
          start: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$listingId',
          totalReservedDays: {
            $sum: {
              $divide: [
                { $subtract: ['$end', '$start'] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          totalQuantity: { $first: { $arrayElemAt: ['$listing.totalQuantity', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          avgUtilization: {
            $avg: {
              $divide: ['$totalReservedDays', { $multiply: ['$totalQuantity', 30] }]
            }
          }
        }
      }
    ]);

    const monthlyRevenue = thisMonthRevenue[0]?.totalRevenue || 0;
    const utilization = Math.round((utilizationData[0]?.avgUtilization || 0) * 100);

    logger.info(`Fetched host dashboard for ${hostId}`, {
      totalListings,
      totalOrders,
      monthlyRevenue
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          totalOrders,
          pendingPickups,
          activeRentals,
          monthlyRevenue,
          weeklyOrders: thisWeekOrders,
          walletBalance: walletBalance?.walletBalance || 0,
          utilizationRate: utilization
        },
        recentOrders,
        upcomingPickups,
        upcomingReturns
      }
    });
  } catch (error) {
    logger.error('Error fetching host dashboard:', error);
    next(error);
  }
};

/**
 * Get host listings
 */
const getHostListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search
    } = req.query;

    const query = { ownerId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get reservation stats for each listing
    const listingIds = listings.map(l => l._id);
    const reservationStats = await Reservation.aggregate([
      {
        $match: {
          listingId: { $in: listingIds },
          status: { $nin: ['cancelled'] }
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
          },
          activeBookings: {
            $sum: {
              $cond: [{ $in: ['$status', ['reserved', 'picked', 'active']] }, 1, 0]
            }
          }
        }
      }
    ]);

    const statsMap = new Map(
      reservationStats.map(stat => [stat._id.toString(), stat])
    );

    // Add stats to listings
    const listingsWithStats = listings.map(listing => {
      const stats = statsMap.get(listing._id.toString()) || {
        totalBookings: 0,
        totalRevenue: 0,
        activeBookings: 0
      };

      return {
        ...listing,
        stats: {
          totalBookings: stats.totalBookings,
          totalRevenue: Math.round(stats.totalRevenue * listing.basePrice),
          activeBookings: stats.activeBookings
        }
      };
    });

    const total = await Listing.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${listings.length} listings for host ${req.user.id}`);

    res.json({
      success: true,
      data: {
        listings: listingsWithStats,
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
    logger.error('Error fetching host listings:', error);
    next(error);
  }
};

/**
 * Get host orders with advanced filtering
 */
const getHostOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      from,
      to,
      search
    } = req.query;

    const query = { hostId: req.user.id };
    
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

    let orders = await Order.find(query)
      .populate('renterId', 'name email')
      .populate('lines.listingId', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.renterId.name.toLowerCase().includes(searchLower) ||
        order.renterId.email.toLowerCase().includes(searchLower) ||
        order.lines.some(line => 
          line.listingId.title.toLowerCase().includes(searchLower)
        )
      );
    }

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${orders.length} orders for host ${req.user.id}`);

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
    logger.error('Error fetching host orders:', error);
    next(error);
  }
};

/**
 * Get host calendar data (reservations)
 */
const getHostCalendar = async (req, res, next) => {
  try {
    const {
      start,
      end,
      listingId
    } = req.query;

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    // Build match query
    const matchQuery = {
      status: { $nin: ['cancelled'] },
      $or: [
        { start: { $lte: endDate }, end: { $gte: startDate } }
      ]
    };

    // Filter by listing if specified
    if (listingId) {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return next(new AppError('Invalid listing ID', 400));
      }
      matchQuery.listingId = new mongoose.Types.ObjectId(listingId);
    }

    // Get reservations with listing info
    const reservations = await Reservation.aggregate([
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $match: {
          'listing.ownerId': new mongoose.Types.ObjectId(req.user.id),
          ...matchQuery
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'order.renterId',
          foreignField: '_id',
          as: 'renter'
        }
      },
      {
        $project: {
          _id: 1,
          listingId: 1,
          orderId: 1,
          qty: 1,
          start: 1,
          end: 1,
          status: 1,
          listing: { $arrayElemAt: ['$listing', 0] },
          order: { $arrayElemAt: ['$order', 0] },
          renter: { $arrayElemAt: ['$renter', 0] }
        }
      }
    ]);

    // Format for calendar display
    const calendarEvents = reservations.map(reservation => ({
      id: reservation._id,
      title: `${reservation.listing.title} (${reservation.qty}x)`,
      start: reservation.start,
      end: reservation.end,
      status: reservation.status,
      backgroundColor: getStatusColor(reservation.status),
      borderColor: getStatusColor(reservation.status),
      extendedProps: {
        listingId: reservation.listingId,
        orderId: reservation.orderId,
        qty: reservation.qty,
        listingTitle: reservation.listing.title,
        renterName: reservation.renter?.name,
        renterEmail: reservation.renter?.email,
        orderStatus: reservation.order?.orderStatus,
        paymentStatus: reservation.order?.paymentStatus
      }
    }));

    logger.info(`Fetched ${calendarEvents.length} calendar events for host ${req.user.id}`);

    res.json({
      success: true,
      data: { events: calendarEvents }
    });
  } catch (error) {
    logger.error('Error fetching host calendar:', error);
    next(error);
  }
};

/**
 * Mark order pickup
 */
const markPickup = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { notes, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the host
    if (order.hostId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to mark pickup for this order', 403));
    }

    // Check order status
    if (order.orderStatus !== 'confirmed') {
      return next(new AppError('Order must be confirmed to mark pickup', 400));
    }

    // Update order and reservations
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update order status
        order.orderStatus = 'in_progress';
        order.metadata = {
          ...order.metadata,
          pickupNotes: notes,
          pickupImages: images || [],
          pickedUpBy: req.user.id,
          pickedUpAt: new Date()
        };
        await order.save({ session });

        // Update reservation statuses
        await Reservation.updateMany(
          { orderId },
          { status: 'picked' },
          { session }
        );
      });

      logger.info(`Marked pickup for order ${orderId}`, {
        hostId: req.user.id,
        notes: notes ? 'included' : 'none'
      });

      res.json({
        success: true,
        message: 'Pickup marked successfully',
        data: { order }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error marking pickup:', error);
    next(error);
  }
};

/**
 * Mark order return
 */
const markReturn = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { notes, images, damageCharges = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the host
    if (order.hostId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to mark return for this order', 403));
    }

    // Check order status
    if (order.orderStatus !== 'in_progress') {
      return next(new AppError('Order must be in progress to mark return', 400));
    }

    // Calculate total damage charges
    const totalDamageCharges = damageCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

    // Update order and reservations
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update order status
        order.orderStatus = totalDamageCharges > 0 ? 'disputed' : 'completed';
        order.metadata = {
          ...order.metadata,
          returnNotes: notes,
          returnImages: images || [],
          damageCharges,
          totalDamageCharges,
          returnedBy: req.user.id,
          returnedAt: new Date()
        };
        await order.save({ session });

        // Update reservation statuses
        await Reservation.updateMany(
          { orderId },
          { status: 'returned' },
          { session }
        );
      });

      logger.info(`Marked return for order ${orderId}`, {
        hostId: req.user.id,
        damageCharges: totalDamageCharges,
        status: order.orderStatus
      });

      res.json({
        success: true,
        message: 'Return marked successfully',
        data: { order }
      });

    } finally {
      await session.endSession();
    }
  } catch (error) {
    logger.error('Error marking return:', error);
    next(error);
  }
};

/**
 * Get host wallet transactions
 */
const getWalletTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      from,
      to
    } = req.query;

    const query = { hostId: req.user.id };
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get completed orders as transactions
    const transactions = await Order.find({
      ...query,
      paymentStatus: 'paid'
    })
      .populate('renterId', 'name')
      .populate('lines.listingId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format as wallet transactions
    const walletTransactions = transactions.map(order => {
      const hostEarnings = order.subtotal - order.platformCommission;
      return {
        id: order._id,
        type: 'earning',
        amount: hostEarnings,
        description: `Booking: ${order.lines[0]?.listingId?.title}`,
        orderId: order._id,
        renterName: order.renterId.name,
        date: order.createdAt,
        status: order.orderStatus
      };
    });

    const total = await Order.countDocuments({
      ...query,
      paymentStatus: 'paid'
    });
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get current wallet balance
    const user = await User.findById(req.user.id).select('walletBalance');

    logger.info(`Fetched ${transactions.length} wallet transactions for host ${req.user.id}`);

    res.json({
      success: true,
      data: {
        transactions: walletTransactions,
        walletBalance: user.walletBalance,
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
    logger.error('Error fetching wallet transactions:', error);
    next(error);
  }
};

/**
 * Helper function to get status color for calendar
 */
function getStatusColor(status) {
  const colors = {
    'reserved': '#3b82f6', // blue
    'picked': '#f59e0b',   // amber
    'active': '#10b981',   // emerald
    'returned': '#6b7280', // gray
    'cancelled': '#ef4444' // red
  };
  return colors[status] || '#6b7280';
}

module.exports = {
  getHostDashboard,
  getHostListings,
  getHostOrders,
  getHostCalendar,
  markPickup,
  markReturn,
  getWalletTransactions
};
