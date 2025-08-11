const Listing = require('../models/Listing');
const Reservation = require('../models/Reservation');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all listings with search, filter, and availability
 */
const getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      location,
      minPrice,
      maxPrice,
      from,
      to,
      qty = 1
    } = req.query;

    // Build query
    const query = { status: 'published' };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get listings
    let listings = await Listing.find(query)
      .populate('ownerId', 'name hostProfile.verified hostProfile.displayName')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // If date range provided, calculate availability
    if (from && to && listings.length > 0) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      const requestedQty = parseInt(qty);

      // Get all reservations for these listings in the date range
      const listingIds = listings.map(l => l._id);
      const overlappingReservations = await Reservation.aggregate([
        {
          $match: {
            listingId: { $in: listingIds },
            status: { $nin: ['cancelled'] },
            $or: [
              { start: { $lt: endDate }, end: { $gt: startDate } }
            ]
          }
        },
        {
          $group: {
            _id: '$listingId',
            totalReserved: { $sum: '$qty' }
          }
        }
      ]);

      // Add availability info to listings
      const reservationMap = new Map(
        overlappingReservations.map(r => [r._id.toString(), r.totalReserved])
      );

      listings = listings.map(listing => {
        const reserved = reservationMap.get(listing._id.toString()) || 0;
        const availableQty = Math.max(0, listing.totalQuantity - reserved);
        
        return {
          ...listing,
          availableQty,
          isAvailable: availableQty >= requestedQty
        };
      });

      // Filter by availability if requested
      if (req.query.availableOnly === 'true') {
        listings = listings.filter(l => l.isAvailable);
      }
    }

    // Get total count for pagination
    const total = await Listing.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info(`Fetched ${listings.length} listings`, {
      userId: req.user?.id,
      query,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        listings,
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
    logger.error('Error fetching listings:', error);
    next(error);
  }
};

/**
 * Get single listing by ID
 */
const getListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid listing ID', 400));
    }

    const listing = await Listing.findById(id)
      .populate('ownerId', 'name email hostProfile')
      .lean();

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // If listing is not published, only owner can view
    if (listing.status !== 'published' && (!req.user || req.user.id !== listing.ownerId._id.toString())) {
      return next(new AppError('Listing not available', 403));
    }

    logger.info(`Fetched listing ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    logger.error('Error fetching listing:', error);
    next(error);
  }
};

/**
 * Check availability for a listing
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start, end, qty = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid listing ID', 400));
    }

    if (!start || !end) {
      return next(new AppError('Start and end dates are required', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const requestedQty = parseInt(qty);

    if (startDate >= endDate) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Get listing
    const listing = await Listing.findById(id);
    if (!listing || listing.status !== 'published') {
      return next(new AppError('Listing not found or not available', 404));
    }

    // Check overlapping reservations
    const overlappingReservations = await Reservation.aggregate([
      {
        $match: {
          listingId: new mongoose.Types.ObjectId(id),
          status: { $nin: ['cancelled'] },
          $or: [
            { start: { $lt: endDate }, end: { $gt: startDate } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: '$qty' }
        }
      }
    ]);

    const totalReserved = overlappingReservations[0]?.totalReserved || 0;
    const availableQty = Math.max(0, listing.totalQuantity - totalReserved);
    const isAvailable = availableQty >= requestedQty;

    // Calculate pricing
    const durationMs = endDate.getTime() - startDate.getTime();
    let units;
    
    switch (listing.unitType) {
      case 'hour':
        units = Math.ceil(durationMs / (1000 * 60 * 60));
        break;
      case 'week':
        units = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
        break;
      default: // day
        units = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    }

    const subtotal = listing.basePrice * units * requestedQty;
    let depositAmount;
    
    if (listing.depositType === 'flat') {
      depositAmount = listing.depositValue;
    } else {
      depositAmount = Math.round((subtotal * listing.depositValue) / 100);
    }

    // Get next available slots if not available
    let nextAvailable = [];
    if (!isAvailable) {
      // Simple implementation - get next 7 days with availability
      const nextSlots = await getNextAvailableSlots(id, startDate, requestedQty, listing.unitType, 7);
      nextAvailable = nextSlots;
    }

    logger.info(`Checked availability for listing ${id}`, {
      userId: req.user?.id,
      start,
      end,
      qty: requestedQty,
      available: isAvailable,
      availableQty
    });

    res.json({
      success: true,
      data: {
        available: isAvailable,
        availableQty,
        pricing: {
          subtotal,
          depositAmount,
          units,
          unitType: listing.unitType,
          basePrice: listing.basePrice
        },
        nextAvailable: nextAvailable.slice(0, 3) // Limit to 3 suggestions
      }
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    next(error);
  }
};

/**
 * Create new listing (host only)
 */
const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      images,
      category,
      unitType,
      basePrice,
      depositType,
      depositValue,
      totalQuantity,
      location,
      metadata
    } = req.body;

    const listing = new Listing({
      ownerId: req.user.id,
      title,
      description,
      images: images || [],
      category,
      unitType: unitType || 'day',
      basePrice,
      depositType: depositType || 'percent',
      depositValue: depositValue || 20,
      totalQuantity: totalQuantity || 1,
      location,
      metadata: metadata || {},
      status: 'published'
    });

    await listing.save();

    logger.info(`Created listing ${listing._id}`, {
      userId: req.user.id,
      title
    });

    res.status(201).json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    logger.error('Error creating listing:', error);
    next(error);
  }
};

/**
 * Update listing (owner only)
 */
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid listing ID', 400));
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Check ownership
    if (listing.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update this listing', 403));
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'images', 'category', 'unitType',
      'basePrice', 'depositType', 'depositValue', 'totalQuantity',
      'location', 'status', 'metadata'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    await listing.save();

    logger.info(`Updated listing ${id}`, {
      userId: req.user.id,
      updates: Object.keys(req.body)
    });

    res.json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    logger.error('Error updating listing:', error);
    next(error);
  }
};

/**
 * Delete listing (owner only)
 */
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid listing ID', 400));
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Check ownership
    if (listing.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this listing', 403));
    }

    // Check for active reservations
    const activeReservations = await Reservation.countDocuments({
      listingId: id,
      status: { $in: ['reserved', 'picked', 'active'] }
    });

    if (activeReservations > 0) {
      return next(new AppError('Cannot delete listing with active reservations', 400));
    }

    await listing.deleteOne();

    logger.info(`Deleted listing ${id}`, { userId: req.user.id });

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting listing:', error);
    next(error);
  }
};

/**
 * Helper function to get next available slots
 */
async function getNextAvailableSlots(listingId, fromDate, qty, unitType, daysToCheck) {
  const slots = [];
  const listing = await Listing.findById(listingId);
  
  if (!listing) return slots;

  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + i + 1);
    
    let endDate = new Date(checkDate);
    switch (unitType) {
      case 'hour':
        endDate.setHours(endDate.getHours() + 1);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      default: // day
        endDate.setDate(endDate.getDate() + 1);
    }

    // Check availability for this slot
    const overlapping = await Reservation.aggregate([
      {
        $match: {
          listingId: new mongoose.Types.ObjectId(listingId),
          status: { $nin: ['cancelled'] },
          start: { $lt: endDate },
          end: { $gt: checkDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: '$qty' }
        }
      }
    ]);

    const reserved = overlapping[0]?.totalReserved || 0;
    const available = listing.totalQuantity - reserved;

    if (available >= qty) {
      slots.push({
        start: checkDate,
        end: endDate,
        availableQty: available
      });
    }
  }

  return slots;
}

module.exports = {
  getListings,
  getListing,
  checkAvailability,
  createListing,
  updateListing,
  deleteListing
};
