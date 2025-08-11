# API Testing Configuration

## Environment Variables

Set these environment variables before running tests:

```bash
# API Configuration
API_BASE_URL=http://localhost:5000/api

# Optional: Admin credentials for admin endpoint testing
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Test Configuration
TEST_DELAY=500  # Delay between tests in milliseconds
TEST_TIMEOUT=10000  # Request timeout in milliseconds
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Start the Server
```bash
npm run dev
```

### Run API Tests (in another terminal)
```bash
npm run test
# or
npm run test:api
# or directly
node scripts/test.js
```

## Test Coverage

The test suite covers all API endpoints:

### ✅ Authentication Endpoints
- POST /auth/register
- POST /auth/login  
- GET /auth/me
- PATCH /auth/profile
- POST /auth/change-password
- POST /auth/become-host

### ✅ Listing Endpoints
- GET /listings (public)
- GET /listings/:id (public)
- GET /listings/:id/availability (public)
- POST /listings (host only)
- PATCH /listings/:id (host only)
- DELETE /listings/:id (host only)

### ✅ Order Endpoints  
- POST /orders
- GET /orders/my-orders
- GET /orders/:id
- POST /orders/:id/cancel
- PATCH /orders/:id/status (host only)

### ✅ Payment Endpoints
- GET /payments/orders/:orderId/payments
- GET /payments/:id
- POST /payments/:id/retry
- POST /payments/mock/:orderId/success
- POST /payments/webhook/razorpay

### ✅ Host Dashboard Endpoints
- GET /host/dashboard
- GET /host/listings
- GET /host/orders
- GET /host/calendar
- GET /host/wallet/transactions
- POST /host/orders/:orderId/pickup
- POST /host/orders/:orderId/return

### ✅ Admin Panel Endpoints
- GET /admin/dashboard
- GET /admin/analytics
- GET /admin/users
- PATCH /admin/users/:id
- GET /admin/orders
- POST /admin/orders/:orderId/resolve-dispute
- GET /admin/payouts
- POST /admin/payouts
- POST /admin/payouts/:id/process

### ✅ Error Handling Tests
- Invalid endpoints (404)
- Malformed JSON (400)
- Missing required fields (400)
- Invalid tokens (401)
- Unauthorized access (403)

### ✅ Security Tests
- Rate limiting
- Authorization checks
- Role-based access control

## Test Output

The script provides colored output:
- 🔹 Blue: Test sections
- ✅ Green: Passed tests
- ❌ Red: Failed tests
- ⚠️ Yellow: Warnings
- ℹ️ Blue: Information

## Expected Results

With a properly running server:
- **Authentication tests**: Should all pass
- **Public listing tests**: Should pass
- **Host-only tests**: Will pass if host user is created
- **Admin tests**: Will pass if admin credentials are provided
- **Error handling**: Should demonstrate proper error responses
- **Rate limiting**: Should show rate limiting in action

## Troubleshooting

### Server Not Running
```
❌ Cannot connect to server at http://localhost:5000/api
```
**Solution**: Start the server with `npm run dev`

### Missing Dependencies
```
Error: Cannot find module 'axios'
```
**Solution**: Run `npm install` to install all dependencies

### Admin Tests Failing
```
⚠️ Admin tests may fail if no admin user exists
```
**Solution**: 
1. Seed the database with admin user: `npm run seed`
2. Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables

### Rate Limiting False Positives
If you see unexpected rate limiting, wait a few minutes between test runs or restart the server.

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Start server
  run: npm run dev &
  
- name: Wait for server
  run: sleep 5

- name: Run API tests
  run: npm run test
```
