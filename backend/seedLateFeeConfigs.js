const mongoose = require('mongoose');
const LateFeeConfig = require('./src/models/LateFeeConfig');
require('dotenv').config();

const seedLateFeeConfigs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing configurations
    await LateFeeConfig.deleteMany({});
    console.log('Cleared existing late fee configurations');

    // Default configurations
    const configs = [
      {
        name: 'Standard Payment Overdue',
        type: 'payment_overdue',
        enabled: true,
        gracePeriodDays: 1,
        baseAmount: 50,
        dailyRate: 25,
        maxAmount: 500,
        calculationMethod: 'fixed',
        autoApply: true,
        notificationSettings: {
          warningDays: [1, 3, 7],
          reminderFrequency: 3,
          methods: ['email', 'in_app'],
          enabled: true
        },
        description: 'Standard late fee for overdue payments - ₹50 base + ₹25 per day (max ₹500)',
        terms: 'Late payment fees apply after 1 day grace period. Fees are calculated as base amount plus daily rate.',
        isDefault: true,
        priority: 10
      },
      {
        name: 'Standard Return Overdue',
        type: 'return_overdue',
        enabled: true,
        gracePeriodDays: 0,
        baseAmount: 100,
        dailyRate: 50,
        maxAmount: 1000,
        calculationMethod: 'fixed',
        autoApply: true,
        notificationSettings: {
          warningDays: [1, 3],
          reminderFrequency: 2,
          methods: ['email', 'sms', 'in_app'],
          enabled: true
        },
        description: 'Standard late fee for overdue returns - ₹100 base + ₹50 per day (max ₹1000)',
        terms: 'Late return fees apply immediately after the return due date with no grace period.',
        isDefault: true,
        priority: 10
      },
      {
        name: 'High Value Payment Overdue',
        type: 'payment_overdue',
        enabled: true,
        gracePeriodDays: 1,
        baseAmount: 100,
        dailyRate: 2, // 2% per day
        maxAmount: 2000,
        calculationMethod: 'percentage',
        percentageBase: 'order_total',
        autoApply: true,
        minimumOrderAmount: 5000,
        notificationSettings: {
          warningDays: [1, 2, 3, 5, 7],
          reminderFrequency: 2,
          methods: ['email', 'sms', 'in_app'],
          enabled: true
        },
        description: 'Late fee for high-value orders - ₹100 base + 2% of order value per day (max ₹2000)',
        terms: 'For orders above ₹5000, percentage-based late fees apply.',
        isDefault: false,
        priority: 20
      },
      {
        name: 'Electronics Return Overdue',
        type: 'return_overdue',
        enabled: true,
        gracePeriodDays: 0,
        baseAmount: 200,
        dailyRate: 100,
        maxAmount: 2000,
        calculationMethod: 'fixed',
        autoApply: true,
        applicableCategories: ['Electronics', 'Cameras', 'Gadgets'],
        notificationSettings: {
          warningDays: [1],
          reminderFrequency: 1,
          methods: ['email', 'sms', 'in_app'],
          enabled: true
        },
        description: 'Higher late fees for electronics - ₹200 base + ₹100 per day (max ₹2000)',
        terms: 'Electronics have higher late fees due to depreciation and demand.',
        isDefault: false,
        priority: 15
      },
      {
        name: 'Damage Assessment Fee',
        type: 'damage_fee',
        enabled: true,
        gracePeriodDays: 0,
        baseAmount: 500,
        dailyRate: 0,
        maxAmount: 10000,
        calculationMethod: 'fixed',
        autoApply: false, // Manual application for damage fees
        notificationSettings: {
          warningDays: [],
          reminderFrequency: 7,
          methods: ['email', 'in_app'],
          enabled: true
        },
        description: 'Base damage assessment fee - manually applied based on actual damage',
        terms: 'Damage fees are assessed based on actual repair costs or replacement value.',
        isDefault: true,
        priority: 5
      }
    ];

    // Insert configurations
    const insertedConfigs = await LateFeeConfig.insertMany(configs);
    console.log(`Created ${insertedConfigs.length} late fee configurations:`);
    
    insertedConfigs.forEach(config => {
      console.log(`- ${config.name} (${config.type}): ${config.isDefault ? 'DEFAULT' : 'CUSTOM'}`);
    });

    console.log('\nLate fee configuration seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding late fee configurations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed script
if (require.main === module) {
  seedLateFeeConfigs();
}

module.exports = seedLateFeeConfigs;
