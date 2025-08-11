# Polar.sh Integration Migration

## 🔄 Migration from Razorpay to Polar.sh

This document outlines the migration from Razorpay to Polar.sh for payment processing in the P2P Marketplace.

### ✅ What Changed

#### Backend Changes
1. **New Service**: `src/services/polar.service.js` replaces `src/services/razorpay.service.js`
2. **Payment Controller**: Updated to use Polar webhooks instead of Razorpay
3. **Models**: Updated Payment and Order models to use Polar fields
4. **Routes**: Webhook route changed from `/webhook/razorpay` to `/webhook/polar`
5. **Environment**: New Polar environment variables

#### Frontend Changes
1. **Checkout Flow**: Updated to redirect to Polar.sh checkout
2. **Payment Methods**: Default changed from Razorpay to Polar
3. **Success/Cancel Pages**: New pages for handling Polar checkout responses
4. **API Calls**: Updated to support Polar session management

### 🔧 Configuration

#### Environment Variables (Backend)
```bash
# Remove these Razorpay variables:
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=  
# RAZORPAY_WEBHOOK_SECRET=

# Add these Polar variables:
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
POLAR_BASE_URL=https://api.polar.sh
FRONTEND_URL=http://localhost:3000
```

#### Payment Modes
- **Mock Mode**: `PAYMENT_MODE=mock` (for testing)
- **Live Mode**: `PAYMENT_MODE=live` (for production)

### 🧪 Testing

#### Backend Test
```bash
cd backend
node scripts/test-polar.js
```

#### Mock Payment Flow
1. Create an order
2. Navigate to checkout
3. Select "Mock Payment" option
4. Payment will be simulated without real money transfer

#### Polar Payment Flow  
1. Create an order
2. Navigate to checkout
3. Select "Polar.sh Payment" option
4. Redirected to Polar checkout (or mock page in test mode)
5. Complete payment and return to success page

### 📊 Database Schema Changes

#### Payment Model
```javascript
// Old Razorpay fields (removed):
razorpayPaymentId, razorpayOrderId, razorpaySignature

// New Polar fields (added):
polarPaymentId, polarSessionId, polarSignature

// Updated defaults:
currency: 'USD' (was 'INR')
method: ['polar', 'mock', 'manual'] (was ['razorpay', 'mock', 'manual'])
gateway: ['polar', 'mock'] (was ['razorpay', 'mock'])
```

#### Order Model
```javascript
// Old: razorpayOrderId
// New: polarSessionId
```

### 🚀 Deployment Notes

1. **Database Migration**: Existing orders with Razorpay data will continue to work
2. **Backward Compatibility**: Old payment records are preserved
3. **Gradual Migration**: New orders will use Polar, existing orders keep Razorpay data
4. **Webhook Updates**: Update webhook URLs in Polar dashboard

### 🔗 API Endpoints

#### Changed Endpoints
```bash
# Webhook
POST /api/payments/webhook/polar  # (was /webhook/razorpay)

# New Payment Flow  
POST /api/orders/:id/initiate-payment  # Returns Polar checkout URL
POST /api/orders/:id/confirm-payment   # Confirms Polar payment
```

#### Response Format Changes
```javascript
// Old Razorpay response:
{
  razorpayOrderId: "...",
  key: "...",
  currency: "INR"
}

// New Polar response:
{
  sessionId: "...",
  checkoutUrl: "...", 
  currency: "USD"
}
```

### ✨ Benefits of Polar.sh

1. **Simplified Integration**: No complex frontend SDK required
2. **Better UX**: Redirect-based checkout flow
3. **Test-Friendly**: Built-in mock mode for development
4. **Modern API**: Clean, RESTful design
5. **Better Documentation**: Comprehensive API docs

### 🚨 Important Notes

- **No Real Money**: In test mode, no actual payments are processed
- **Webhook Security**: Polar webhooks are validated with HMAC signatures
- **Error Handling**: Improved error messages and status tracking
- **Currency**: Default changed from INR to USD (configurable)

### 🆘 Troubleshooting

#### Common Issues
1. **Invalid Access Token**: Check POLAR_ACCESS_TOKEN in environment
2. **Webhook Signature Errors**: Verify POLAR_WEBHOOK_SECRET
3. **Redirect Issues**: Ensure FRONTEND_URL is correctly set
4. **Test Mode**: Set PAYMENT_MODE=mock for testing

#### Debug Commands
```bash
# Test Polar service
node scripts/test-polar.js

# Check environment variables
node -e "console.log(process.env.POLAR_ACCESS_TOKEN ? 'Token set' : 'Token missing')"

# Test webhook validation
curl -X POST localhost:5000/api/payments/webhook/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{}}'
```
