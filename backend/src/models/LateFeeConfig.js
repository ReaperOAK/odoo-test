const mongoose = require('mongoose');

const LateFeeConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Configuration name is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['payment_overdue', 'return_overdue', 'damage_fee', 'custom'],
    required: [true, 'Late fee type is required']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  gracePeriodDays: {
    type: Number,
    required: [true, 'Grace period days is required'],
    min: [0, 'Grace period cannot be negative'],
    default: 0
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
  calculationMethod: {
    type: String,
    enum: ['fixed', 'percentage', 'compound'],
    default: 'fixed'
  },
  percentageBase: {
    type: String,
    enum: ['order_total', 'remaining_amount', 'deposit_amount'],
    default: 'order_total'
  },
  compoundFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  autoApply: {
    type: Boolean,
    default: true
  },
  notificationSettings: {
    warningDays: {
      type: [Number],
      default: [1, 3, 7] // Days before due date to send warnings
    },
    reminderFrequency: {
      type: Number,
      default: 3 // Days between reminders after fee applied
    },
    methods: {
      type: [String],
      enum: ['email', 'sms', 'push', 'in_app'],
      default: ['email', 'in_app']
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  applicableCategories: {
    type: [String],
    default: [] // Empty array means applies to all categories
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  maximumOrderAmount: {
    type: Number,
    default: 0 // 0 means no maximum
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  terms: {
    type: String,
    trim: true,
    maxlength: [2000, 'Terms cannot exceed 2000 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
LateFeeConfigSchema.index({ type: 1 });
LateFeeConfigSchema.index({ enabled: 1 });
LateFeeConfigSchema.index({ priority: -1 });
LateFeeConfigSchema.index({ name: 1 }, { unique: true });

// Ensure only one default config per type
LateFeeConfigSchema.index({ type: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

// Pre-save middleware to handle default configurations
LateFeeConfigSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other configs of the same type
    await this.constructor.updateMany(
      { type: this.type, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Method to calculate late fee for an order
LateFeeConfigSchema.methods.calculateFee = function(order, daysOverdue) {
  let amount = 0;
  
  switch (this.calculationMethod) {
    case 'fixed':
      amount = this.baseAmount + (this.dailyRate * Math.max(0, daysOverdue - this.gracePeriodDays));
      break;
      
    case 'percentage':
      let baseAmount = 0;
      switch (this.percentageBase) {
        case 'order_total':
          baseAmount = order.totalAmount;
          break;
        case 'remaining_amount':
          baseAmount = order.remainingAmount || order.totalAmount;
          break;
        case 'deposit_amount':
          baseAmount = order.depositAmount;
          break;
      }
      amount = this.baseAmount + (baseAmount * (this.dailyRate / 100) * Math.max(0, daysOverdue - this.gracePeriodDays));
      break;
      
    case 'compound':
      const effectiveDays = Math.max(0, daysOverdue - this.gracePeriodDays);
      const periods = this.compoundFrequency === 'daily' ? effectiveDays : 
                     this.compoundFrequency === 'weekly' ? Math.floor(effectiveDays / 7) :
                     Math.floor(effectiveDays / 30);
      amount = this.baseAmount * Math.pow(1 + (this.dailyRate / 100), periods);
      break;
  }
  
  return Math.min(amount, this.maxAmount);
};

// Static method to get applicable config for an order
LateFeeConfigSchema.statics.getApplicableConfig = async function(type, order) {
  const configs = await this.find({
    type: type,
    enabled: true,
    $or: [
      { applicableCategories: { $size: 0 } },
      { applicableCategories: { $in: [order.category] } }
    ],
    $and: [
      { minimumOrderAmount: { $lte: order.totalAmount } },
      { $or: [
        { maximumOrderAmount: 0 },
        { maximumOrderAmount: { $gte: order.totalAmount } }
      ]}
    ]
  }).sort({ priority: -1, isDefault: -1 });
  
  return configs[0] || null;
};

// Static method to get default config for a type
LateFeeConfigSchema.statics.getDefaultConfig = function(type) {
  return this.findOne({ type: type, isDefault: true });
};

module.exports = mongoose.model('LateFeeConfig', LateFeeConfigSchema);
