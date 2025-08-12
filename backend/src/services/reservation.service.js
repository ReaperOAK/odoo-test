const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const { logger } = require('../config/database');

class ReservationService {
  /**
   * Check availability for a listing during a specific period
   * @param {string} listingId - The listing ID
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @param {number} requestedQty - Requested quantity
   * @param {string} excludeOrderId - Optional order ID to exclude from check
   * @returns {Promise<Object>} Availability information
   */
  static async checkAvailability(listingId, start, end, requestedQty = 1, excludeOrderId = null) {
    try {
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        throw new Error('Invalid listing ID');
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }

      if (startDate < new Date()) {
        throw new Error('Start date cannot be in the past');
      }

      // Get listing to check total quantity
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      if (!listing.canBeBooked()) {
        return {
          available: false,
          availableQty: 0,
          requestedQty,
          totalQty: listing.totalQuantity,
          reason: 'Listing is not available for booking'
        };
      }

      // Get reserved quantity for the period
      const reservedQty = await Reservation.getReservedQuantity(
        listingId,
        startDate,
        endDate,
        excludeOrderId
      );

      const availableQty = listing.totalQuantity - reservedQty;
      const isAvailable = availableQty >= requestedQty;

      return {
        available: isAvailable,
        availableQty,
        requestedQty,
        totalQty: listing.totalQuantity,
        reservedQty,
        listingTitle: listing.title
      };
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Create order with atomic reservation transaction
   * @param {Object} orderData - Order data
   * @param {mongoose.ClientSession} session - Optional session
   * @returns {Promise<Object>} Created order
   */
  static async createOrderAndReserve(orderData, session = null) {
    const sessionLocal = session || await mongoose.startSession();
    let shouldEndSession = !session;

    try {
      if (!session) {
        await sessionLocal.startTransaction();
      }

      const { renterId, lines, paymentOption = 'deposit' } = orderData;

      // Validate all lines first
      for (const line of lines) {
        const availability = await this.checkAvailability(
          line.listingId,
          line.start,
          line.end,
          line.qty
        );

        if (!availability.available) {
          throw new Error(`Insufficient availability for ${availability.listingTitle}. Available: ${availability.availableQty}, Requested: ${line.qty}`);
        }

        // Get listing for pricing
        const listing = await Listing.findById(line.listingId).session(sessionLocal);
        if (!listing) {
          throw new Error(`Listing ${line.listingId} not found`);
        }

        // Calculate line pricing
        const startDate = new Date(line.start);
        const endDate = new Date(line.end);
        const duration = this.calculateDuration(startDate, endDate, listing.unitType);

        line.unitPrice = listing.basePrice;
        line.lineTotal = listing.basePrice * line.qty * duration;
        line.duration = duration;
        line.hostId = listing.ownerId;
      }

      // All lines should have the same host for MVP
      const hostId = lines[0].hostId;
      if (!lines.every(line => line.hostId.toString() === hostId.toString())) {
        throw new Error('All items must be from the same host');
      }

      // Calculate order totals first
      const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const platformCommission = Math.round(subtotal * (process.env.PLATFORM_COMMISSION_PERCENT || 10) / 100);

      // Calculate deposit amount based on payment option
      let depositAmount = 0;
      if (paymentOption === 'deposit') {
        depositAmount = await this.calculateTotalDeposit(lines);
      }

      const totalAmount = paymentOption === 'full' ? subtotal : depositAmount;
      const remainingAmount = paymentOption === 'full' ? 0 : subtotal - depositAmount;

      // Create order first
      const order = new Order({
        renterId,
        hostId,
        lines, // Pass the complete lines data
        subtotal,
        depositAmount,
        platformCommission,
        totalAmount,
        remainingAmount,
        paymentOption,
        paymentStatus: 'pending',
        orderStatus: 'quote'
      });

      await order.save({ session: sessionLocal });

      // Create reservations with the order ID
      const reservations = [];
      for (const line of lines) {
        const reservation = new Reservation({
          listingId: line.listingId,
          orderId: order._id, // Now we have the order ID
          qty: line.qty,
          start: new Date(line.start),
          end: new Date(line.end),
          status: 'reserved'
        });

        await reservation.save({ session: sessionLocal });
        reservations.push(reservation);
        line.reservationId = reservation._id;
      }

      // Update order with reservation IDs
      order.lines = lines;
      await order.save({ session: sessionLocal });

      // Add initial timeline entry
      order.addTimelineEntry('order_created', renterId, 'Order created');
      await order.save({ session: sessionLocal });

      if (!session) {
        await sessionLocal.commitTransaction();
      }

      logger.info(`Order created successfully: ${order._id}`);
      return order;

    } catch (error) {
      if (!session && sessionLocal.inTransaction()) {
        await sessionLocal.abortTransaction();
      }
      logger.error('Error creating order and reservations:', error);
      throw error;
    } finally {
      if (shouldEndSession) {
        await sessionLocal.endSession();
      }
    }
  }

  /**
   * Calculate duration based on unit type
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @param {string} unitType - hour, day, or week
   * @returns {number} Duration in units
   */
  static calculateDuration(start, end, unitType) {
    const diffMs = end - start;

    switch (unitType) {
      case 'hour':
        return Math.ceil(diffMs / (1000 * 60 * 60));
      case 'day':
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      case 'week':
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
      default:
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Default to days
    }
  }

  /**
   * Calculate total deposit amount for multiple lines
   * @param {Array} lines - Order lines
   * @returns {Promise<number>} Total deposit amount
   */
  static async calculateTotalDeposit(lines) {
    let totalDeposit = 0;

    for (const line of lines) {
      const listing = await Listing.findById(line.listingId);
      if (listing) {
        if (listing.depositType === 'percent') {
          totalDeposit += Math.round((line.lineTotal * listing.depositValue) / 100);
        } else {
          totalDeposit += listing.depositValue * line.qty;
        }
      }
    }

    return totalDeposit;
  }

  /**
   * Find next available slots for a listing
   * @param {string} listingId - Listing ID
   * @param {number} requestedQty - Requested quantity
   * @param {Date} preferredStart - Preferred start date
   * @param {number} durationHours - Duration in hours
   * @param {number} limit - Maximum suggestions to return
   * @returns {Promise<Array>} Available slots
   */
  static async findNextAvailableSlots(listingId, requestedQty, preferredStart, durationHours, limit = 5) {
    try {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      const suggestions = [];
      let currentStart = new Date(preferredStart);
      const maxDaysToCheck = 30; // Don't check beyond 30 days

      for (let day = 0; day < maxDaysToCheck && suggestions.length < limit; day++) {
        const start = new Date(currentStart.getTime() + (day * 24 * 60 * 60 * 1000));
        const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));

        const availability = await this.checkAvailability(listingId, start, end, requestedQty);

        if (availability.available) {
          suggestions.push({
            start,
            end,
            availableQty: availability.availableQty
          });
        }
      }

      return suggestions;
    } catch (error) {
      logger.error('Error finding next available slots:', error);
      throw error;
    }
  }

  /**
   * Update reservation status
   * @param {string} reservationId - Reservation ID
   * @param {string} newStatus - New status
   * @param {string} actorId - User ID making the change
   * @param {Object} additionalData - Additional data (notes, photos, etc.)
   * @returns {Promise<Object>} Updated reservation
   */
  static async updateReservationStatus(reservationId, newStatus, actorId, additionalData = {}) {
    try {
      const reservation = await Reservation.findById(reservationId).populate('orderId');
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const oldStatus = reservation.status;
      reservation.status = newStatus;

      // Add status-specific data
      if (newStatus === 'picked' && additionalData.pickupNotes) {
        reservation.pickupNotes = additionalData.pickupNotes;
      }

      if (newStatus === 'returned') {
        if (additionalData.returnNotes) {
          reservation.returnNotes = additionalData.returnNotes;
        }
        if (additionalData.damageReport) {
          reservation.damageReport = additionalData.damageReport;
        }
      }

      await reservation.save();

      // Update order status if needed
      if (reservation.orderId) {
        const order = reservation.orderId;
        order.addTimelineEntry(
          `reservation_${newStatus}`,
          actorId,
          `Reservation status changed from ${oldStatus} to ${newStatus}`
        );

        // Update order status based on reservation status
        if (newStatus === 'picked' && order.orderStatus === 'confirmed') {
          order.orderStatus = 'in_progress';
        } else if (newStatus === 'returned' && order.orderStatus === 'in_progress') {
          order.orderStatus = 'completed';
        } else if (newStatus === 'disputed') {
          order.orderStatus = 'disputed';
        }

        await order.save();
      }

      logger.info(`Reservation ${reservationId} status updated from ${oldStatus} to ${newStatus}`);
      return reservation;

    } catch (error) {
      logger.error('Error updating reservation status:', error);
      throw error;
    }
  }
}

module.exports = ReservationService;
