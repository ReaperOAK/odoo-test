const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['manual', 'razorpay_payout', 'bank_transfer'],
    default: 'manual'
  },
  razorpayPayoutId: {
    type: String
  },
  razorpayFundAccountId: {
    type: String,
    sparse: true
  },
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    }
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  failureReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isTest: {
    type: Boolean,
    default: false
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

// Indexes for performance
PayoutSchema.index({ hostId: 1, status: 1 });
PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ razorpayPayoutId: 1 }, { sparse: true });
PayoutSchema.index({ createdAt: -1 });

// Virtual for payout reference
PayoutSchema.virtual('payoutReference').get(function() {
  if (this.method === 'razorpay_payout' && this.razorpayPayoutId) {
    return this.razorpayPayoutId;
  }
  return `PAYOUT-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for display amount (formatted)
PayoutSchema.virtual('displayAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
});

// Method to check if payout is successful
PayoutSchema.methods.isSuccessful = function() {
  return this.status === 'processed';
};

// Method to check if payout failed
PayoutSchema.methods.isFailed = function() {
  return ['failed', 'cancelled'].includes(this.status);
};

// Method to check if payout can be cancelled
PayoutSchema.methods.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.status);
};

// Method to mark as processed
PayoutSchema.methods.markAsProcessed = function(processedBy, notes = '') {
  this.status = 'processed';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  if (notes) {
    this.internalNotes = notes;
  }
  this.updatedAt = new Date();
};

// Method to mark as failed
PayoutSchema.methods.markAsFailed = function(reason, processedBy = null) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.updatedAt = new Date();
};

// Static method to find pending payouts
PayoutSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('hostId', 'name email hostProfile.displayName hostProfile.phone')
    .populate('orderIds', 'orderNumber subtotal platformCommission')
    .sort({ createdAt: 1 });
};

// Static method to find payouts by host
PayoutSchema.statics.findByHost = function(hostId) {
  return this.find({ hostId })
    .populate('processedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get payout statistics
PayoutSchema.statics.getStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to calculate pending payout amount for host
PayoutSchema.statics.getPendingAmount = async function(hostId) {
  const pipeline = [
    {
      $match: {
        hostId: new mongoose.Types.ObjectId(hostId),
        status: 'pending'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].totalAmount : 0;
};

// Pre-save middleware for validation
PayoutSchema.pre('save', function(next) {
  // Validate bank details if method is bank_transfer
  if (this.method === 'bank_transfer') {
    if (!this.bankDetails.accountNumber || !this.bankDetails.ifscCode || !this.bankDetails.accountHolderName) {
      return next(new Error('Bank details are required for bank transfer payouts'));
    }
  }
  
  // Set test flag based on environment
  if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
    this.isTest = true;
  }
  
  next();
});

// Pre-save middleware to update timestamps
PayoutSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Post-save middleware to update host wallet balance
PayoutSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    const host = await User.findById(doc.hostId);
    
    if (host && doc.isModified('status')) {
      if (doc.status === 'processed' && doc._original?.status !== 'processed') {
        // Deduct from wallet balance when payout is processed
        host.walletBalance = Math.max(0, host.walletBalance - doc.amount);
        await host.save();
      } else if (doc.status === 'failed' && doc._original?.status === 'processing') {
        // Add back to wallet balance if payout fails after processing
        host.walletBalance += doc.amount;
        await host.save();
      }
    }
  } catch (error) {
    console.error('Error updating host wallet balance:', error);
  }
});

// Store original document for comparison
PayoutSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

module.exports = mongoose.model('Payout', PayoutSchema);
