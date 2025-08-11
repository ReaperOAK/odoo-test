const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['polar', 'mock', 'manual']
  },
  polarPaymentId: {
    type: String
  },
  polarSessionId: {
    type: String
  },
  polarSignature: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['initiated', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'initiated'
  },
  gateway: {
    type: String,
    enum: ['polar', 'mock'],
    default: 'mock'
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  failureReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
    default: 0
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Refund reason cannot exceed 500 characters']
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhook: {
    received: {
      type: Boolean,
      default: false
    },
    signature: {
      type: String
    },
    payload: {
      type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date
    }
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
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ polarSessionId: 1 }, { sparse: true });
PaymentSchema.index({ polarPaymentId: 1 }, { sparse: true });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ method: 1, status: 1 });

// Virtual for payment reference
PaymentSchema.virtual('paymentReference').get(function() {
  if (this.method === 'polar' && this.polarPaymentId) {
    return this.polarPaymentId;
  }
  return `PAY-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for display amount (formatted)
PaymentSchema.virtual('displayAmount').get(function() {
  return `$${this.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
});

// Method to check if payment is successful
PaymentSchema.methods.isSuccessful = function() {
  return this.status === 'success';
};

// Method to check if payment failed
PaymentSchema.methods.isFailed = function() {
  return ['failed', 'cancelled'].includes(this.status);
};

// Method to check if payment can be refunded
PaymentSchema.methods.canBeRefunded = function() {
  return this.status === 'success' && this.refundAmount < this.amount;
};

// Method to get refundable amount
PaymentSchema.methods.getRefundableAmount = function() {
  if (!this.canBeRefunded()) return 0;
  return this.amount - this.refundAmount;
};

// Method to mark as webhook received
PaymentSchema.methods.markWebhookReceived = function(signature, payload) {
  this.webhook = {
    received: true,
    signature,
    payload,
    timestamp: new Date()
  };
  this.updatedAt = new Date();
};

// Static method to find by Razorpay order ID
PaymentSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

// Static method to find by Razorpay payment ID
PaymentSchema.statics.findByRazorpayPaymentId = function(razorpayPaymentId) {
  return this.findOne({ razorpayPaymentId });
};

// Static method to get payment statistics
PaymentSchema.statics.getStats = async function(startDate, endDate) {
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

// Pre-save middleware for validation
PaymentSchema.pre('save', function(next) {
  // Validate refund amount
  if (this.refundAmount > this.amount) {
    return next(new Error('Refund amount cannot exceed payment amount'));
  }
  
  // Set test flag based on environment or Razorpay test keys
  if (this.method === 'mock' || (this.razorpayOrderId && this.razorpayOrderId.startsWith('order_test'))) {
    this.isTest = true;
  }
  
  next();
});

// Pre-save middleware to update timestamps
PaymentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Post-save middleware to update order payment status
PaymentSchema.post('save', async function(doc) {
  try {
    const Order = mongoose.model('Order');
    const order = await Order.findById(doc.orderId);
    
    if (order) {
      if (doc.status === 'success' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.addTimelineEntry('payment_success', null, `Payment successful: ${doc.paymentReference}`);
        await order.save();
      } else if (doc.isFailed() && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed';
        order.addTimelineEntry('payment_failed', null, `Payment failed: ${doc.failureReason || 'Unknown error'}`);
        await order.save();
      }
    }
  } catch (error) {
    console.error('Error updating order payment status:', error);
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
