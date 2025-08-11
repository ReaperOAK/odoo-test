const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false // Optional during creation, set after order is saved
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000']
  },
  start: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(value) {
        // Allow past dates for completed/returned reservations or when explicitly seeding
        if (this.status === 'returned' || this.status === 'completed' || process.env.SEEDING_MODE === 'true') {
          return true;
        }
        return value >= new Date();
      },
      message: 'Start date cannot be in the past'
    }
  },
  end: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.start;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    enum: ['reserved', 'picked', 'active', 'returned', 'cancelled', 'disputed'],
    default: 'reserved'
  },
  pickupNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Pickup notes cannot exceed 1000 characters']
  },
  returnNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Return notes cannot exceed 1000 characters']
  },
  damageReport: {
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Damage description cannot exceed 2000 characters']
    },
    cost: {
      type: Number,
      min: [0, 'Damage cost cannot be negative']
    },
    images: [{
      type: String,
      trim: true
    }]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
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

// Critical compound index for availability checks
ReservationSchema.index({ listingId: 1, start: 1, end: 1 });
ReservationSchema.index({ listingId: 1, status: 1 });
ReservationSchema.index({ orderId: 1 });
ReservationSchema.index({ status: 1, createdAt: -1 });

// Virtual for duration in hours
ReservationSchema.virtual('durationHours').get(function() {
  return Math.ceil((this.end - this.start) / (1000 * 60 * 60));
});

// Virtual for duration in days
ReservationSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.end - this.start) / (1000 * 60 * 60 * 24));
});

// Virtual for duration in weeks
ReservationSchema.virtual('durationWeeks').get(function() {
  return Math.ceil((this.end - this.start) / (1000 * 60 * 60 * 24 * 7));
});

// Method to check if reservation overlaps with given period
ReservationSchema.methods.overlapsWith = function(start, end) {
  return this.start < new Date(end) && this.end > new Date(start);
};

// Method to check if reservation is active
ReservationSchema.methods.isActive = function() {
  return ['reserved', 'picked', 'active'].includes(this.status);
};

// Method to check if reservation can be cancelled
ReservationSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilStart = (this.start - now) / (1000 * 60 * 60);
  return this.status === 'reserved' && hoursUntilStart > 24; // 24-hour cancellation policy
};

// Static method to find overlapping reservations
ReservationSchema.statics.findOverlapping = function(listingId, start, end, excludeOrderId = null) {
  const query = {
    listingId: new mongoose.Types.ObjectId(listingId),
    status: { $in: ['reserved', 'picked', 'active'] },
    $expr: {
      $and: [
        { $lt: ['$start', new Date(end)] },
        { $gt: ['$end', new Date(start)] }
      ]
    }
  };
  
  if (excludeOrderId) {
    query.orderId = { $ne: new mongoose.Types.ObjectId(excludeOrderId) };
  }
  
  return this.find(query);
};

// Static method to calculate reserved quantity for a period
ReservationSchema.statics.getReservedQuantity = async function(listingId, start, end, excludeOrderId = null) {
  const pipeline = [
    {
      $match: {
        listingId: new mongoose.Types.ObjectId(listingId),
        status: { $in: ['reserved', 'picked', 'active'] },
        $expr: {
          $and: [
            { $lt: ['$start', new Date(end)] },
            { $gt: ['$end', new Date(start)] }
          ]
        },
        ...(excludeOrderId ? { orderId: { $ne: new mongoose.Types.ObjectId(excludeOrderId) } } : {})
      }
    },
    {
      $group: {
        _id: null,
        totalQty: { $sum: '$qty' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].totalQty : 0;
};

// Pre-save validation
ReservationSchema.pre('save', function(next) {
  // Ensure start date is before end date
  if (this.start >= this.end) {
    return next(new Error('Start date must be before end date'));
  }
  
  // Ensure minimum duration based on unit type (this would be set from listing)
  const durationHours = (this.end - this.start) / (1000 * 60 * 60);
  if (durationHours < 1) {
    return next(new Error('Minimum reservation duration is 1 hour'));
  }
  
  next();
});

// Status transition validation
ReservationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const validTransitions = {
      'reserved': ['picked', 'cancelled'],
      'picked': ['active', 'cancelled'],
      'active': ['returned', 'disputed'],
      'returned': ['disputed'],
      'cancelled': [],
      'disputed': ['returned']
    };
    
    const currentStatus = this.status;
    const previousStatus = this._original?.status;
    
    if (previousStatus && !validTransitions[previousStatus]?.includes(currentStatus)) {
      return next(new Error(`Invalid status transition from ${previousStatus} to ${currentStatus}`));
    }
  }
  next();
});

// Store original document for validation
ReservationSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

module.exports = mongoose.model('Reservation', ReservationSchema);
