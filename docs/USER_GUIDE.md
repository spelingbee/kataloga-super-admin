# Super Admin Panel - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Tenant Management](#tenant-management)
5. [Registration Approval](#registration-approval)
6. [Subscription Management](#subscription-management)
7. [Analytics & Reporting](#analytics--reporting)
8. [Email System](#email-system)
9. [Security & Audit](#security--audit)
10. [System Settings](#system-settings)
11. [Support & Communication](#support--communication)

---

## Introduction

The Super Admin Panel is a comprehensive administrative interface for managing your multi-tenant platform. It provides complete control over tenants, subscriptions, analytics, security, and system configuration.

### Key Features

- **Dashboard**: Real-time metrics and platform health monitoring
- **Tenant Management**: Complete tenant lifecycle management
- **Registration Approval**: Review and approve new tenant applications
- **Subscription Management**: Billing, plans, and payment oversight
- **Analytics**: Comprehensive business intelligence and reporting
- **Email System**: Email delivery monitoring and template management
- **Security**: Audit logs, security events, and threat monitoring
- **Settings**: System-wide configuration and integrations

---

## Getting Started

### Logging In

1. Navigate to the Super Admin Panel URL
2. Enter your admin credentials
3. Complete two-factor authentication (if enabled)
4. You'll be redirected to the dashboard

### Navigation

The main navigation is located in the left sidebar:

- **Dashboard**: Overview and key metrics
- **Tenants**: Manage all tenants
- **Registrations**: Approve new applications
- **Subscriptions**: Billing and plans
- **Analytics**: Reports and insights
- **Emails**: Email system management
- **Audit**: Security and audit logs
- **Settings**: System configuration

### Keyboard Shortcuts

- `Cmd/Ctrl + K`: Open global search
- `Cmd/Ctrl + /`: Show keyboard shortcuts
- `Esc`: Close modals and dialogs

---

## Dashboard Overview

The dashboard provides a quick overview of your platform's health and performance.

### Key Metrics

**Tenant Statistics**
- Total tenants (active, pending, suspended)
- New registrations this month
- Tenant growth rate

**Revenue Metrics**
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Revenue growth percentage
- Churn rate

**System Health**
- API uptime percentage
- Database status
- Email delivery rate
- Storage usage

### Recent Activity

View the latest platform activities:
- New tenant registrations
- Subscription changes
- Payment events
- Security alerts

### Quick Actions

Access common tasks directly from the dashboard:
- Approve pending registrations
- View failed payments
- Check security alerts
- Export reports

---

## Tenant Management

### Viewing Tenants

1. Navigate to **Tenants** in the sidebar
2. Use filters to narrow down the list:
   - Status (active, pending, suspended)
   - Subscription plan
   - Registration date
3. Use the search bar to find specific tenants

### Tenant Details

Click on any tenant to view:
- Business information
- Owner details
- Subscription status
- Usage statistics
- Menu items and orders
- Revenue metrics

### Tenant Actions

**Activate Tenant**
1. Open tenant details
2. Click "Activate"
3. Confirm the action
4. Tenant receives activation email

**Suspend Tenant**
1. Open tenant details
2. Click "Suspend"
3. Provide a reason
4. Confirm suspension
5. Tenant access is immediately restricted

**Deactivate Tenant**
1. Open tenant details
2. Click "Deactivate"
3. Confirm the action
4. Tenant is moved to inactive status

**Delete Tenant**
1. Open tenant details
2. Click "Delete"
3. Type tenant name to confirm
4. All tenant data is permanently removed

### Tenant Settings

Modify tenant-specific settings:
- Business information
- Contact details
- Feature flags
- Custom configurations

### Tenant Impersonation

For troubleshooting purposes:
1. Open tenant details
2. Click "Impersonate"
3. Review security warning
4. Confirm impersonation
5. Tenant dashboard opens in new tab
6. All actions are logged in audit trail

---

## Registration Approval

### Viewing Pending Registrations

1. Navigate to **Registrations**
2. Filter by status:
   - Pending review
   - Information requested
   - Approved
   - Rejected

### Reviewing Applications

1. Click on a pending registration
2. Review all submitted information:
   - Business details
   - Owner information
   - Contact details
   - Uploaded documents
3. Check for completeness and accuracy

### Approval Actions

**Approve Registration**
1. Review all details
2. Click "Approve"
3. Add optional approval notes
4. Confirm approval
5. System automatically:
   - Creates tenant account
   - Sends welcome email
   - Activates trial subscription

**Reject Registration**
1. Click "Reject"
2. Select rejection reason:
   - Incomplete information
   - Invalid business details
   - Duplicate registration
   - Other (specify)
3. Add detailed explanation
4. Confirm rejection
5. Applicant receives rejection email

**Request More Information**
1. Click "Request Information"
2. Specify what information is needed
3. Add detailed instructions
4. Send request
5. Registration status changes to "Info Requested"
6. Applicant receives notification

### Bulk Actions

Process multiple registrations:
1. Select registrations using checkboxes
2. Choose bulk action:
   - Approve selected
   - Reject selected
3. Confirm action

---

## Subscription Management

### Viewing Subscriptions

1. Navigate to **Subscriptions**
2. Filter by:
   - Status (trial, active, cancelled, expired)
   - Plan type
   - Billing cycle
3. Sort by renewal date, revenue, or status

### Subscription Details

View complete subscription information:
- Current plan and pricing
- Billing cycle (monthly/yearly)
- Trial period (if applicable)
- Payment method
- Next billing date
- Billing history
- Usage statistics

### Managing Subscriptions

**Change Plan**
1. Open subscription details
2. Click "Change Plan"
3. Select new plan
4. Review prorated amount
5. Confirm change
6. Tenant is notified

**Extend Trial**
1. Open subscription details
2. Click "Extend Trial"
3. Set new trial end date
4. Add reason for audit
5. Confirm extension
6. Tenant receives notification

**Apply Discount**
1. Open subscription details
2. Click "Apply Discount"
3. Choose discount type:
   - Percentage off
   - Fixed amount off
4. Set discount duration (months)
5. Add reason
6. Apply discount
7. Next invoice reflects discount

**Cancel Subscription**
1. Open subscription details
2. Click "Cancel Subscription"
3. Select cancellation reason
4. Choose cancellation timing:
   - Immediate
   - End of billing period
5. Confirm cancellation
6. Tenant receives cancellation notice

### Billing History

View all payment transactions:
- Payment date and amount
- Payment status (paid, pending, failed, refunded)
- Invoice links
- Payment method used

### Refunds

Process refunds:
1. Open billing history
2. Select transaction
3. Click "Refund"
4. Enter refund amount
5. Add reason
6. Process refund
7. Action is logged in audit trail

---

## Analytics & Reporting

### Analytics Dashboard

Access comprehensive analytics:
1. Navigate to **Analytics**
2. Select date range
3. View key metrics and charts

### Available Analytics

**Registration Analytics**
- New registrations over time
- Conversion rates
- Registration sources
- Approval/rejection rates
- Time to approval

**Tenant Performance**
- Tenant growth trends
- Retention rates
- Churn analysis
- Active vs inactive tenants
- Top performing tenants

**Revenue Analytics**
- MRR/ARR trends
- Revenue by plan
- Revenue growth rate
- Revenue forecasts
- Average revenue per tenant

**Conversion Funnel**
- Registration to activation flow
- Drop-off rates at each stage
- Conversion optimization insights

**Cohort Analysis**
- Retention by cohort
- Behavior patterns
- Cohort comparison
- Lifetime value analysis

**Geographic Distribution**
- Tenants by region
- Regional performance
- Geographic trends
- Market penetration

### Exporting Reports

**CSV Export**
1. Select data table
2. Click "Export"
3. Choose "CSV"
4. File downloads automatically

**PDF Report**
1. Configure report parameters
2. Click "Export"
3. Choose "PDF"
4. Report generates and downloads

**Chart Images**
1. Hover over chart
2. Click export icon
3. Choose format (PNG, SVG)
4. Image downloads

### Custom Reports

Build custom reports:
1. Click "Report Builder"
2. Select metrics to include
3. Choose date range
4. Add filters
5. Preview report
6. Save as template (optional)
7. Generate and export

---

## Email System

### Email Dashboard

Monitor email system health:
- Total emails sent
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam complaints

### Email List

View all sent emails:
1. Navigate to **Emails** > **List**
2. Filter by:
   - Email type (welcome, notification, etc.)
   - Status (sent, delivered, bounced, opened)
   - Date range
   - Recipient
3. Search by subject or recipient

### Email Details

View individual email:
- Full email content (HTML preview)
- Recipient information
- Delivery status
- Tracking events timeline:
  - Sent
  - Delivered
  - Opened
  - Clicked
  - Bounced

### Template Management

**View Templates**
1. Navigate to **Emails** > **Templates**
2. See all email templates
3. Check template status (active/inactive)

**Edit Template**
1. Select template
2. Click "Edit"
3. Modify content using rich text editor
4. Use variables: `{{tenant_name}}`, `{{owner_name}}`, etc.
5. Preview template
6. Save changes

**Create Template**
1. Click "New Template"
2. Enter template name
3. Select template type
4. Design email content
5. Add variables
6. Preview and test
7. Activate template

### Email Provider Configuration

Configure email delivery:
1. Navigate to **Emails** > **Providers**
2. Select provider:
   - SMTP
   - SendGrid
   - AWS SES
   - Mailgun
3. Enter credentials
4. Test connection
5. Save configuration

---

## Security & Audit

### Audit Logs

View all administrative actions:
1. Navigate to **Audit** > **Logs**
2. Filter by:
   - Action type
   - Admin user
   - Date range
   - Resource type
3. View detailed event information

**Audit Log Details**
- Timestamp
- Admin user
- Action performed
- Resource affected
- IP address
- User agent
- Result (success/failure)
- Additional metadata

**Export Audit Logs**
1. Set filters
2. Click "Export"
3. Choose format (CSV, PDF)
4. Select date range
5. Generate compliance report

### Audit Analytics

View audit statistics:
- Actions by type
- Most active admins
- Action trends over time
- Failed action attempts

### Security Dashboard

Monitor security metrics:
- Failed login attempts
- Blocked IP addresses
- Suspicious activities
- Security alerts
- Active sessions

### Security Events

View security-related events:
1. Navigate to **Security** > **Events**
2. Filter by:
   - Event type
   - Severity (low, medium, high, critical)
   - Date range
3. Review event details
4. Take action if needed

### IP Management

**View Blocked IPs**
1. Navigate to **Security** > **Blocked IPs**
2. See all blocked addresses
3. View block reason and expiration

**Block IP Address**
1. Click "Block IP"
2. Enter IP address
3. Select block duration:
   - 1 hour
   - 24 hours
   - 7 days
   - Permanent
4. Add reason
5. Confirm block

**Unblock IP Address**
1. Find blocked IP
2. Click "Unblock"
3. Confirm action
4. IP is immediately unblocked

### Suspicious Activity

Monitor potential threats:
- Multiple failed login attempts
- Unusual access patterns
- Fraud detection alerts
- Risk score indicators

**Investigate Activity**
1. Navigate to **Security** > **Suspicious Activity**
2. Review flagged activities
3. Check risk scores
4. View related events
5. Take action:
   - Block IP
   - Suspend account
   - Mark as false positive

---

## System Settings

### General Settings

Configure platform-wide settings:
1. Navigate to **Settings**
2. Select **General** tab
3. Modify:
   - Platform name
   - Default language
   - Timezone
   - Feature flags
   - Default values
4. Save changes

### Email Provider Settings

Configure email delivery:
1. Select **Email Provider** tab
2. Choose provider type
3. Enter configuration:
   - SMTP: host, port, credentials
   - API-based: API key, region
4. Test connection
5. Save configuration

### Payment Gateway Settings

Configure payment processing:
1. Select **Payment Gateway** tab
2. Configure Stripe:
   - Publishable key
   - Secret key
   - Webhook secret
3. Configure PayPal (optional):
   - Client ID
   - Client secret
4. Test connections
5. Save settings

### Storage Configuration

Configure file storage:
1. Select **Storage** tab
2. Choose storage type:
   - AWS S3
   - Local storage
3. For S3:
   - Bucket name
   - Region
   - Access key
   - Secret key
4. Test connection
5. View storage usage
6. Save configuration

### Integration Management

**Telegram Bot**
1. Navigate to **Integrations**
2. Select Telegram
3. Enter bot token
4. Set webhook URL
5. Test connection
6. Configure notification settings
7. Enable integration

**Webhooks**
1. Navigate to **Integrations**
2. Select Webhooks
3. Add webhook endpoint
4. Choose events to trigger
5. Test webhook delivery
6. View webhook logs
7. Enable webhook

---

## Support & Communication

### Announcements

**Create Announcement**
1. Navigate to **Announcements**
2. Click "New Announcement"
3. Enter title and content
4. Use rich text editor for formatting
5. Select target audience:
   - All tenants
   - Specific plans
   - Individual tenants
6. Choose delivery method:
   - Email
   - In-app notification
   - Both
7. Schedule or send immediately
8. Preview announcement
9. Send

**View Announcements**
- See all sent announcements
- View scheduled announcements
- Check delivery statistics
- Edit draft announcements

### Support Tickets

**View Tickets**
1. Navigate to **Support**
2. Filter by:
   - Status (open, in progress, closed)
   - Priority (low, medium, high, urgent)
   - Assigned admin
3. Sort by date or priority

**Respond to Ticket**
1. Open ticket details
2. View full conversation
3. Review tenant information
4. Type response
5. Attach files (optional)
6. Send reply
7. Tenant receives email notification

**Manage Tickets**
- Change status
- Assign to admin
- Set priority
- Add internal notes
- Close ticket
- Reopen ticket

---

## Best Practices

### Security

- Enable two-factor authentication
- Use strong passwords
- Review audit logs regularly
- Monitor security alerts
- Keep IP blocklist updated
- Limit admin user permissions

### Tenant Management

- Review registrations promptly (within 24 hours)
- Provide clear rejection reasons
- Document impersonation sessions
- Monitor tenant health metrics
- Respond to support tickets quickly

### Subscription Management

- Review failed payments weekly
- Monitor churn rates
- Offer discounts strategically
- Extend trials for qualified leads
- Process refunds promptly

### Analytics

- Review dashboard daily
- Generate monthly reports
- Track key metrics trends
- Use data for decision-making
- Export reports for stakeholders

### Email System

- Monitor delivery rates
- Keep templates updated
- Test emails before sending
- Review bounce rates
- Maintain sender reputation

---

## Troubleshooting

### Cannot Log In

- Verify credentials
- Check two-factor authentication
- Clear browser cache
- Try incognito/private mode
- Contact system administrator

### Dashboard Not Loading

- Check internet connection
- Refresh the page
- Clear browser cache
- Check browser console for errors
- Verify API is running

### Email Not Sending

- Check email provider configuration
- Verify API credentials
- Test provider connection
- Review email logs
- Check bounce rate

### Subscription Changes Not Applying

- Verify payment gateway connection
- Check subscription status
- Review error logs
- Retry the action
- Contact technical support

### Reports Not Generating

- Check date range
- Verify data exists for period
- Try smaller date range
- Check browser console
- Clear cache and retry

---

## Support

For technical support or questions:

- **Email**: support@yourplatform.com
- **Documentation**: https://docs.yourplatform.com
- **Status Page**: https://status.yourplatform.com

---

## Glossary

- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue
- **Churn Rate**: Percentage of customers who cancel
- **Tenant**: A business using your platform
- **Impersonation**: Logging in as a tenant for troubleshooting
- **Audit Trail**: Log of all administrative actions
- **Two-Factor Authentication**: Additional security layer for login

---

*Last Updated: November 2025*
