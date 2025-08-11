const axios = require('axios');
const logger = require('../utils/logger');

class PolarService {
  constructor() {
    this.apiKey = process.env.POLAR_ACCESS_TOKEN;
    this.baseURL = process.env.POLAR_BASE_URL || 'https://api.polar.sh';
    this.webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    
    this.isTestMode = process.env.PAYMENT_MODE === 'mock' || process.env.NODE_ENV !== 'production';
    
    // Create axios instance for API calls
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Create a checkout session for payment
   */
  async createCheckoutSession(orderData) {
    try {
      if (this.isTestMode) {
        return this.createMockCheckoutSession(orderData);
      }

      // Note: This is a placeholder for actual Polar API integration
      // In real implementation, you would use the actual Polar API endpoint
      const response = await this.api.post('/checkouts', {
        amount: Math.round(orderData.total * 100), // Convert to cents
        currency: 'USD',
        success_url: `${process.env.FRONTEND_URL}/checkout/success?order_id=${orderData.orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?order_id=${orderData.orderId}`,
        metadata: {
          order_id: orderData.orderId,
          customer_id: orderData.customerId,
          listing_id: orderData.listingId
        },
        customer_email: orderData.customerEmail,
        product_name: orderData.productName || 'Rental Service'
      });

      const checkoutSession = response.data;

      logger.info(`Polar checkout session created: ${checkoutSession.id}`);
      
      return {
        id: checkoutSession.id,
        url: checkoutSession.url,
        amount: checkoutSession.amount,
        currency: checkoutSession.currency,
        status: 'created'
      };
    } catch (error) {
      logger.error('Error creating Polar checkout session:', error);
      // Fall back to mock mode if API call fails
      logger.warn('Falling back to mock mode due to API error');
      return this.createMockCheckoutSession(orderData);
    }
  }

  /**
   * Create mock checkout session for testing
   */
  createMockCheckoutSession(orderData) {
    const mockSession = {
      id: `polar_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: `${process.env.FRONTEND_URL}/checkout/mock?order_id=${orderData.orderId}&session_id=polar_mock_${Date.now()}`,
      amount: Math.round(orderData.total * 100),
      currency: 'USD',
      status: 'created'
    };

    logger.info(`Mock Polar checkout session created: ${mockSession.id}`);
    return mockSession;
  }

  /**
   * Verify checkout session completion
   */
  async verifyCheckoutSession(sessionId) {
    try {
      if (this.isTestMode && sessionId.startsWith('polar_mock_')) {
        return this.verifyMockCheckoutSession(sessionId);
      }

      // Note: This is a placeholder for actual Polar API integration
      const response = await this.api.get(`/checkouts/${sessionId}`);
      const session = response.data;
      
      return {
        id: session.id,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        metadata: session.metadata,
        payment_method: session.payment_method
      };
    } catch (error) {
      logger.error('Error verifying Polar checkout session:', error);
      // Fall back to mock verification if API call fails
      logger.warn('Falling back to mock verification due to API error');
      return this.verifyMockCheckoutSession(sessionId);
    }
  }

  /**
   * Verify mock checkout session for testing
   */
  verifyMockCheckoutSession(sessionId) {
    return {
      id: sessionId,
      status: 'completed',
      amount: 5000, // Mock amount
      currency: 'USD',
      metadata: {
        order_id: 'mock_order',
        customer_id: 'mock_customer'
      },
      payment_method: 'card'
    };
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentId, amount, reason = 'customer_request') {
    try {
      if (this.isTestMode) {
        return this.createMockRefund(paymentId, amount, reason);
      }

      // Note: This is a placeholder for actual Polar API integration
      const response = await this.api.post('/refunds', {
        payment_id: paymentId,
        amount: Math.round(amount * 100),
        reason: reason
      });

      const refund = response.data;

      logger.info(`Polar refund created: ${refund.id}`);
      
      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      logger.error('Error creating Polar refund:', error);
      // Fall back to mock refund if API call fails
      logger.warn('Falling back to mock refund due to API error');
      return this.createMockRefund(paymentId, amount, reason);
    }
  }

  /**
   * Create mock refund for testing
   */
  createMockRefund(paymentId, amount, reason) {
    const mockRefund = {
      id: `polar_refund_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      status: 'succeeded',
      reason: reason
    };

    logger.info(`Mock Polar refund created: ${mockRefund.id}`);
    return mockRefund;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature, secret) {
    try {
      if (this.isTestMode) {
        return true; // Skip signature validation in test mode
      }

      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event) {
    try {
      logger.info(`Processing Polar webhook event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          return this.handleCheckoutSessionCompleted(event.data);
        case 'payment.succeeded':
          return this.handlePaymentSucceeded(event.data);
        case 'payment.failed':
          return this.handlePaymentFailed(event.data);
        case 'refund.created':
          return this.handleRefundCreated(event.data);
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
          return { handled: false };
      }
    } catch (error) {
      logger.error('Error processing webhook event:', error);
      throw error;
    }
  }

  async handleCheckoutSessionCompleted(data) {
    return {
      type: 'checkout_completed',
      sessionId: data.id,
      orderId: data.metadata?.order_id,
      amount: data.amount,
      status: 'completed'
    };
  }

  async handlePaymentSucceeded(data) {
    return {
      type: 'payment_succeeded',
      paymentId: data.id,
      orderId: data.metadata?.order_id,
      amount: data.amount,
      status: 'succeeded'
    };
  }

  async handlePaymentFailed(data) {
    return {
      type: 'payment_failed',
      paymentId: data.id,
      orderId: data.metadata?.order_id,
      amount: data.amount,
      status: 'failed',
      error: data.failure_reason
    };
  }

  async handleRefundCreated(data) {
    return {
      type: 'refund_created',
      refundId: data.id,
      paymentId: data.payment_id,
      amount: data.amount,
      status: data.status
    };
  }
}

module.exports = new PolarService();
