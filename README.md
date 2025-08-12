# P2P Marketplace Platform

A comprehensive peer-to-peer marketplace platform where users can rent out items to each other. Built with modern web technologies including Node.js, Express, MongoDB, React, and integrated with Razorpay for payments.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Item Listings**: Create, update, and manage rental listings
- **Order Processing**: Complete order lifecycle from creation to completion
- **Payment Integration**: Secure payments with Razorpay integration
- **Email Notifications**: Automated email notifications with Resend
- **Real-time Availability**: Check item availability for specific dates
- **Host Dashboard**: Comprehensive dashboard for hosts to manage their listings
- **Admin Panel**: Full administrative control over the platform
- **Rate Limiting**: Built-in protection against API abuse
- **Responsive UI**: Modern, mobile-first design

## 🏗️ Architecture

```
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Authentication, validation, etc.
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # External services (Razorpay, etc.)
│   │   └── utils/           # Helper functions
│   └── logs/                # Application logs
├── frontend/                # React.js client application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   └── lib/             # Utilities and API client
└── docs/                    # Documentation
```

## 📚 Documentation

### API Documentation

- **[Complete API Documentation](docs/API_DOCUMENTATION.md)** - Comprehensive API guide with examples
- **[API Quick Reference](docs/API_QUICK_REFERENCE.md)** - Quick reference for all endpoints
- **[OpenAPI Specification](docs/openapi.yaml)** - Machine-readable API specification
- **[Postman Collection](docs/P2P_Marketplace_API.postman_collection.json)** - Ready-to-use Postman collection

### Additional Documentation

- **[Implementation Guide](docs/implementation.md)** - Implementation details and architecture
- **[Email Setup Guide](docs/EMAIL_SETUP.md)** - Email notification system setup
- **[Backend TODO](docs/TODO-BACKEND.md)** - Backend development roadmap
- **[Frontend TODO](docs/TODO-FRONTEND.md)** - Frontend development roadmap
- **[UI Wireframes](docs/ui-wireframe.md)** - User interface design specifications

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Razorpay** - Payment processing
- **Resend** - Email notifications
- **Winston** - Logging
- **Joi** - Input validation
- **Bcrypt** - Password hashing

### Frontend

- **React.js** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **MongoDB** - Database server

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd odoo-test
   ```

2. **Set up environment variables**

   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Start MongoDB** (if running locally)

   ```bash
   mongod
   ```

5. **Seed the database** (optional)

   ```bash
   cd backend
   npm run seed
   ```

6. **Start the development servers**

   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

### Using Docker Compose

Alternatively, you can use Docker Compose to run the entire stack:

```bash
docker-compose up -d
```

This will start:

- MongoDB database
- Backend API server on port 5000
- Frontend development server on port 5173

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/p2p-marketplace

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com
EMAIL_ENABLED=true

# Server
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## 📖 API Usage

### Authentication Flow

1. **Register a new user**

   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "password123"
     }'
   ```

2. **Login and get token**

   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "password123"
     }'
   ```

3. **Use token for authenticated requests**
   ```bash
   curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:5000/api/auth/me
   ```

### Creating a Listing (Host)

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Professional Camera Kit",
    "description": "High-quality DSLR camera with lenses",
    "category": "electronics",
    "basePrice": 50,
    "unitType": "day",
    "location": "New York, NY",
    "totalQuantity": 3
  }'
```

### Creating an Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lines": [{
      "listingId": "listing_id_here",
      "qty": 1,
      "start": "2023-12-01T00:00:00.000Z",
      "end": "2023-12-03T00:00:00.000Z"
    }],
    "paymentOption": "deposit"
  }'
```

## 🧪 Testing

### Automated API Testing

The project includes comprehensive test scripts to validate all API endpoints:

#### Quick Test
```bash
# Basic connectivity and health check
npm run test:quick
```

#### Full API Test Suite
```bash
# Comprehensive testing of all endpoints
npm run test
# or
npm run test:api
```

#### Load Testing
```bash
# Performance and stress testing
npm run test:load
```

#### Complete Test Suite
```bash
# Run all tests (excluding load tests)
npm run test:all

# Run all tests including load testing
npm run test:full
```

#### Email System Testing
```bash
# Test email notification system
npm run test:email
```

### Test Features

✅ **All API Endpoints**: Tests every endpoint in the API
✅ **Authentication Flow**: User registration, login, profile management
✅ **Role-Based Access**: Customer, Host, and Admin permissions
✅ **Email Notifications**: Validates email service configuration
✅ **Error Handling**: Validates proper error responses
✅ **Rate Limiting**: Tests API protection mechanisms
✅ **Load Testing**: Performance under concurrent users
✅ **Cleanup**: Automatic test data cleanup

### Test Configuration

Set environment variables in `backend/scripts/.env.test`:
```bash
API_BASE_URL=http://localhost:5000/api
ADMIN_EMAIL=admin@example.com  # Optional for admin tests
ADMIN_PASSWORD=admin123
CONCURRENT_USERS=10            # For load testing
REQUESTS_PER_USER=20
```

### Test Output Example
```
🚀 Starting API Tests for http://localhost:5000/api

🔹 Authentication Endpoints
✅ POST /auth/register - PASSED Status: 201
✅ POST /auth/login - PASSED Status: 200
✅ GET /auth/me - PASSED Status: 200

📊 Test Results:
   Total Tests: 45
   Passed: 43
   Failed: 2
   Success Rate: 95.6%
```

### Using Postman

1. Import the [Postman collection](docs/P2P_Marketplace_API.postman_collection.json)
2. Set the `baseUrl` variable to `http://localhost:5000/api`
3. Register/login to get an auth token
4. The token will be automatically set for authenticated requests

### Manual Testing

All API endpoints can be tested using curl, Postman, or any HTTP client. See the [API Documentation](docs/API_DOCUMENTATION.md) for detailed examples.

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Input Validation** - Joi schema validation for all inputs
- **Rate Limiting** - Protection against API abuse
- **CORS Configuration** - Controlled cross-origin requests
- **Helmet.js** - Security headers
- **Data Sanitization** - XSS and injection prevention

## 📊 User Roles

### Customer (Default)

- Browse and search listings
- Create orders and make payments
- View order history
- Update profile

### Host

- All customer permissions
- Create and manage listings
- View host dashboard
- Manage orders and calendar
- Handle pickups and returns

### Admin

- All permissions
- Manage all users and listings
- View platform analytics
- Handle disputes
- Process payouts

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**

   - Set `NODE_ENV=production`
   - Configure production database
   - Set up proper JWT secrets
   - Configure Razorpay production keys

2. **Security**

   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting
   - Configure logging

3. **Database**

   - Set up MongoDB replica set
   - Configure backups
   - Set up monitoring

4. **Monitoring**
   - Set up application monitoring
   - Configure error tracking
   - Set up performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Email: support@p2pmarketplace.com
- Documentation: [docs/](docs/)

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced search and filtering
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with more payment gateways
- [ ] Real-time notifications
- [ ] Chat system between users
- [ ] Advanced dispute resolution system

---

**Happy coding! 🚀**
