const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  images: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'vehicles', 'sports', 'music', 'tools', 'furniture', 'other']
  },
  unitType: {
    type: String,
    enum: ['hour', 'day', 'week'],
    default: 'day',
    required: [true, 'Unit type is required']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [1, 'Base price must be at least 1'],
    max: [1000000, 'Base price cannot exceed 1,000,000']
  },
  depositType: {
    type: String,
    enum: ['flat', 'percent'],
    default: 'percent'
  },
  depositValue: {
    type: Number,
    default: 20,
    min: [0, 'Deposit value cannot be negative'],
    validate: {
      validator: function(value) {
        if (this.depositType === 'percent') {
          return value >= 0 && value <= 100;
        }
        return value >= 0;
      },
      message: 'Invalid deposit value for selected type'
    }
  },
  totalQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Total quantity must be at least 1'],
    max: [1000, 'Total quantity cannot exceed 1000']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'disabled'],
    default: 'published'
  },
  features: [{
    type: String,
    trim: true,
    maxlength: [100, 'Feature cannot exceed 100 characters']
  }],
  rules: [{
    type: String,
    trim: true,
    maxlength: [200, 'Rule cannot exceed 200 characters']
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
ListingSchema.index({ title: 'text', description: 'text' });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ location: 1 });
ListingSchema.index({ ownerId: 1, status: 1 });
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ basePrice: 1 });

// Virtual for primary image
ListingSchema.virtual('primaryImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Virtual for calculated deposit amount
ListingSchema.virtual('depositAmount').get(function() {
  if (this.depositType === 'percent') {
    return Math.round((this.basePrice * this.depositValue) / 100);
  }
  return this.depositValue;
});

// Method to calculate price for duration
ListingSchema.methods.calculatePrice = function(quantity = 1, duration = 1) {
  const subtotal = this.basePrice * quantity * duration;
  const depositAmount = this.depositType === 'percent' 
    ? Math.round((subtotal * this.depositValue) / 100)
    : this.depositValue * quantity;
  
  return {
    subtotal,
    depositAmount,
    basePrice: this.basePrice,
    quantity,
    duration
  };
};

// Method to check if listing can be booked
ListingSchema.methods.canBeBooked = function() {
  return this.status === 'published' && this.isActive && this.totalQuantity > 0;
};

// Static method to find available listings
ListingSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    status: 'published',
    isActive: true,
    totalQuantity: { $gt: 0 }
  };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.location) {
    query.location = new RegExp(filters.location, 'i');
  }
  
  if (filters.minPrice || filters.maxPrice) {
    query.basePrice = {};
    if (filters.minPrice) query.basePrice.$gte = filters.minPrice;
    if (filters.maxPrice) query.basePrice.$lte = filters.maxPrice;
  }
  
  return this.find(query).populate('ownerId', 'name email hostProfile.verified hostProfile.displayName');
};

// Pre-save middleware
ListingSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    // Remove duplicates and empty strings
    this.images = [...new Set(this.images.filter(img => img && img.trim()))];
  }
  next();
});

module.exports = mongoose.model('Listing', ListingSchema);
