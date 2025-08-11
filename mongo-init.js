// MongoDB initialization script
db = db.getSiblingDB('p2p_marketplace');

// Create collections with proper indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isHost: 1 });
db.users.createIndex({ role: 1 });

db.listings.createIndex({ ownerId: 1 });
db.listings.createIndex({ status: 1 });
db.listings.createIndex({ category: 1 });
db.listings.createIndex({ location: 1 });
db.listings.createIndex({ title: "text", description: "text" });

db.reservations.createIndex({ listingId: 1, start: 1, end: 1 });
db.reservations.createIndex({ orderId: 1 });
db.reservations.createIndex({ status: 1 });

db.orders.createIndex({ renterId: 1, createdAt: -1 });
db.orders.createIndex({ hostId: 1, createdAt: -1 });
db.orders.createIndex({ orderStatus: 1 });
db.orders.createIndex({ paymentStatus: 1 });

db.payments.createIndex({ orderId: 1 });
db.payments.createIndex({ razorpayOrderId: 1 });
db.payments.createIndex({ status: 1 });

db.payouts.createIndex({ hostId: 1 });
db.payouts.createIndex({ status: 1 });

print('Database initialized with indexes');
