const express = require('express');
const adminController = require('../controllers/admin.controller');
const { validatePayoutCreation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard and analytics
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/system-health', adminController.getSystemHealth);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);

// Order management
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.post('/orders/:orderId/resolve-dispute', adminController.resolveDispute);

// Payout management
router.get('/payouts', adminController.getPayouts);
router.post('/payouts', validatePayoutCreation, adminController.createPayout);
router.post('/payouts/:id/process', adminController.processPayout);

module.exports = router;
