const express = require('express');
const hostController = require('../controllers/host.controller');
const { authenticate } = require('../middleware/auth');
const { requireHost } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication and host role
router.use(authenticate);
router.use(requireHost);

// Host dashboard and stats
router.get('/dashboard', hostController.getHostDashboard);
router.get('/listings', hostController.getHostListings);
router.get('/orders', hostController.getHostOrders);
router.get('/calendar', hostController.getHostCalendar);
router.get('/wallet/transactions', hostController.getWalletTransactions);

// Order management
router.post('/orders/:orderId/pickup', hostController.markPickup);
router.post('/orders/:orderId/return', hostController.markReturn);

module.exports = router;
