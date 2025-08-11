const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { validatePaymentConfirmation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Webhook route (no auth needed - verified by signature)
router.post('/webhook/polar', paymentController.handlePolarWebhook);

// Protected routes
router.use(authenticate);

router.get('/orders/:orderId/payments', paymentController.getOrderPayments);
router.get('/:id', paymentController.getPayment);
router.post('/:id/retry', paymentController.retryPayment);

// Mock payment for demo mode
router.post('/mock/:orderId/success', paymentController.mockPaymentSuccess);

module.exports = router;
