# API Quick Reference

## Base URL

`http://localhost:5000/api`

## 🎯 API Status

**✅ PRODUCTION READY - 100% Test Coverage**
- 38 endpoints tested with 100% success rate
- Complete test suite: `npm run test`

## Authentication

Include JWT token in header: `Authorization: Bearer <token>`

## Endpoints Overview

### Authentication (`/auth`)

| Method | Endpoint           | Auth | Description       |
| ------ | ------------------ | ---- | ----------------- |
| POST   | `/register`        | ❌   | Register new user |
| POST   | `/login`           | ❌   | User login        |
| GET    | `/me`              | ✅   | Get user profile  |
| PATCH  | `/profile`         | ✅   | Update profile    |
| POST   | `/change-password` | ✅   | Change password   |
| POST   | `/become-host`     | ✅   | Upgrade to host   |

### Listings (`/listings`)

| Method | Endpoint            | Auth | Role | Description        |
| ------ | ------------------- | ---- | ---- | ------------------ |
| GET    | `/`                 | ❌   | -    | Get all listings   |
| GET    | `/:id`              | ❌   | -    | Get single listing |
| GET    | `/:id/availability` | ❌   | -    | Check availability |
| POST   | `/`                 | ✅   | Host | Create listing     |
| PATCH  | `/:id`              | ✅   | Host | Update listing     |
| DELETE | `/:id`              | ✅   | Host | Delete listing     |

### Orders (`/orders`)

| Method | Endpoint      | Auth | Role | Description         |
| ------ | ------------- | ---- | ---- | ------------------- |
| POST   | `/`           | ✅   | -    | Create order        |
| GET    | `/my-orders`  | ✅   | -    | Get user orders     |
| GET    | `/:id`        | ✅   | -    | Get single order    |
| POST   | `/:id/cancel` | ✅   | -    | Cancel order        |
| PATCH  | `/:id/status` | ✅   | Host | Update order status |

### Payments (`/payments`)

| Method | Endpoint                    | Auth | Description          |
| ------ | --------------------------- | ---- | -------------------- |
| POST   | `/webhook/polar`            | ❌   | Polar webhook        |
| GET    | `/orders/:orderId/payments` | ✅   | Get order payments   |
| GET    | `/:id`                      | ✅   | Get payment details  |
| POST   | `/:id/retry`                | ✅   | Retry failed payment |
| POST   | `/mock/:orderId/success`    | ✅   | Mock payment (demo)  |

### Host Dashboard (`/host`)

_All endpoints require Host role_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Host dashboard stats |
| GET | `/listings` | Host's listings |
| GET | `/orders` | Host's orders |
| GET | `/calendar` | Booking calendar |
| GET | `/wallet/transactions` | Wallet transactions |
| POST | `/orders/:orderId/pickup` | Mark pickup |
| POST | `/orders/:orderId/return` | Mark return |

### Admin Panel (`/admin`)

_All endpoints require Admin role_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Admin dashboard |
| GET | `/analytics` | Platform analytics |
| GET | `/users` | All users |
| PATCH | `/users/:id` | Update user |
| GET | `/orders` | All orders |
| POST | `/orders/:orderId/resolve-dispute` | Resolve dispute |
| GET | `/payouts` | All payouts |
| POST | `/payouts` | Create payout |
| POST | `/payouts/:id/process` | Process payout |

## Common Query Parameters

### Pagination

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10-12)

### Filters

- `search` (string): Search text
- `category` (string): Filter by category
- `status` (string): Filter by status
- `from` / `to` (date): Date range

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error message"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Rate Limits

- Auth endpoints: 5 requests / 15 minutes
- Order creation: 10 requests / hour  
- General API: 100 requests / 15 minutes
- **Testing**: Rate limiting disabled with `RATE_LIMIT_DISABLED=true`

## User Roles

- `customer` - Regular user (default)
- `host` - Can create listings
- `admin` - Full platform access

## Order Statuses

- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by host
- `in_progress` - Item picked up
- `completed` - Item returned
- `cancelled` - Order cancelled
- `disputed` - Under dispute

## Payment Statuses

- `pending` - Payment pending
- `partial` - Partially paid
- `paid` - Fully paid
- `refunded` - Refunded

## Listing Categories

- `electronics`
- `vehicles`
- `sports`
- `music`
- `tools`
- `furniture`
- `other`
