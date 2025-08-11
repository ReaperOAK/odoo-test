const express = require('express');
const orderController = require('../controllers/order.controller');
const { validateOrderCreation } = require('../middleware/validation');
const { orderCreationLimiter } = require('../middleware/rateLimiting');
const { authenticate } = require('../middleware/auth');
const { requireHost } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', orderCreationLimiter, validateOrderCreation, orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrder);
router.post('/:id/cancel', orderController.cancelOrder);

// Host/admin routes
router.patch('/:id/status', requireHost, orderController.updateOrderStatus);

module.exports = router;
