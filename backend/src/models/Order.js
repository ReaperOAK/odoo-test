const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  renterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Renter ID is required']
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host ID is required']
  },
  lines: [{
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required']
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    start: {
      type: Date,
      required: [true, 'Start date is required']
    },
    end: {
      type: Date,
      required: [true, 'End date is required']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative']
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation'
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  depositAmount: {
    type: Number,
    required: [true, 'Deposit amount is required'],
    min: [0, 'Deposit amount cannot be negative']
  },
  platformCommission: {
    type: Number,
    required: [true, 'Platform commission is required'],
    min: [0, 'Platform commission cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['quote', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'quote'
  },
  polarSessionId: {
    type: String
  },
  paymentOption: {
    type: String,
    enum: ['deposit', 'full'],
    default: 'deposit'
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Remaining amount cannot be negative']
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  hostNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Host notes cannot exceed 1000 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
OrderSchema.index({ renterId: 1, createdAt: -1 });
OrderSchema.index({ hostId: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, orderStatus: 1 });
OrderSchema.index({ polarSessionId: 1 }, { sparse: true });
OrderSchema.index({ createdAt: -1 });

// Virtual for order number (formatted)
OrderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for total duration across all lines
OrderSchema.virtual('totalDuration').get(function() {
  if (!this.lines || this.lines.length === 0) return 0;
  
  let totalHours = 0;
  this.lines.forEach(line => {
    const duration = (new Date(line.end) - new Date(line.start)) / (1000 * 60 * 60);
    totalHours += duration * line.qty;
  });
  
  return totalHours;
});

// Virtual for earliest start date
OrderSchema.virtual('startDate').get(function() {
  if (!this.lines || this.lines.length === 0) return null;
  
  const startDates = this.lines.map(line => new Date(line.start));
  return new Date(Math.min(...startDates));
});

// Virtual for latest end date
OrderSchema.virtual('endDate').get(function() {
  if (!this.lines || this.lines.length === 0) return null;
  
  const endDates = this.lines.map(line => new Date(line.end));
  return new Date(Math.max(...endDates));
});

// Method to calculate amounts
OrderSchema.methods.calculateAmounts = function(platformCommissionPercent = 10) {
  let subtotal = 0;
  let depositAmount = 0;
  
  this.lines.forEach(line => {
    subtotal += line.lineTotal;
    // Deposit is calculated per line and then summed
  });
  
  const platformCommission = Math.round((subtotal * platformCommissionPercent) / 100);
  const totalAmount = this.paymentOption === 'full' ? subtotal : depositAmount;
  const remainingAmount = this.paymentOption === 'full' ? 0 : subtotal - depositAmount;
  
  this.subtotal = subtotal;
  this.platformCommission = platformCommission;
  this.totalAmount = totalAmount;
  this.remainingAmount = remainingAmount;
  
  return {
    subtotal,
    depositAmount,
    platformCommission,
    totalAmount,
    remainingAmount
  };
};

// Method to add timeline entry
OrderSchema.methods.addTimelineEntry = function(status, actor, notes = '') {
  this.timeline.push({
    status,
    timestamp: new Date(),
    actor,
    notes
  });
  
  // Keep only last 20 timeline entries
  if (this.timeline.length > 20) {
    this.timeline = this.timeline.slice(-20);
  }
};

// Method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const startDate = this.startDate;
  
  if (!startDate) return false;
  
  const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
  return ['quote', 'confirmed'].includes(this.orderStatus) && hoursUntilStart > 24;
};

// Method to check if order needs payment
OrderSchema.methods.needsPayment = function() {
  return this.paymentStatus === 'pending' && this.orderStatus === 'quote';
};

// Method to check if order is in progress
OrderSchema.methods.isInProgress = function() {
  return ['confirmed', 'in_progress'].includes(this.orderStatus);
};

// Method to get host earnings (after commission)
OrderSchema.methods.getHostEarnings = function() {
  if (this.paymentStatus !== 'paid') return 0;
  return this.subtotal - this.platformCommission;
};

// Static method to find orders by user
OrderSchema.statics.findByUser = function(userId, role = 'renter') {
  const field = role === 'host' ? 'hostId' : 'renterId';
  return this.find({ [field]: userId })
    .populate('renterId', 'name email')
    .populate('hostId', 'name email hostProfile.displayName')
    .populate('lines.listingId', 'title images category')
    .sort({ createdAt: -1 });
};

// Static method to find orders needing payout
OrderSchema.statics.findNeedingPayout = function() {
  return this.find({
    orderStatus: 'completed',
    paymentStatus: 'paid'
  }).populate('hostId', 'name email hostProfile.displayName walletBalance');
};

// Pre-save middleware to update timestamps and status
OrderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus') || this.isModified('paymentStatus')) {
    this.updatedAt = new Date();
  }
  
  // Auto-update order status based on payment
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && this.orderStatus === 'quote') {
    this.orderStatus = 'confirmed';
  }
  
  next();
});

// Pre-save middleware to validate line totals
OrderSchema.pre('save', function(next) {
  if (this.isModified('lines')) {
    let calculatedSubtotal = 0;
    
    this.lines.forEach(line => {
      // Skip validation if line data is incomplete (ReservationService hasn't processed it yet)
      if (!line.unitPrice || line.lineTotal === undefined || !line.duration) {
        return; // Skip this line, it will be validated after ReservationService processes it
      }
      
      // Use the duration calculated by ReservationService (which considers unitType)
      const expectedLineTotal = line.unitPrice * line.qty * line.duration;
      
      if (Math.abs(line.lineTotal - expectedLineTotal) > 0.01) {
        return next(new Error(`Line total does not match unit price × quantity × duration. Expected: ${expectedLineTotal}, got: ${line.lineTotal}`));
      }
      calculatedSubtotal += line.lineTotal;
    });
    
    // Only validate subtotal if all lines have been processed (have unitPrice and lineTotal)
    const allLinesProcessed = this.lines.every(line => line.unitPrice && line.lineTotal !== undefined && line.duration);
    if (allLinesProcessed && Math.abs(this.subtotal - calculatedSubtotal) > 0.01) {
      return next(new Error('Subtotal does not match sum of line totals'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
