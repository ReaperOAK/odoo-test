const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.fromEmail = config.FROM_EMAIL;
    this.enabled = config.EMAIL_ENABLED;
    
    // Only initialize Resend if API key is provided
    if (config.RESEND_API_KEY) {
      this.resend = new Resend(config.RESEND_API_KEY);
    } else {
      this.resend = null;
    }
  }

  /**
   * Send email using Resend
   * @param {Object} emailData - Email data object
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content (optional)
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.enabled) {
      logger.info(`Email disabled - would send: ${subject} to ${to}`);
      return { success: true, message: 'Email disabled' };
    }

    if (!this.resend) {
      logger.warn('RESEND_API_KEY not configured - email not sent');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        text: text || this.stripHtml(html)
      });

      logger.info(`Email sent successfully to ${to}: ${subject}`, { id: result.data?.id });
      return { success: true, id: result.data?.id };
    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to,
        subject
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking confirmation email to customer
   */
  async sendBookingConfirmation(order, user) {
    const subject = `Booking Confirmation - Order #${order.orderNumber}`;
    const html = this.generateBookingConfirmationHTML(order, user);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send booking notification to host
   */
  async sendBookingNotificationToHost(order, host, customer) {
    const subject = `New Booking Request - Order #${order.orderNumber}`;
    const html = this.generateBookingNotificationHTML(order, host, customer);
    
    return this.sendEmail({
      to: host.email,
      subject,
      html
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(order, payment, user) {
    const subject = `Payment Confirmed - Order #${order.orderNumber}`;
    const html = this.generatePaymentConfirmationHTML(order, payment, user);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(order, user, previousStatus) {
    const subject = `Order Update - ${order.status.toUpperCase()} - #${order.orderNumber}`;
    const html = this.generateOrderStatusUpdateHTML(order, user, previousStatus);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(order, user, reason) {
    const subject = `Booking Cancelled - Order #${order.orderNumber}`;
    const html = this.generateCancellationHTML(order, user, reason);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send host payout notification
   */
  async sendPayoutNotification(payout, host) {
    const subject = `Payout Processed - ₹${payout.amount}`;
    const html = this.generatePayoutHTML(payout, host);
    
    return this.sendEmail({
      to: host.email,
      subject,
      html
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to P2P Marketplace!';
    const html = this.generateWelcomeHTML(user);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send host verification email
   */
  async sendHostWelcomeEmail(user) {
    const subject = 'Welcome to P2P Marketplace - Host Account Created!';
    const html = this.generateHostWelcomeHTML(user);
    
    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  // HTML Template Generators
  generateBookingConfirmationHTML(order, user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            <p>Your booking has been confirmed! Here are the details:</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
              <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              
              <h4>Items:</h4>
              ${order.lines.map(line => `
                <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #2563eb;">
                  <strong>${line.listingTitle}</strong><br>
                  Quantity: ${line.quantity} × ₹${line.unitPrice}<br>
                  Duration: ${new Date(line.startDate).toLocaleDateString()} - ${new Date(line.endDate).toLocaleDateString()}
                </div>
              `).join('')}
            </div>
            
            <p>The host will confirm your booking soon. You'll receive another email once it's confirmed.</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" class="btn">View Order</a>
          </div>
          <div class="footer">
            <p>Thank you for using P2P Marketplace!</p>
          </div>
        </body>
      </html>
    `;
  }

  generateBookingNotificationHTML(order, host, customer) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .btn-secondary { background: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Booking Request 📋</h1>
          </div>
          <div class="content">
            <p>Hi ${host.firstName || host.name},</p>
            <p>You have a new booking request from <strong>${customer.firstName || customer.name}</strong>:</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
              <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
              <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              
              <h4>Items:</h4>
              ${order.lines.map(line => `
                <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #059669;">
                  <strong>${line.listingTitle}</strong><br>
                  Quantity: ${line.quantity} × ₹${line.unitPrice}<br>
                  Duration: ${new Date(line.startDate).toLocaleDateString()} - ${new Date(line.endDate).toLocaleDateString()}
                </div>
              `).join('')}
            </div>
            
            <p>Please review and confirm this booking in your host dashboard.</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/host/orders/${order._id}" class="btn">Confirm Booking</a>
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/host/dashboard" class="btn btn-secondary">Host Dashboard</a>
          </div>
          <div class="footer">
            <p>P2P Marketplace Host Portal</p>
          </div>
        </body>
      </html>
    `;
  }

  generatePaymentConfirmationHTML(order, payment, user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Confirmed ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            <p>Your payment has been successfully processed!</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Amount:</strong> ₹${payment.amount}</p>
              <p><strong>Payment ID:</strong> ${payment.externalId || payment._id}</p>
              <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
            </div>
            
            <p>Your booking is now confirmed and the host has been notified. You'll receive updates as your order progresses.</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" class="btn">View Order</a>
          </div>
          <div class="footer">
            <p>Thank you for your payment!</p>
          </div>
        </body>
      </html>
    `;
  }

  generateOrderStatusUpdateHTML(order, user, previousStatus) {
    const statusMessages = {
      'confirmed': 'Your booking has been confirmed by the host! 🎉',
      'in_progress': 'Your item has been picked up. Enjoy! 📦',
      'completed': 'Your booking is complete. Thank you! ✅',
      'cancelled': 'Your booking has been cancelled. ❌',
      'disputed': 'There is an issue with your booking that needs resolution. 🚨'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            
            <div class="status-update">
              <h2>Order #${order.orderNumber}</h2>
              <p style="font-size: 18px; margin: 20px 0;">${statusMessages[order.status] || 'Your order status has been updated.'}</p>
              <p><strong>Status:</strong> ${previousStatus?.toUpperCase()} → <strong style="color: #059669;">${order.status.toUpperCase()}</strong></p>
              <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" class="btn">View Order Details</a>
          </div>
          <div class="footer">
            <p>P2P Marketplace</p>
          </div>
        </body>
      </html>
    `;
  }

  generateCancellationHTML(order, user, reason) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .cancellation-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            <p>Your booking has been cancelled.</p>
            
            <div class="cancellation-details">
              <h3>Cancellation Details</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Cancelled:</strong> ${new Date().toLocaleDateString()}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p><strong>Refund:</strong> Refund will be processed within 5-7 business days</p>
            </div>
            
            <p>If you have any questions about this cancellation, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>P2P Marketplace Support</p>
          </div>
        </body>
      </html>
    `;
  }

  generatePayoutHTML(payout, host) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payout Processed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .payout-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payout Processed 💰</h1>
          </div>
          <div class="content">
            <p>Hi ${host.firstName || host.name},</p>
            <p>Great news! Your payout has been processed.</p>
            
            <div class="payout-details">
              <h3>Payout Details</h3>
              <p><strong>Amount:</strong> ₹${payout.amount}</p>
              <p><strong>Payout ID:</strong> ${payout._id}</p>
              <p><strong>Processed:</strong> ${new Date(payout.processedAt || payout.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${payout.status.toUpperCase()}</p>
            </div>
            
            <p>The amount should appear in your registered bank account within 1-2 business days.</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/host/wallet" class="btn">View Wallet</a>
          </div>
          <div class="footer">
            <p>P2P Marketplace Host Portal</p>
          </div>
        </body>
      </html>
    `;
  }

  generateWelcomeHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to P2P Marketplace</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to P2P Marketplace! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            <p>Welcome to P2P Marketplace! We're excited to have you join our community.</p>
            
            <div class="welcome-card">
              <h3>What you can do:</h3>
              <ul>
                <li>📱 Browse and rent items from trusted hosts</li>
                <li>💼 Become a host and earn money from your items</li>
                <li>🔒 Enjoy secure payments and insurance coverage</li>
                <li>⭐ Rate and review your experiences</li>
              </ul>
            </div>
            
            <p>Ready to get started?</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/listings" class="btn">Browse Listings</a>
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/become-host" class="btn">Become a Host</a>
          </div>
          <div class="footer">
            <p>Happy renting!</p>
            <p>The P2P Marketplace Team</p>
          </div>
        </body>
      </html>
    `;
  }

  generateHostWelcomeHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Host!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .host-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to the Host Community! 🏠</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName || user.name},</p>
            <p>Congratulations! Your host account has been created successfully.</p>
            
            <div class="host-card">
              <h3>Next Steps:</h3>
              <ol>
                <li>📝 Create your first listing</li>
                <li>📸 Add high-quality photos</li>
                <li>📅 Set your availability calendar</li>
                <li>💰 Start earning from your items!</li>
              </ol>
            </div>
            
            <p>Our host support team is here to help you succeed. Don't hesitate to reach out if you have any questions.</p>
            
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/host/dashboard" class="btn">Host Dashboard</a>
            <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/host/listings/new" class="btn">Create Listing</a>
          </div>
          <div class="footer">
            <p>Welcome to the host community!</p>
            <p>The P2P Marketplace Host Team</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Helper method to strip HTML tags for plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();
