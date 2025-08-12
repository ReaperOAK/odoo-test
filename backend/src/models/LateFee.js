const mongoose = require('mongoose');

const LateFeeSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
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
  type: {
    type: String,
    enum: ['payment_overdue', 'return_overdue', 'damage_fee', 'custom'],
    required: [true, 'Late fee type is required']
  },
  baseAmount: {
    type: Number,
    required: [true, 'Base amount is required'],
    min: [0, 'Base amount cannot be negative']
  },
  dailyRate: {
    type: Number,
    required: [true, 'Daily rate is required'],
    min: [0, 'Daily rate cannot be negative']
  },
  maxAmount: {
    type: Number,
    required: [true, 'Maximum amount is required'],
    min: [0, 'Maximum amount cannot be negative']
  },
  currentAmount: {
    type: Number,
    required: [true, 'Current amount is required'],
    min: [0, 'Current amount cannot be negative']
  },
  daysOverdue: {
    type: Number,
    required: [true, 'Days overdue is required'],
    min: [0, 'Days overdue cannot be negative']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'waived', 'disputed', 'cancelled'],
    default: 'active'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  autoApplied: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  waiverReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Waiver reason cannot exceed 500 characters']
  },
  waivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  waivedAt: {
    type: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['warning', 'applied', 'increased', 'paid', 'waived'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  calculations: [{
    date: {
      type: Date,
      default: Date.now
    },
    daysOverdue: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    calculation: {
      type: String,
      required: true
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
LateFeeSchema.index({ orderId: 1 });
LateFeeSchema.index({ renterId: 1 });
LateFeeSchema.index({ hostId: 1 });
LateFeeSchema.index({ status: 1 });
LateFeeSchema.index({ dueDate: 1 });
LateFeeSchema.index({ type: 1 });
LateFeeSchema.index({ paymentStatus: 1 });
LateFeeSchema.index({ createdAt: -1 });

// Compound indexes
LateFeeSchema.index({ status: 1, dueDate: 1 });
LateFeeSchema.index({ renterId: 1, status: 1 });
LateFeeSchema.index({ orderId: 1, type: 1 });

// Pre-save middleware to calculate current amount
LateFeeSchema.pre('save', function(next) {
  if (this.isModified('daysOverdue') || this.isNew) {
    this.currentAmount = Math.min(
      this.baseAmount + (this.dailyRate * this.daysOverdue),
      this.maxAmount
    );
    this.lastCalculated = new Date();
    
    // Add calculation record
    this.calculations.push({
      daysOverdue: this.daysOverdue,
      amount: this.currentAmount,
      calculation: `Base: ₹${this.baseAmount} + (Daily: ₹${this.dailyRate} × Days: ${this.daysOverdue}) = ₹${this.currentAmount} (Max: ₹${this.maxAmount})`
    });
  }
  next();
});

// Method to calculate and update late fee
LateFeeSchema.methods.updateAmount = function() {
  const now = new Date();
  const timeDiff = now.getTime() - this.dueDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff > this.daysOverdue) {
    this.daysOverdue = Math.max(0, daysDiff);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to waive late fee
LateFeeSchema.methods.waive = function(reason, waivedBy) {
  this.status = 'waived';
  this.waiverReason = reason;
  this.waivedBy = waivedBy;
  this.waivedAt = new Date();
  return this.save();
};

// Method to mark as paid
LateFeeSchema.methods.markPaid = function() {
  this.status = 'paid';
  this.paymentStatus = 'paid';
  return this.save();
};

// Static method to find active late fees
LateFeeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find overdue items needing late fees
LateFeeSchema.statics.findOverdueOrders = async function() {
  const Order = mongoose.model('Order');
  const now = new Date();
  
  // Find orders with overdue payments
  const overduePayments = await Order.find({
    paymentStatus: { $in: ['pending', 'failed'] },
    'lines.end': { $lt: now },
    orderStatus: { $in: ['confirmed', 'in_progress'] }
  }).populate('renterId hostId');
  
  // Find orders with overdue returns
  const overdueReturns = await Order.find({
    paymentStatus: 'paid',
    orderStatus: 'in_progress',
    'lines.end': { $lt: now }
  }).populate('renterId hostId');
  
  return { overduePayments, overdueReturns };
};

module.exports = mongoose.model('LateFee', LateFeeSchema);
