const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateUserRegistration, validateUserLogin, validateUpdateProfile, validateChangePassword, validateBecomeHost } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiting');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', authController.getProfile);
router.patch('/profile', validateUpdateProfile, authController.updateProfile);
router.post('/change-password', validateChangePassword, authController.changePassword);
router.post('/become-host', validateBecomeHost, authController.becomeHost);

module.exports = router;
