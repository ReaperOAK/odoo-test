# P2P Marketplace Demo Guide

## Demo Credentials

### Admin
- Email: `admin@marketplace.com`
- Password: `admin123`

### Hosts
- **Electronics Host**: `john@electronics.com` / `host123`
- **Sports Host**: `sarah@sports.com` / `host123`  
- **Music Host**: `mike@music.com` / `host123`

### Customers
- **Customer 1**: `alice@customer.com` / `customer123`
- **Customer 2**: `bob@customer.com` / `customer123`
- **Customer 3**: `carol@customer.com` / `customer123`

## Demo Workflow

### 1. Browse Listings (Guest)
- Visit http://localhost:5173
- Browse available listings
- Use search and filters
- View listing details

### 2. Customer Experience
- Login as a customer: `alice@customer.com` / `customer123`
- Browse and search listings
- Click on a listing to view details
- Fill booking form with dates and quantity
- Check availability
- Create booking
- Complete mock payment
- View booking in "My Bookings"

### 3. Host Experience  
- Login as a host: `john@electronics.com` / `host123`
- Go to Host Dashboard
- View earnings, bookings, and listings
- Manage existing listings
- View booking calendar

### 4. Admin Experience
- Login as admin: `admin@marketplace.com` / `admin123`
- View admin dashboard
- Monitor platform statistics
- Manage users and payouts

## Key Features Demonstrated

✅ **User Authentication & Roles**
- Customer, Host, Admin roles
- JWT-based authentication
- Role-based access control

✅ **Listing Management**
- Browse listings with search/filter
- Detailed listing views
- Host can manage their listings
- Categories: electronics, sports, music, etc.

✅ **Booking System**
- Real-time availability checking
- Date selection and quantity
- Deposit vs full payment options
- Order creation with reservations

✅ **Payment Integration**
- Mock payment system for demo
- Payment status tracking
- Razorpay integration ready

✅ **Host Dashboard**
- Earnings overview
- Booking management
- Performance metrics
- Listing management

✅ **Responsive Design**
- Mobile-first approach
- Tailwind CSS styling
- Modern UI components

✅ **Database Transactions**
- Atomic reservation system
- Concurrent booking protection
- MongoDB transactions

## Backend API Highlights

- **REST API** with comprehensive endpoints
- **MongoDB** with optimized indexes
- **Rate limiting** and security headers
- **Error handling** and logging
- **Docker support** for easy deployment
- **Comprehensive seed data** for demo

## Technical Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT authentication
- Razorpay payment integration
- Winston logging
- Helmet security

## Concurrent Booking Test

To test concurrent booking prevention:
1. Open two browser tabs
2. Login as different customers
3. Try to book the same item for overlapping dates
4. One will succeed, other will get conflict error

## API Testing

Use the provided Postman collection or test endpoints:
- `GET /api/listings` - Browse listings
- `POST /api/auth/login` - User login
- `POST /api/orders` - Create booking
- `GET /api/host/dashboard` - Host dashboard

The application demonstrates a complete P2P marketplace with real-world features including user management, secure booking system, payment processing, and responsive design.
