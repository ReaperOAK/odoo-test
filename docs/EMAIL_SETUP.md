# Email Notification System with Resend

This P2P Marketplace application includes a comprehensive email notification system powered by [Resend](https://resend.com/). The system sends transactional emails for all major user actions and order lifecycle events.

## 🚀 Quick Setup

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com/)
2. Create an API key
3. Verify your sending domain (or use their test domain)

### 2. Configure Environment Variables
Add to your `.env` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
EMAIL_ENABLED=true
```

### 3. Test Email Service
```bash
cd backend
node test-email.js
```

## 📧 Email Types

### User Registration & Authentication
- **Welcome Email** - Sent when users register
- **Host Welcome Email** - Sent when users upgrade to host

### Order Lifecycle
- **Booking Confirmation** - Sent to customer when order is created
- **Booking Notification** - Sent to host when new booking is received
- **Payment Confirmation** - Sent when payment is successfully processed
- **Order Status Updates** - Sent when order status changes (confirmed, in_progress, completed, disputed)
- **Cancellation Confirmation** - Sent when order is cancelled

### Host & Admin
- **Payout Notification** - Sent to hosts when payouts are processed

## 🔧 Technical Implementation

### Service Architecture
- **Location**: `src/services/email.service.js`
- **Integration**: Imported in controllers where needed
- **Design**: Non-blocking email sending (doesn't fail API requests)
- **Fallback**: Graceful degradation when email service is unavailable

### Email Templates
All emails use inline HTML with responsive design:
- Professional styling with consistent branding
- Mobile-friendly responsive layout
- Clear call-to-action buttons
- Order details and status information
- Brand colors and typography

### Error Handling
- Emails are sent asynchronously to avoid blocking API responses
- Failed email sends are logged but don't affect user operations
- Configurable email enabling/disabling for development

## 📋 Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `RESEND_API_KEY` | - | Resend API key (required for sending) |
| `FROM_EMAIL` | `noreply@p2pmarketplace.com` | Sender email address |
| `EMAIL_ENABLED` | `true` | Enable/disable email sending |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for email links |

## 🧪 Testing

### Manual Testing
```bash
# Test all email functions
node test-email.js

# Set custom test email
TEST_EMAIL=your-email@example.com node test-email.js
```

### Development Mode
- Set `EMAIL_ENABLED=false` to disable emails during development
- Emails will be logged to console instead of sent
- Useful for testing without spam

### Production Considerations
- Verify your sending domain with Resend
- Use your actual domain email for `FROM_EMAIL`
- Monitor email delivery rates and bounces
- Consider implementing email preferences for users

## 📨 Email Triggers

### Automatic Triggers
| Event | Email Sent | Recipients |
|-------|------------|------------|
| User Registration | Welcome Email | New User |
| Become Host | Host Welcome | New Host |
| Order Created | Booking Confirmation + Host Notification | Customer + Host |
| Payment Success | Payment Confirmation | Customer |
| Order Status Change | Status Update | Customer |
| Order Cancelled | Cancellation Confirmation | Customer |
| Payout Processed | Payout Notification | Host |

### API Integration
All emails are triggered automatically by the existing API endpoints:
- `POST /auth/register` → Welcome email
- `POST /auth/become-host` → Host welcome email
- `POST /orders` → Booking emails
- `PATCH /orders/:id/status` → Status update email
- `POST /orders/:id/cancel` → Cancellation email
- Webhook payments → Payment confirmation email
- `POST /admin/payouts/:id/process` → Payout notification

## 🎨 Customization

### Email Templates
Modify the HTML generation methods in `email.service.js`:
- `generateWelcomeHTML()`
- `generateBookingConfirmationHTML()`
- `generatePaymentConfirmationHTML()`
- etc.

### Styling
- All styles are inline for email client compatibility
- Uses responsive design principles
- Colors and fonts can be customized in the template methods
- Consider using email-specific CSS frameworks for advanced styling

### Content
- Email subject lines and content can be modified in the service methods
- Support for both HTML and plain text versions
- Easy to add new email types by following existing patterns

## 🔒 Security & Privacy

### Email Security
- API keys are stored securely in environment variables
- Webhook signature verification for payment emails
- No sensitive data in email content (order IDs only)

### Privacy Considerations
- Only sends emails to order participants
- Option to disable emails for individual users (can be extended)
- GDPR-compliant email practices
- Clear unsubscribe options (can be added)

## 🚨 Troubleshooting

### Common Issues

**Emails not sending:**
1. Check `RESEND_API_KEY` is set correctly
2. Verify `EMAIL_ENABLED=true`
3. Check sender domain is verified in Resend
4. Review application logs for email errors

**Emails in spam folder:**
1. Verify your sending domain with Resend
2. Set up SPF/DKIM records
3. Use your actual business domain
4. Monitor sender reputation

**Template issues:**
1. Test with `node test-email.js`
2. Check HTML validation
3. Test in multiple email clients
4. Verify responsive design

### Monitoring
- Check application logs for email send status
- Monitor Resend dashboard for delivery metrics
- Set up alerts for high bounce rates
- Track email engagement (opens/clicks) via Resend

## 🔗 External Links
- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://github.com/resendlabs/resend-node)
- [Email HTML Best Practices](https://www.campaignmonitor.com/email-templates/)
- [Email Client CSS Support](https://www.caniemail.com/)
