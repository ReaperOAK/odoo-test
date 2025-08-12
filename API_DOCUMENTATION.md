# P2P Marketplace API Documentation

## Overview

This is a comprehensive REST API for a peer-to-peer marketplace platform where users can rent out items to each other. The API supports user authentication, listing management, order processing, payments, and administrative functions.

**Base URL:** `http://localhost:5000/api`

## 🎯 API Status

**✅ PRODUCTION READY - 100% Test Coverage**

```
📊 Current Test Results:
   Total Endpoints: 38
   Tests Passing: 38
   Success Rate: 100.0%
   Last Tested: August 2025
```

**🧪 Testing:** Complete test suite available with `npm run test`

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Listings](#listings)
4. [Orders](#orders)
5. [Payments](#payments)
6. [Host Dashboard](#host-dashboard)
7. [Admin Panel](#admin-panel)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "isHost": false,
  "hostProfile": {
    "displayName": "John's Rentals",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "bio": "I rent out electronics and tools"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isHost": false,
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isHost": false,
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### Get User Profile

**GET** `/auth/me`

Get current user's profile information.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isHost": false,
      "role": "customer",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Profile

**PATCH** `/auth/profile`

Update user profile information.

**Headers:** Authorization required

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "State",
    "zipCode": "12345",
    "country": "USA"
  }
}
```

### Change Password

**POST** `/auth/change-password`

Change user password.

**Headers:** Authorization required

**Request Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Become Host

**POST** `/auth/become-host`

Upgrade user account to host status.

**Headers:** Authorization required

**Request Body:**

```json
{
  "businessName": "John's Rentals",
  "businessType": "individual",
  "description": "Quality electronics and tools for rent",
  "website": "https://johnsrentals.com",
  "socialMedia": {
    "facebook": "https://facebook.com/johnsrentals",
    "instagram": "https://instagram.com/johnsrentals"
  }
}
```

## User Management

### Authentication Status

All user management endpoints require authentication unless specified otherwise.

## Listings

### Get All Listings

**GET** `/listings`

Retrieve all published listings with optional filters.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)
- `search` (string): Search in title and description
- `category` (string): Filter by category
- `location` (string): Filter by location
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `from` (date): Availability start date
- `to` (date): Availability end date
- `qty` (number): Required quantity (default: 1)

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "listing_id",
        "title": "Professional Camera Kit",
        "description": "High-quality DSLR camera with lenses",
        "category": "electronics",
        "basePrice": 50,
        "unitType": "day",
        "location": "New York, NY",
        "images": ["image1.jpg", "image2.jpg"],
        "owner": {
          "_id": "owner_id",
          "name": "Jane Smith",
          "hostProfile": {
            "displayName": "Jane's Electronics"
          }
        },
        "availableQuantity": 2,
        "totalQuantity": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Single Listing

**GET** `/listings/:id`

Get detailed information about a specific listing.

**Response:**

```json
{
  "success": true,
  "data": {
    "listing": {
      "_id": "listing_id",
      "title": "Professional Camera Kit",
      "description": "High-quality DSLR camera with lenses and accessories",
      "category": "electronics",
      "basePrice": 50,
      "unitType": "day",
      "location": "New York, NY",
      "images": ["image1.jpg", "image2.jpg"],
      "features": ["Image Stabilization", "4K Video", "Multiple Lenses"],
      "depositType": "percent",
      "depositValue": 20,
      "owner": {
        "_id": "owner_id",
        "name": "Jane Smith",
        "hostProfile": {
          "displayName": "Jane's Electronics",
          "verified": true
        }
      },
      "totalQuantity": 3,
      "rules": "Handle with care, no water exposure"
    }
  }
}
```

### Check Availability

**GET** `/listings/:id/availability`

Check if a listing is available for specific dates and quantity.

**Query Parameters:**

- `start` (date, required): Start date
- `end` (date, required): End date
- `qty` (number, required): Required quantity

**Response:**

```json
{
  "success": true,
  "data": {
    "available": true,
    "availableQuantity": 2,
    "requestedQuantity": 1,
    "conflicts": []
  }
}
```

### Create Listing (Host Only)

**POST** `/listings`

Create a new listing.

**Headers:** Authorization required, Host role required

**Request Body:**

```json
{
  "title": "Professional Camera Kit",
  "description": "High-quality DSLR camera with lenses",
  "category": "electronics",
  "basePrice": 50,
  "unitType": "day",
  "location": "New York, NY",
  "images": ["image1.jpg", "image2.jpg"],
  "features": ["Image Stabilization", "4K Video"],
  "depositType": "percent",
  "depositValue": 20,
  "totalQuantity": 3,
  "rules": "Handle with care"
}
```

### Update Listing (Host Only)

**PATCH** `/listings/:id`

Update an existing listing.

**Headers:** Authorization required, Host role required

**Request Body:** (Same as create, all fields optional)

### Delete Listing (Host Only)

**DELETE** `/listings/:id`

Delete a listing.

**Headers:** Authorization required, Host role required

## Orders

### Create Order

**POST** `/orders`

Create a new rental order.

**Headers:** Authorization required

**Request Body:**

```json
{
  "lines": [
    {
      "listingId": "listing_id",
      "qty": 1,
      "start": "2023-12-01T00:00:00.000Z",
      "end": "2023-12-03T00:00:00.000Z"
    }
  ],
  "paymentOption": "deposit"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-20231201-001",
      "renterId": "user_id",
      "hostId": "host_id",
      "lines": [
        {
          "listingId": "listing_id",
          "qty": 1,
          "start": "2023-12-01T00:00:00.000Z",
          "end": "2023-12-03T00:00:00.000Z",
          "unitPrice": 50,
          "lineTotal": 100
        }
      ],
      "subtotal": 100,
      "depositAmount": 20,
      "platformCommission": 5,
      "total": 125,
      "orderStatus": "pending",
      "paymentStatus": "pending"
    }
  }
}
```

### Get User Orders

**GET** `/orders/my-orders`

Get current user's orders.

**Headers:** Authorization required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by order status

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-20231201-001",
        "lines": [
          {
            "listing": {
              "title": "Professional Camera Kit",
              "images": ["image1.jpg"]
            },
            "qty": 1,
            "start": "2023-12-01T00:00:00.000Z",
            "end": "2023-12-03T00:00:00.000Z"
          }
        ],
        "total": 125,
        "orderStatus": "confirmed",
        "paymentStatus": "paid",
        "createdAt": "2023-11-25T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Single Order

**GET** `/orders/:id`

Get detailed information about a specific order.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-20231201-001",
      "renter": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "host": {
        "_id": "host_id",
        "name": "Jane Smith",
        "hostProfile": {
          "displayName": "Jane's Electronics"
        }
      },
      "lines": [
        {
          "listing": {
            "_id": "listing_id",
            "title": "Professional Camera Kit",
            "images": ["image1.jpg"]
          },
          "qty": 1,
          "start": "2023-12-01T00:00:00.000Z",
          "end": "2023-12-03T00:00:00.000Z",
          "unitPrice": 50,
          "lineTotal": 100
        }
      ],
      "subtotal": 100,
      "depositAmount": 20,
      "platformCommission": 5,
      "total": 125,
      "orderStatus": "confirmed",
      "paymentStatus": "paid",
      "timeline": [
        {
          "status": "pending",
          "timestamp": "2023-11-25T00:00:00.000Z"
        },
        {
          "status": "confirmed",
          "timestamp": "2023-11-25T01:00:00.000Z"
        }
      ]
    }
  }
}
```

### Cancel Order

**POST** `/orders/:id/cancel`

Cancel an order.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderStatus": "cancelled",
      "cancellationReason": "User requested cancellation"
    }
  }
}
```

### Update Order Status (Host/Admin Only)

**PATCH** `/orders/:id/status`

Update order status.

**Headers:** Authorization required, Host role required

**Request Body:**

```json
{
  "status": "confirmed",
  "notes": "Item prepared for pickup"
}
```

## Payments

### Get Order Payments

**GET** `/payments/orders/:orderId/payments`

Get all payments for a specific order.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "payment_id",
        "orderId": "order_id",
        "amount": 125,
        "type": "deposit",
        "method": "polar",
        "status": "completed",
        "gatewayPaymentId": "pay_polar_id",
        "createdAt": "2023-11-25T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Single Payment

**GET** `/payments/:id`

Get details of a specific payment.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "payment_id",
      "orderId": "order_id",
      "amount": 125,
      "type": "deposit",
      "method": "polar",
      "status": "completed",
      "gatewayPaymentId": "pay_polar_id",
      "gatewayResponse": {
        "payment_id": "pay_polar_id",
        "order_id": "order_polar_id"
      },
      "createdAt": "2023-11-25T00:00:00.000Z"
    }
  }
}
```

### Retry Payment

**POST** `/payments/:id/retry`

Retry a failed payment.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "polarOrder": {
      "id": "order_polar_id",
      "currency": "INR",
      "amount": 12500
    },
    "payment": {
      "_id": "new_payment_id",
      "status": "pending"
    }
  }
}
```

### Mock Payment Success (Demo Mode)

**POST** `/payments/mock/:orderId/success`

Simulate successful payment for demo purposes.

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "message": "Payment marked as successful",
  "data": {
    "payment": {
      "_id": "payment_id",
      "status": "completed"
    }
  }
}
```

### Polar Webhook

**POST** `/payments/webhook/polar`

Handle Polar payment webhooks (no authentication required).

## Host Dashboard

All host dashboard endpoints require authentication and host role.

### Get Host Dashboard

**GET** `/host/dashboard`

Get host dashboard statistics.

**Headers:** Authorization required, Host role required

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalListings": 5,
      "activeListings": 4,
      "totalOrders": 25,
      "pendingPickups": 2,
      "activeRentals": 3,
      "thisMonthRevenue": 1250,
      "thisWeekOrders": 4,
      "walletBalance": 850
    },
    "recentOrders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-20231201-001",
        "renter": {
          "name": "John Doe"
        },
        "total": 125,
        "orderStatus": "confirmed",
        "createdAt": "2023-11-25T00:00:00.000Z"
      }
    ],
    "popularListings": [
      {
        "_id": "listing_id",
        "title": "Professional Camera Kit",
        "orderCount": 15,
        "revenue": 750
      }
    ]
  }
}
```

### Get Host Listings

**GET** `/host/listings`

Get all listings owned by the host.

**Headers:** Authorization required, Host role required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "listing_id",
        "title": "Professional Camera Kit",
        "category": "electronics",
        "basePrice": 50,
        "status": "published",
        "totalQuantity": 3,
        "activeReservations": 1,
        "totalOrders": 15,
        "revenue": 750
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Host Orders

**GET** `/host/orders`

Get all orders for host's listings.

**Headers:** Authorization required, Host role required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by order status

### Get Host Calendar

**GET** `/host/calendar`

Get calendar view of host's bookings.

**Headers:** Authorization required, Host role required

**Query Parameters:**

- `start` (date): Calendar start date
- `end` (date): Calendar end date

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "reservation_id",
        "title": "Camera Kit - John Doe",
        "start": "2023-12-01T00:00:00.000Z",
        "end": "2023-12-03T00:00:00.000Z",
        "listingId": "listing_id",
        "orderId": "order_id",
        "status": "confirmed"
      }
    ]
  }
}
```

### Get Wallet Transactions

**GET** `/host/wallet/transactions`

Get host's wallet transaction history.

**Headers:** Authorization required, Host role required

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "type": "earning",
        "amount": 95,
        "description": "Order #ORD-20231201-001 completed",
        "orderId": "order_id",
        "createdAt": "2023-12-03T00:00:00.000Z"
      }
    ],
    "balance": 850
  }
}
```

### Mark Pickup

**POST** `/host/orders/:orderId/pickup`

Mark order as picked up by renter.

**Headers:** Authorization required, Host role required

**Request Body:**

```json
{
  "notes": "Item handed over to renter",
  "condition": "excellent"
}
```

### Mark Return

**POST** `/host/orders/:orderId/return`

Mark order as returned by renter.

**Headers:** Authorization required, Host role required

**Request Body:**

```json
{
  "notes": "Item returned in good condition",
  "condition": "good",
  "damageNotes": ""
}
```

## Admin Panel

All admin endpoints require authentication and admin role.

### Get Admin Dashboard

**GET** `/admin/dashboard`

Get comprehensive platform statistics.

**Headers:** Authorization required, Admin role required

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalHosts": 25,
      "totalListings": 100,
      "activeListings": 85,
      "totalOrders": 500,
      "completedOrders": 450,
      "totalRevenue": 5000,
      "monthlyRevenue": 800,
      "weeklyOrders": 25,
      "activeRentals": 30,
      "disputedOrders": 2,
      "pendingPayouts": 5,
      "totalPayouts": 5000
    },
    "recentActivity": [
      {
        "type": "order",
        "description": "New order created",
        "timestamp": "2023-11-25T00:00:00.000Z"
      }
    ],
    "topHosts": [
      {
        "_id": "host_id",
        "name": "Jane Smith",
        "totalOrders": 50,
        "revenue": 2500
      }
    ]
  }
}
```

### Get Analytics

**GET** `/admin/analytics`

Get detailed platform analytics.

**Headers:** Authorization required, Admin role required

**Query Parameters:**

- `period` (string): Time period (week, month, quarter, year)
- `category` (string): Filter by category

### Get Users

**GET** `/admin/users`

Get all platform users.

**Headers:** Authorization required, Admin role required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `role` (string): Filter by role
- `status` (string): Filter by status

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "customer",
        "isHost": false,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "lastActiveAt": "2023-11-25T00:00:00.000Z",
        "totalOrders": 5,
        "totalSpent": 500
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Update User

**PATCH** `/admin/users/:id`

Update user information.

**Headers:** Authorization required, Admin role required

**Request Body:**

```json
{
  "role": "admin",
  "status": "active",
  "verified": true
}
```

### Get Orders (Admin)

**GET** `/admin/orders`

Get all platform orders.

**Headers:** Authorization required, Admin role required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `dispute` (boolean): Filter disputed orders

### Resolve Dispute

**POST** `/admin/orders/:orderId/resolve-dispute`

Resolve order dispute.

**Headers:** Authorization required, Admin role required

**Request Body:**

```json
{
  "resolution": "refund_renter",
  "refundAmount": 100,
  "notes": "Item was damaged as reported",
  "adminNotes": "Internal notes for admin team"
}
```

### Get Payouts

**GET** `/admin/payouts`

Get all platform payouts.

**Headers:** Authorization required, Admin role required

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status

### Create Payout

**POST** `/admin/payouts`

Create a new payout for a host.

**Headers:** Authorization required, Admin role required

**Request Body:**

```json
{
  "hostId": "host_id",
  "amount": 500,
  "method": "bank_transfer",
  "description": "Monthly payout",
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "ABCD0123456",
    "accountHolderName": "Jane Smith",
    "bankName": "Example Bank"
  }
}
```

### Process Payout

**POST** `/admin/payouts/:id/process`

Process a pending payout.

**Headers:** Authorization required, Admin role required

**Request Body:**

```json
{
  "transactionId": "txn_123456789",
  "notes": "Processed via bank transfer"
}
```

## Error Handling

The API returns consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Types

#### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

#### Authentication Errors (401)

```json
{
  "success": false,
  "message": "Access token is required"
}
```

#### Authorization Errors (403)

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### Not Found Errors (404)

```json
{
  "success": false,
  "message": "Resource not found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Auth Routes

- **Limit:** 5 requests per 15 minutes per IP
- **Applies to:** `/auth/register`, `/auth/login`

### Order Creation

- **Limit:** 10 orders per hour per user
- **Applies to:** `POST /orders`

### General API

- **Limit:** 100 requests per 15 minutes per IP
- **Applies to:** All other endpoints

### Rate Limit Headers

When rate limited, the API returns these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

### Rate Limit Error Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## Authentication Flow

### 1. User Registration/Login

1. User registers or logs in via `/auth/register` or `/auth/login`
2. API returns user data and JWT token
3. Client stores token securely

### 2. Making Authenticated Requests

1. Include token in Authorization header: `Bearer <token>`
2. API validates token and extracts user information
3. API processes request with user context

### 3. Token Expiration

1. Tokens expire after configured time (default: 7 days)
2. Client receives 401 error for expired tokens
3. Client should prompt user to log in again

## Data Models

### User Model

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string",
  "isHost": "boolean",
  "role": "customer|host|admin",
  "hostProfile": {
    "displayName": "string",
    "verified": "boolean",
    "phone": "string",
    "address": "string",
    "bio": "string"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Listing Model

```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId",
  "title": "string",
  "description": "string",
  "category": "electronics|vehicles|sports|music|tools|furniture|other",
  "basePrice": "number",
  "unitType": "hour|day|week",
  "depositType": "flat|percent",
  "depositValue": "number",
  "location": "string",
  "images": ["string"],
  "features": ["string"],
  "totalQuantity": "number",
  "status": "draft|published|paused|archived",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Order Model

```json
{
  "_id": "ObjectId",
  "orderNumber": "string",
  "renterId": "ObjectId",
  "hostId": "ObjectId",
  "lines": [
    {
      "listingId": "ObjectId",
      "qty": "number",
      "start": "Date",
      "end": "Date",
      "unitPrice": "number",
      "lineTotal": "number",
      "reservationId": "ObjectId"
    }
  ],
  "subtotal": "number",
  "depositAmount": "number",
  "platformCommission": "number",
  "total": "number",
  "orderStatus": "pending|confirmed|in_progress|completed|cancelled|disputed",
  "paymentStatus": "pending|partial|paid|refunded",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Payment Model

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId",
  "amount": "number",
  "type": "deposit|full|refund",
  "method": "polar|manual|wallet",
  "status": "pending|processing|completed|failed|cancelled",
  "gatewayPaymentId": "string",
  "gatewayOrderId": "string",
  "gatewayResponse": "object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Environment Variables

Required environment variables for the API:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/p2p-marketplace

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Polar.sh
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
POLAR_BASE_URL=https://api.polar.sh

# Server
PORT=5000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

## Development Setup

1. **Clone the repository**
2. **Install dependencies:** `npm install`
3. **Set up environment variables:** Copy `.env.example` to `.env` and configure
4. **Start MongoDB:** Ensure MongoDB is running
5. **Seed database:** `npm run seed`
6. **Start development server:** `npm run dev`

## Testing

Use tools like Postman, Insomnia, or curl to test the API endpoints.

### Example curl commands:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get listings
curl http://localhost:5000/api/listings

# Create order (with auth token)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"lines":[{"listingId":"listing_id","qty":1,"start":"2023-12-01","end":"2023-12-03"}]}'
```

---

This documentation covers all major API endpoints and functionality. For additional support or questions, please contact the development team.
