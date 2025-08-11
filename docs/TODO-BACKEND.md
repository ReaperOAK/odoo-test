# Backend TODO - P2P Marketplace MVP (20 Hours)

## T0 - T1.5: Project Setup & Foundation (1.5 hours)

### T0 - T0.5: Initial Setup (30 minutes)
- [ ] Initialize Express.js project with TypeScript
  - [ ] `npm init -y`
  - [ ] Install dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`, `dotenv`, `express-rate-limit`
  - [ ] Install dev dependencies: `@types/node`, `@types/express`, `@types/jsonwebtoken`, `@types/bcryptjs`, `nodemon`, `ts-node`, `typescript`
  - [ ] Create `tsconfig.json` with proper configuration
  - [ ] Setup folder structure as per implementation plan
  - [ ] Create `.env.example` with all required environment variables
  - [ ] Initialize git repository and create `.gitignore`

### T0.5 - T1.5: Database & Auth Setup (1 hour)
- [ ] Setup MongoDB connection with Mongoose
  - [ ] Create `src/config/database.js` for MongoDB connection
  - [ ] Add connection error handling and retry logic
  - [ ] Setup MongoDB indexes configuration
- [ ] Create User model with complete schema
  - [ ] Include `isHost`, `hostProfile`, `walletBalance`, `role` fields
  - [ ] Add proper indexes for email and queries
  - [ ] Add validation rules and schema methods
- [ ] Implement JWT authentication middleware
  - [ ] Create `src/middleware/auth.js` for token verification
  - [ ] Create `src/middleware/roleCheck.js` for role-based access
  - [ ] Add token generation and validation utilities
- [ ] Create basic auth endpoints
  - [ ] `POST /api/auth/register` - user registration
  - [ ] `POST /api/auth/login` - user login
  - [ ] `GET /api/auth/me` - get current user profile
  - [ ] `PATCH /api/auth/profile` - update user profile
- [ ] Create seed script for initial users
  - [ ] 3 hosts with verified profiles
  - [ ] 5 customers
  - [ ] 1 admin user
  - [ ] Hash passwords properly

## T1.5 - T4.5: Core Models & Reservation Engine (3 hours)

### T1.5 - T2.5: Database Models (1 hour)
- [ ] Create Listing model (`src/models/Listing.js`)
  - [ ] Complete schema with all fields from implementation plan
  - [ ] Add text search indexes for title and description
  - [ ] Add compound indexes for location and category queries
  - [ ] Add virtual fields for computed properties
  - [ ] Add model methods for availability calculations
- [ ] Create Reservation model (`src/models/Reservation.js`)
  - [ ] Schema with listingId, orderId, qty, start, end, status
  - [ ] Critical indexes: `{ listingId: 1, start: 1, end: 1 }`
  - [ ] Add methods for overlap detection
  - [ ] Add status transition validations
- [ ] Create Order model (`src/models/Order.js`)
  - [ ] Complete schema with lines array, pricing fields
  - [ ] Add order status management
  - [ ] Add methods for total calculations
  - [ ] Add proper references and population paths
- [ ] Create Payment model (`src/models/Payment.js`)
  - [ ] Schema for Razorpay integration
  - [ ] Status tracking and metadata storage
  - [ ] Add idempotency handling
- [ ] Create Payout model (`src/models/Payout.js`)
  - [ ] Host payout tracking
  - [ ] Status management for admin processing

### T2.5 - T4.5: Reservation Engine & Services (2 hours)
- [ ] Implement reservation service (`src/services/reservation.service.js`)
  - [ ] `checkAvailability(listingId, start, end, qty)` function
  - [ ] MongoDB aggregation for overlap detection
  - [ ] Efficient availability calculation with caching
  - [ ] Handle edge cases (same-day, hour boundaries)
- [ ] Implement transactional order creation
  - [ ] `createOrderAndReserve()` function with MongoDB sessions
  - [ ] Atomic reservation creation with conflict detection
  - [ ] Rollback mechanism for failed transactions
  - [ ] Proper error handling and status codes
- [ ] Create pricing service (`src/services/pricing.service.js`)
  - [ ] Calculate subtotal based on duration and unit type
  - [ ] Calculate deposit (percentage or flat rate)
  - [ ] Calculate platform commission (configurable %)
  - [ ] Handle promo codes and discounts
  - [ ] Tax calculations if applicable
- [ ] Implement notification service (`src/services/notification.service.js`)
  - [ ] Email templates for booking confirmations
  - [ ] Host notifications for new bookings
  - [ ] Payment success/failure notifications
  - [ ] Status update notifications
- [ ] Add comprehensive error handling
  - [ ] Custom error classes for different scenarios
  - [ ] Proper HTTP status codes
  - [ ] Error logging and monitoring setup

## T4.5 - T7.5: Order Management & Payment Integration (3 hours)

### T4.5 - T5.5: Order APIs (1 hour)
- [ ] Implement order controller (`src/controllers/order.controller.js`)
  - [ ] `POST /api/orders` - create order with reservation transaction
  - [ ] `GET /api/orders/:id` - get order details with full population
  - [ ] `GET /api/orders` - list orders with filters (user/host/admin)
  - [ ] `PATCH /api/orders/:id/status` - update order status
- [ ] Add order validation middleware
  - [ ] Validate date ranges and quantities
  - [ ] Check user permissions for order access
  - [ ] Validate status transitions
- [ ] Implement order status management
  - [ ] State machine for order lifecycle
  - [ ] Automatic status updates based on time
  - [ ] Proper logging for audit trail

### T5.5 - T7.5: Razorpay Integration (2 hours)
- [ ] Setup Razorpay service (`src/services/razorpay.service.js`)
  - [ ] Initialize Razorpay instance with credentials
  - [ ] `createRazorpayOrder()` function
  - [ ] `verifyPaymentSignature()` function
  - [ ] Handle payment success/failure
  - [ ] Mock mode for offline demo
- [ ] Implement payment controller (`src/controllers/payment.controller.js`)
  - [ ] `POST /api/orders/:id/pay` - initiate payment
  - [ ] `POST /api/orders/:id/confirm-payment` - confirm client-side payment
  - [ ] `POST /api/webhooks/razorpay` - handle webhooks
  - [ ] Payment status tracking and updates
- [ ] Create webhook handler
  - [ ] Verify Razorpay signature with HMAC
  - [ ] Update order and payment status
  - [ ] Handle idempotency (duplicate webhooks)
  - [ ] Update host wallet balance
  - [ ] Send confirmation notifications
- [ ] Add payment mode fallback
  - [ ] `PAYMENT_MODE=mock` environment variable
  - [ ] Create fake payment records for demo
  - [ ] Simulate payment success/failure
  - [ ] Emit events for status updates

## T7.5 - T10.5: Host Dashboard & Admin Features (3 hours)

### T7.5 - T9: Host Management (1.5 hours)
- [ ] Implement listing controller (`src/controllers/listing.controller.js`)
  - [ ] `GET /api/listings` - public listing with availability filtering
  - [ ] `GET /api/listings/:id` - single listing detail
  - [ ] `POST /api/listings` - create listing (host only)
  - [ ] `PATCH /api/listings/:id` - update listing (owner only)
  - [ ] `DELETE /api/listings/:id` - soft delete listing
  - [ ] `GET /api/listings/:id/availability` - check availability
- [ ] Add listing search and filtering
  - [ ] Text search with MongoDB text indexes
  - [ ] Category and location filtering
  - [ ] Price range filtering
  - [ ] Date availability filtering
  - [ ] Pagination and sorting
- [ ] Implement host controller (`src/controllers/host.controller.js`)
  - [ ] `GET /api/host/dashboard` - host dashboard stats
  - [ ] `GET /api/host/orders` - host's orders with filtering
  - [ ] `GET /api/host/calendar` - calendar events for host
  - [ ] `POST /api/host/orders/:id/pickup` - mark pickup
  - [ ] `POST /api/host/orders/:id/return` - mark return
  - [ ] Host profile management endpoints

### T9 - T10.5: Admin & Payout System (1.5 hours)
- [ ] Implement admin controller (`src/controllers/admin.controller.js`)
  - [ ] `GET /api/admin/dashboard` - admin dashboard stats
  - [ ] `GET /api/admin/orders` - all orders with advanced filtering
  - [ ] `GET /api/admin/users` - user management
  - [ ] `GET /api/admin/payouts` - pending payouts list
  - [ ] `POST /api/admin/payouts/:id/process` - process payout
  - [ ] `GET /api/admin/reports` - revenue and usage reports
- [ ] Create payout service (`src/services/payout.service.js`)
  - [ ] Calculate host earnings from completed orders
  - [ ] Create payout records
  - [ ] Mock payout processing for demo
  - [ ] Track payout status and history
  - [ ] Generate payout statements
- [ ] Add admin middleware and permissions
  - [ ] Role-based access control
  - [ ] Admin-only route protection
  - [ ] Audit logging for admin actions
- [ ] Implement dispute handling
  - [ ] Flag orders for disputes
  - [ ] Damage assessment workflow
  - [ ] Resolution tracking

## T10.5 - T13.5: Testing, Validation & Polish (3 hours)

### T10.5 - T11.5: Data Validation & Security (1 hour)
- [ ] Add comprehensive input validation
  - [ ] Use Joi or express-validator for request validation
  - [ ] Validate all date ranges and quantities
  - [ ] Sanitize user inputs
  - [ ] Add rate limiting to all endpoints
- [ ] Implement security middleware
  - [ ] Helmet for security headers
  - [ ] CORS configuration
  - [ ] Request size limits
  - [ ] SQL injection prevention (though using Mongoose)
- [ ] Add error handling middleware
  - [ ] Global error handler
  - [ ] Proper error response formatting
  - [ ] Error logging with levels
  - [ ] Development vs production error responses

### T11.5 - T12.5: Seed Data & Demo Setup (1 hour)
- [ ] Create comprehensive seed script (`seed.js`)
  - [ ] 3 hosts with complete profiles and verification
  - [ ] 8-10 listings across different categories
  - [ ] 5 customers with booking history
  - [ ] Sample orders in different states
  - [ ] Test data for concurrent booking scenarios
- [ ] Add database reset functionality
  - [ ] `npm run seed` script
  - [ ] `npm run reset` to clear and reseed
  - [ ] Environment-specific seeding
- [ ] Create demo mode configuration
  - [ ] `DEMO_MODE=true` environment variable
  - [ ] Pre-populate realistic data
  - [ ] Faster payment processing for demo

### T12.5 - T13.5: API Testing & Documentation (1 hour)
- [ ] Create Postman collection for all endpoints
  - [ ] Authentication flows
  - [ ] Complete booking flow
  - [ ] Host management operations
  - [ ] Admin operations
  - [ ] Error scenarios
- [ ] Add basic unit tests for critical functions
  - [ ] Reservation conflict detection
  - [ ] Pricing calculations
  - [ ] Payment processing
  - [ ] Status transitions
- [ ] Create API documentation
  - [ ] Endpoint descriptions and examples
  - [ ] Request/response schemas
  - [ ] Error codes and messages
  - [ ] Authentication requirements

## T13.5 - T16: Containerization & Deployment (2.5 hours)

### T13.5 - T14.5: Docker Setup (1 hour)
- [ ] Create Dockerfile for backend
  - [ ] Multi-stage build for optimization
  - [ ] Proper file copying and layer caching
  - [ ] Health check endpoint
  - [ ] Non-root user for security
- [ ] Create docker-compose.yml
  - [ ] Backend service configuration
  - [ ] MongoDB service with persistent volume
  - [ ] Environment variable management
  - [ ] Network configuration between services
- [ ] Add development docker setup
  - [ ] Hot reload configuration
  - [ ] Volume mounts for development
  - [ ] Debug port exposure

### T14.5 - T16: Production Readiness (1.5 hours)
- [ ] Add monitoring and logging
  - [ ] Winston logger configuration
  - [ ] Request logging middleware
  - [ ] Performance monitoring
  - [ ] Health check endpoints
- [ ] Environment configuration
  - [ ] Production vs development configs
  - [ ] Secure secret management
  - [ ] Database connection pooling
  - [ ] Graceful shutdown handling
- [ ] Add backup and recovery scripts
  - [ ] Database backup procedures
  - [ ] Data migration scripts
  - [ ] Rollback procedures

## T16 - T18: Concurrency Testing & Edge Cases (2 hours)

### T16 - T17: Concurrency Testing (1 hour)
- [ ] Create concurrent booking test scripts
  - [ ] Simulate multiple users booking same item
  - [ ] Test reservation conflict detection
  - [ ] Verify transaction rollback behavior
  - [ ] Load testing with multiple requests
- [ ] Test edge cases
  - [ ] Timezone handling across different regions
  - [ ] Overnight rentals and date boundaries
  - [ ] Partial availability scenarios
  - [ ] Payment failures and retries

### T17 - T18: Performance Optimization (1 hour)
- [ ] Database query optimization
  - [ ] Add missing indexes based on query patterns
  - [ ] Optimize aggregation pipelines
  - [ ] Add query result caching where appropriate
  - [ ] Monitor slow queries
- [ ] API response optimization
  - [ ] Implement response compression
  - [ ] Add ETag headers for caching
  - [ ] Optimize data serialization
  - [ ] Reduce unnecessary data in responses

## T18 - T20: Final Polish & Demo Preparation (2 hours)

### T18 - T19: Final Testing & Bug Fixes (1 hour)
- [ ] End-to-end flow testing
  - [ ] Complete customer booking journey
  - [ ] Host order management workflow
  - [ ] Admin payout processing
  - [ ] Error handling scenarios
- [ ] Fix any discovered bugs
  - [ ] Payment processing issues
  - [ ] Status update problems
  - [ ] Data validation errors
  - [ ] Performance bottlenecks

### T19 - T20: Demo Preparation (1 hour)
- [ ] Prepare demo environment
  - [ ] Reset database with clean demo data
  - [ ] Configure demo mode settings
  - [ ] Test all demo scenarios
  - [ ] Prepare backup demo data
- [ ] Create demo scripts and documentation
  - [ ] Step-by-step demo flow
  - [ ] Troubleshooting guide
  - [ ] API testing commands
  - [ ] Reset procedures
- [ ] Final deployment verification
  - [ ] All services running correctly
  - [ ] External integrations working
  - [ ] Performance acceptable
  - [ ] Error handling graceful

## Critical Implementation Notes

### Database Transactions
```javascript
// Example reservation transaction implementation
async function createOrderAndReserve(orderData, session) {
  const sessionLocal = session || await mongoose.startSession();
  try {
    await sessionLocal.startTransaction();
    
    // Check availability and create reservations
    for (const line of orderData.lines) {
      const conflicts = await checkReservationConflicts(line, sessionLocal);
      if (conflicts.length > 0) {
        throw new Error('Booking conflict detected');
      }
      await createReservation(line, sessionLocal);
    }
    
    // Create order
    const order = await createOrder(orderData, sessionLocal);
    
    await sessionLocal.commitTransaction();
    return order;
  } catch (error) {
    await sessionLocal.abortTransaction();
    throw error;
  } finally {
    await sessionLocal.endSession();
  }
}
```

### Availability Algorithm
```javascript
// Efficient availability check with aggregation
async function checkAvailability(listingId, start, end, requestedQty) {
  const overlappingReservations = await Reservation.aggregate([
    {
      $match: {
        listingId: mongoose.Types.ObjectId(listingId),
        status: { $in: ['reserved', 'active', 'picked'] },
        $expr: {
          $and: [
            { $lt: ['$start', new Date(end)] },
            { $gt: ['$end', new Date(start)] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalReserved: { $sum: '$qty' }
      }
    }
  ]);
  
  const listing = await Listing.findById(listingId);
  const reservedQty = overlappingReservations[0]?.totalReserved || 0;
  const availableQty = listing.totalQuantity - reservedQty;
  
  return {
    available: availableQty >= requestedQty,
    availableQty,
    requestedQty
  };
}
```

### Environment Variables Required
```
# Database
MONGODB_URI=mongodb://localhost:27017/p2p-marketplace
MONGODB_TEST_URI=mongodb://localhost:27017/p2p-marketplace-test

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Application
NODE_ENV=development
PORT=5000
PAYMENT_MODE=mock
DEMO_MODE=false

# Email (optional for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
```

### Critical Success Metrics
- [ ] Concurrent booking conflict detection (100% accuracy)
- [ ] Payment processing (100% success in mock mode)
- [ ] API response times (<500ms for all endpoints)
- [ ] Database transaction success rate (>99.9%)
- [ ] Error handling coverage (all error scenarios handled)
