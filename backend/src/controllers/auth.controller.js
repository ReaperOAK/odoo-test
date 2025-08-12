const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { logger } = require('../config/database');
const emailService = require('../services/email.service');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { name, email, password, isHost, hostProfile } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Create user
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: password,
        isHost: Boolean(isHost)
      };
      
      // Add host profile if user is registering as host
      if (isHost && hostProfile) {
        userData.hostProfile = {
          displayName: hostProfile.displayName?.trim(),
          phone: hostProfile.phone?.trim(),
          address: hostProfile.address?.trim(),
          bio: hostProfile.bio?.trim(),
          verified: false // Always start as unverified
        };
        userData.role = 'host';
      }
      
      const user = new User(userData);
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );
      
      logger.info(`User registered successfully: ${user.email}`);
      
      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(user).catch(error => {
        logger.error('Failed to send welcome email:', error);
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
      
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
  
  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }
      
      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );
      
      logger.info(`User logged in successfully: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
      
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
  
  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user.getPublicProfile()
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request content-type:', req.headers['content-type']);
      
      const { name, hostProfile } = req.body;
      const user = req.user;
      
      console.log('Update request data:', { name, hostProfile });
      console.log('User before update:', { id: user._id, name: user.name, email: user.email });
      
      // Update basic info
      if (name) {
        console.log('Updating name from', user.name, 'to', name.trim());
        user.name = name.trim();
      }
      
      // Update host profile fields (allow for all users, not just hosts)
      if (hostProfile) {
        // Initialize hostProfile if it doesn't exist
        if (!user.hostProfile) {
          user.hostProfile = {};
        }
        
        // Update fields individually to handle empty strings properly
        if (hostProfile.hasOwnProperty('displayName')) {
          user.hostProfile.displayName = hostProfile.displayName?.trim() || '';
        }
        if (hostProfile.hasOwnProperty('phone')) {
          user.hostProfile.phone = hostProfile.phone?.trim() || '';
        }
        if (hostProfile.hasOwnProperty('address')) {
          user.hostProfile.address = hostProfile.address?.trim() || '';
        }
        if (hostProfile.hasOwnProperty('bio')) {
          user.hostProfile.bio = hostProfile.bio?.trim() || '';
        }
        
        // Preserve existing verified status
        if (user.hostProfile.verified === undefined) {
          user.hostProfile.verified = false;
        }
      }
      
      await user.save();
      
      console.log('User after save:', { id: user._id, name: user.name, email: user.email });
      
      logger.info(`Profile updated for user: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
      
    } catch (error) {
      logger.error('Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
  
  /**
   * Become a host (upgrade regular user to host)
   */
  static async becomeHost(req, res) {
    try {
      const { hostProfile } = req.body;
      const user = req.user;
      
      if (user.isHost) {
        return res.status(400).json({
          success: false,
          message: 'User is already a host'
        });
      }
      
      // Update user to host
      user.isHost = true;
      user.role = 'host';
      user.hostProfile = {
        displayName: hostProfile?.displayName?.trim() || user.name,
        phone: hostProfile?.phone?.trim(),
        address: hostProfile?.address?.trim(),
        bio: hostProfile?.bio?.trim(),
        verified: false
      };
      
      await user.save();
      
      logger.info(`User upgraded to host: ${user.email}`);
      
      // Send host welcome email (non-blocking)
      emailService.sendHostWelcomeEmail(user).catch(error => {
        logger.error('Failed to send host welcome email:', error);
      });
      
      res.json({
        success: true,
        message: 'Successfully upgraded to host account',
        data: {
          user: user.getPublicProfile()
        }
      });
      
    } catch (error) {
      logger.error('Become host error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upgrade to host account'
      });
    }
  }
  
  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;
      
      // Get user with password hash for comparison
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      user.passwordHash = newPassword;
      await user.save();
      
      logger.info(`Password changed for user: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
  
  /**
   * Refresh JWT token
   */
  static async refreshToken(req, res) {
    try {
      const user = req.user;
      
      // Generate new JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token,
          user: user.getPublicProfile()
        }
      });
      
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      });
    }
  }
}

module.exports = AuthController;
