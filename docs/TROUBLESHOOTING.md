# Super Admin Panel - Troubleshooting Guide

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [API Connection Problems](#api-connection-problems)
3. [Data Loading Issues](#data-loading-issues)
4. [Performance Problems](#performance-problems)
5. [Email System Issues](#email-system-issues)
6. [Subscription Management Issues](#subscription-management-issues)
7. [Analytics & Reporting Issues](#analytics--reporting-issues)
8. [Security & Audit Issues](#security--audit-issues)
9. [UI/UX Issues](#uiux-issues)
10. [Development Issues](#development-issues)

---

## Authentication Issues

### Cannot Log In

**Symptoms:**
- Login form shows "Invalid credentials"
- Login button doesn't respond
- Redirected back to login page after successful login

**Possible Causes & Solutions:**

1. **Incorrect Credentials**
   ```bash
   # Check super admin credentials in backend .env
   cat apps/backend/.env | grep SUPER_ADMIN
   
   # Default credentials (development):
   # Email: admin@localhost.dev
   # Password: Admin123!
   ```

2. **Backend Not Running**
   ```bash
   # Check if backend is running
   curl http://localhost:3000/health
   
   # Start backend if not running
   cd apps/backend
   pnpm dev
   ```

3. **CORS Issues**
   ```bash
   # Check browser console for CORS errors
   # Verify CORS_ORIGINS in backend .env includes admin URL
   CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
   ```

4. **JWT Token Issues**
   ```bash
   # Clear browser storage
   # Open DevTools > Application > Storage > Clear site data
   
   # Or programmatically:
   localStorage.clear()
   sessionStorage.clear()
   ```

5. **Database Connection**
   ```bash
   # Verify database is running
   psql -U postgres -d platform_dev
   
   # Check if super admin user exists
   SELECT * FROM users WHERE role = 'SUPER_ADMIN';
   ```

### Session Expires Too Quickly

**Solution:**

Check JWT expiration settings in `apps/backend/.env`:

```env
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```

Increase values if needed.

### Two-Factor Authentication Not Working

**Symptoms:**
- 2FA code not accepted
- QR code not displaying

**Solutions:**

1. **Time Sync Issues**
   ```bash
   # Ensure system time is correct
   date
   
   # Sync time (Linux)
   sudo ntpdate -s time.nist.gov
   ```

2. **Disable 2FA Temporarily**
   ```sql
   -- In database
   UPDATE users 
   SET two_factor_enabled = false 
   WHERE email = 'admin@localhost.dev';
   ```

3. **Regenerate 2FA Secret**
   - Log in without 2FA
   - Go to Settings > Security
   - Disable and re-enable 2FA

---

## API Connection Problems

### API Requests Failing

**Symptoms:**
- "Network Error" messages
- Data not loading
- Infinite loading spinners

**Diagnostic Steps:**

1. **Check API URL**
   ```bash
   # Verify API URL in super-admin .env
   cat apps/super-admin/.env | grep API_URL
   
   # Should be: NUXT_PUBLIC_API_URL="http://localhost:3000"
   ```

2. **Test API Directly**
   ```bash
   # Test health endpoint
   curl http://localhost:3000/health
   
   # Test admin endpoint (with auth)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/dashboard/metrics
   ```

3. **Check Network Tab**
   - Open DevTools > Network
   - Look for failed requests
   - Check status codes and response

4. **Verify Backend Logs**
   ```bash
   # Check backend console output
   cd apps/backend
   pnpm dev
   
   # Look for errors or warnings
   ```

### CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution:**

1. **Update Backend CORS Configuration**
   
   Edit `apps/backend/.env`:
   ```env
   CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
   CORS_CREDENTIALS="true"
   ```

2. **Restart Backend**
   ```bash
   cd apps/backend
   # Stop and restart
   pnpm dev
   ```

3. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### Timeout Errors

**Error Message:**
```
Request timeout of 30000ms exceeded
```

**Solutions:**

1. **Increase Timeout**
   
   Edit `apps/super-admin/.env`:
   ```env
   NUXT_PUBLIC_API_TIMEOUT="60000"
   ```

2. **Optimize Backend Query**
   - Check slow database queries
   - Add database indexes
   - Implement pagination

3. **Check Network Connection**
   ```bash
   # Test latency
   ping api.yourplatform.com
   
   # Test connection speed
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
   ```

---

## Data Loading Issues

### Dashboard Not Loading

**Symptoms:**
- Blank dashboard
- Loading spinner never stops
- "Failed to load data" error

**Solutions:**

1. **Check API Response**
   ```bash
   # Test dashboard endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/dashboard/metrics
   ```

2. **Clear Cache**
   ```javascript
   // In browser console
   localStorage.removeItem('dashboard-cache')
   location.reload()
   ```

3. **Check Browser Console**
   - Open DevTools > Console
   - Look for JavaScript errors
   - Check for failed API calls

4. **Verify Data Exists**
   ```sql
   -- Check if tenants exist
   SELECT COUNT(*) FROM tenants;
   
   -- Check if subscriptions exist
   SELECT COUNT(*) FROM subscriptions;
   ```

### Tenant List Empty

**Symptoms:**
- No tenants showing in list
- "No data available" message

**Solutions:**

1. **Verify Tenants Exist**
   ```sql
   SELECT id, name, status FROM tenants LIMIT 10;
   ```

2. **Check Filters**
   - Clear all filters
   - Reset search query
   - Check status filter (active/pending/all)

3. **Check Pagination**
   - Verify page number
   - Check items per page setting
   - Try resetting to page 1

4. **Seed Test Data**
   ```bash
   cd apps/backend
   pnpm prisma db seed
   ```

### Analytics Not Displaying

**Symptoms:**
- Charts not rendering
- "No data for selected period" message

**Solutions:**

1. **Check Date Range**
   - Ensure date range includes data
   - Try "Last 30 days" preset
   - Verify dates are not in future

2. **Verify Data Exists**
   ```sql
   -- Check for recent data
   SELECT DATE(created_at), COUNT(*) 
   FROM tenants 
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at);
   ```

3. **Check Chart Library**
   ```bash
   # Verify Chart.js is installed
   cd apps/super-admin
   pnpm list chart.js
   ```

4. **Clear Analytics Cache**
   ```javascript
   // In browser console
   localStorage.removeItem('analytics-cache')
   location.reload()
   ```

---

## Performance Problems

### Slow Page Load

**Symptoms:**
- Pages take >5 seconds to load
- UI feels sluggish
- High memory usage

**Diagnostic Steps:**

1. **Check Network Performance**
   - Open DevTools > Network
   - Look for slow requests
   - Check total load time

2. **Profile Performance**
   - Open DevTools > Performance
   - Record page load
   - Identify bottlenecks

3. **Check Bundle Size**
   ```bash
   cd apps/super-admin
   pnpm build
   pnpm analyze
   ```

**Solutions:**

1. **Enable Caching**
   
   Verify cache is enabled in `apps/super-admin/.env`:
   ```env
   NUXT_PUBLIC_CACHE_DASHBOARD_TTL="300000"
   NUXT_PUBLIC_CACHE_ANALYTICS_TTL="600000"
   ```

2. **Optimize Images**
   - Use WebP format
   - Implement lazy loading
   - Compress images

3. **Reduce Bundle Size**
   - Remove unused dependencies
   - Use dynamic imports
   - Enable tree-shaking

4. **Database Optimization**
   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_tenants_status ON tenants(status);
   CREATE INDEX idx_tenants_created_at ON tenants(created_at);
   CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
   ```

### High Memory Usage

**Symptoms:**
- Browser tab crashes
- "Out of memory" errors
- System becomes unresponsive

**Solutions:**

1. **Clear Browser Cache**
   - Close other tabs
   - Clear browser cache
   - Restart browser

2. **Reduce Data Load**
   - Decrease items per page
   - Use pagination
   - Implement virtual scrolling

3. **Fix Memory Leaks**
   ```javascript
   // Ensure cleanup in components
   onUnmounted(() => {
     // Clear intervals
     clearInterval(intervalId)
     // Remove event listeners
     window.removeEventListener('resize', handler)
   })
   ```

### Slow API Responses

**Symptoms:**
- API calls take >3 seconds
- Timeout errors
- Database queries slow

**Solutions:**

1. **Check Database Performance**
   ```sql
   -- Find slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Add Database Indexes**
   ```sql
   -- Analyze query plan
   EXPLAIN ANALYZE SELECT * FROM tenants WHERE status = 'active';
   
   -- Add index if needed
   CREATE INDEX idx_tenants_status ON tenants(status);
   ```

3. **Implement Caching**
   - Use Redis for frequently accessed data
   - Cache dashboard metrics
   - Cache analytics results

4. **Optimize Queries**
   - Use select specific fields instead of `SELECT *`
   - Implement pagination
   - Use database joins efficiently

---

## Email System Issues

### Emails Not Sending

**Symptoms:**
- Emails stuck in "pending" status
- "Failed to send email" errors
- No emails received

**Solutions:**

1. **Check Email Provider Configuration**
   ```bash
   # Verify email settings in backend .env
   cat apps/backend/.env | grep EMAIL
   cat apps/backend/.env | grep SMTP
   ```

2. **Test Email Connection**
   ```bash
   # Test SMTP connection
   curl -v telnet://smtp.gmail.com:587
   ```

3. **Check Email Logs**
   ```bash
   # View backend logs
   cd apps/backend
   tail -f logs/app.log | grep email
   ```

4. **Verify Email Provider Status**
   - Check SendGrid status: https://status.sendgrid.com/
   - Check AWS SES status: https://status.aws.amazon.com/
   - Check SMTP server status

5. **Test with Console Provider**
   
   Temporarily switch to console provider for testing:
   ```env
   EMAIL_PROVIDER="console"
   ```
   
   Emails will be logged to console instead of sent.

### High Bounce Rate

**Symptoms:**
- Many emails bouncing
- Low delivery rate
- Spam complaints

**Solutions:**

1. **Verify Email Addresses**
   - Check for typos
   - Validate email format
   - Remove invalid addresses

2. **Check Sender Reputation**
   - Verify SPF records
   - Set up DKIM
   - Configure DMARC

3. **Review Email Content**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper formatting

4. **Monitor Bounce Types**
   - Hard bounces: Remove from list
   - Soft bounces: Retry later
   - Spam complaints: Review content

### Email Templates Not Updating

**Symptoms:**
- Changes to templates not reflected
- Old template version still sending

**Solutions:**

1. **Clear Template Cache**
   ```bash
   # Restart backend to clear cache
   cd apps/backend
   # Stop and restart
   ```

2. **Verify Template Status**
   - Check template is active
   - Verify template ID is correct
   - Check template version

3. **Test Template**
   - Use template preview
   - Send test email
   - Verify variables are replaced

---

## Subscription Management Issues

### Subscription Changes Not Applying

**Symptoms:**
- Plan changes not saved
- Trial extensions not working
- Discounts not applied

**Solutions:**

1. **Check Payment Gateway Connection**
   ```bash
   # Test Stripe connection
   curl https://api.stripe.com/v1/customers \
     -u sk_test_YOUR_KEY:
   ```

2. **Verify Subscription Status**
   ```sql
   SELECT id, status, plan_id, trial_ends_at 
   FROM subscriptions 
   WHERE tenant_id = 'TENANT_ID';
   ```

3. **Check Backend Logs**
   ```bash
   cd apps/backend
   tail -f logs/app.log | grep subscription
   ```

4. **Verify Webhook Configuration**
   - Check Stripe webhook endpoint
   - Verify webhook secret
   - Test webhook delivery

### Payment Failures

**Symptoms:**
- Payments failing
- "Payment method declined" errors
- Subscription cancelled unexpectedly

**Solutions:**

1. **Check Payment Method**
   - Verify card is valid
   - Check card expiration
   - Ensure sufficient funds

2. **Review Stripe Dashboard**
   - Check failed payments
   - Review decline reasons
   - Check customer details

3. **Test Payment Flow**
   - Use Stripe test cards
   - Test different scenarios
   - Verify webhook handling

4. **Check Logs**
   ```bash
   # View payment logs
   cd apps/backend
   tail -f logs/app.log | grep payment
   ```

---

## Analytics & Reporting Issues

### Reports Not Generating

**Symptoms:**
- Export button doesn't work
- PDF/CSV download fails
- "Failed to generate report" error

**Solutions:**

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests
   - Verify file download permissions

2. **Verify Data Exists**
   - Check date range has data
   - Verify filters are correct
   - Test with smaller dataset

3. **Check File Size**
   - Large reports may timeout
   - Reduce date range
   - Limit data points

4. **Test Export Functionality**
   ```bash
   # Test export endpoint directly
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -o report.csv \
        http://localhost:3000/api/admin/analytics/export?format=csv
   ```

### Charts Not Rendering

**Symptoms:**
- Blank chart areas
- "Failed to load chart" error
- Chart data incorrect

**Solutions:**

1. **Check Chart Library**
   ```bash
   # Verify Chart.js is installed
   cd apps/super-admin
   pnpm list chart.js
   
   # Reinstall if needed
   pnpm add chart.js
   ```

2. **Verify Data Format**
   ```javascript
   // Check data structure in console
   console.log(chartData)
   
   // Should match Chart.js format
   {
     labels: ['Jan', 'Feb', 'Mar'],
     datasets: [{
       label: 'Revenue',
       data: [100, 200, 300]
     }]
   }
   ```

3. **Check Canvas Element**
   - Verify canvas element exists
   - Check canvas dimensions
   - Ensure proper container sizing

4. **Clear Chart Cache**
   ```javascript
   // Destroy and recreate chart
   if (chartInstance) {
     chartInstance.destroy()
   }
   chartInstance = new Chart(ctx, config)
   ```

### Incorrect Analytics Data

**Symptoms:**
- Numbers don't match expectations
- Metrics seem wrong
- Inconsistent data

**Solutions:**

1. **Verify Database Queries**
   ```sql
   -- Manually run analytics queries
   SELECT COUNT(*) FROM tenants WHERE status = 'active';
   SELECT SUM(amount) FROM payments WHERE status = 'paid';
   ```

2. **Check Date Range**
   - Verify timezone settings
   - Check date filters
   - Ensure correct period

3. **Review Calculation Logic**
   - Check MRR/ARR calculations
   - Verify churn rate formula
   - Review growth percentage logic

4. **Compare with Source Data**
   - Cross-reference with database
   - Check payment gateway data
   - Verify with external reports

---

## Security & Audit Issues

### Audit Logs Not Recording

**Symptoms:**
- No audit logs appearing
- Missing action records
- Incomplete audit trail

**Solutions:**

1. **Verify Audit Logging Enabled**
   ```typescript
   // Check audit interceptor is registered
   // In backend main.ts or app.module.ts
   ```

2. **Check Database**
   ```sql
   SELECT COUNT(*) FROM audit_logs;
   SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
   ```

3. **Test Audit Logging**
   - Perform an action (e.g., approve tenant)
   - Check if audit log created
   - Verify all fields populated

4. **Check Permissions**
   ```sql
   -- Verify table permissions
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name='audit_logs';
   ```

### Security Alerts Not Showing

**Symptoms:**
- No security alerts displayed
- Failed login attempts not tracked
- Suspicious activity not detected

**Solutions:**

1. **Verify Security Monitoring Enabled**
   ```bash
   # Check backend configuration
   cat apps/backend/.env | grep SECURITY
   ```

2. **Test Security Detection**
   - Attempt failed login
   - Check if event recorded
   - Verify alert generated

3. **Check Alert Thresholds**
   - Review alert configuration
   - Adjust sensitivity if needed
   - Test with known patterns

### IP Blocking Not Working

**Symptoms:**
- Blocked IPs can still access
- Block action doesn't save
- IP unblocked unexpectedly

**Solutions:**

1. **Verify IP Blocking Implementation**
   ```bash
   # Check if IP blocking middleware is active
   # Review backend logs
   ```

2. **Check IP Format**
   - Verify IP address format (IPv4/IPv6)
   - Check for CIDR notation
   - Test with specific IP

3. **Review Firewall Rules**
   ```bash
   # Check system firewall
   sudo ufw status
   
   # Check Nginx configuration
   sudo nginx -t
   ```

---

## UI/UX Issues

### Layout Broken

**Symptoms:**
- Elements overlapping
- Responsive design not working
- Sidebar not displaying

**Solutions:**

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R
   - Clear cache and cookies
   - Try incognito mode

2. **Check CSS Loading**
   - Open DevTools > Network
   - Verify CSS files loaded
   - Check for 404 errors

3. **Verify Tailwind Configuration**
   ```bash
   cd apps/super-admin
   # Check tailwind.config.js exists
   cat tailwind.config.js
   ```

4. **Rebuild Application**
   ```bash
   cd apps/super-admin
   rm -rf .nuxt .output
   pnpm dev
   ```

### Dark Mode Not Working

**Symptoms:**
- Dark mode toggle doesn't work
- Colors not changing
- Inconsistent theming

**Solutions:**

1. **Check Theme Store**
   ```javascript
   // In browser console
   localStorage.getItem('theme')
   // Should be 'light' or 'dark'
   ```

2. **Verify CSS Variables**
   ```css
   /* Check if dark mode classes exist */
   .dark {
     --bg-primary: #0f172a;
     /* ... */
   }
   ```

3. **Clear Theme Cache**
   ```javascript
   localStorage.removeItem('theme')
   location.reload()
   ```

### Modal Not Closing

**Symptoms:**
- Modal stuck open
- Close button doesn't work
- Escape key not working

**Solutions:**

1. **Check Event Listeners**
   ```javascript
   // Verify close handlers are attached
   // Check for event.stopPropagation() issues
   ```

2. **Force Close Modal**
   ```javascript
   // In browser console
   document.querySelector('.modal-overlay').click()
   ```

3. **Restart Application**
   - Refresh page
   - Clear component state
   - Check for memory leaks

---

## Development Issues

### Hot Reload Not Working

**Symptoms:**
- Changes not reflecting
- Need to manually refresh
- Dev server not detecting changes

**Solutions:**

1. **Clear Nuxt Cache**
   ```bash
   cd apps/super-admin
   rm -rf .nuxt .output
   pnpm dev
   ```

2. **Check File Watchers**
   ```bash
   # Increase file watcher limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart Dev Server**
   ```bash
   # Stop dev server (Ctrl+C)
   # Start again
   pnpm dev
   ```

### TypeScript Errors

**Symptoms:**
- Type errors in IDE
- Build fails with type errors
- "Cannot find module" errors

**Solutions:**

1. **Regenerate Types**
   ```bash
   cd apps/super-admin
   pnpm nuxt prepare
   ```

2. **Check TypeScript Configuration**
   ```bash
   cat tsconfig.json
   # Verify extends and paths are correct
   ```

3. **Install Type Definitions**
   ```bash
   pnpm add -D @types/node
   ```

4. **Restart TypeScript Server**
   - VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"

### Build Failures

**Symptoms:**
- `pnpm build` fails
- Compilation errors
- Out of memory errors

**Solutions:**

1. **Check Build Logs**
   ```bash
   cd apps/super-admin
   pnpm build 2>&1 | tee build.log
   ```

2. **Increase Memory Limit**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

3. **Clear Dependencies**
   ```bash
   rm -rf node_modules
   pnpm install
   pnpm build
   ```

4. **Check for Circular Dependencies**
   ```bash
   pnpm add -D madge
   pnpm madge --circular --extensions ts,vue .
   ```

---

## Getting Additional Help

### Collecting Debug Information

When reporting issues, include:

1. **Environment Information**
   ```bash
   node --version
   pnpm --version
   cat apps/super-admin/.env | grep -v SECRET
   ```

2. **Error Messages**
   - Full error message
   - Stack trace
   - Browser console errors

3. **Steps to Reproduce**
   - Detailed steps
   - Expected behavior
   - Actual behavior

4. **Screenshots**
   - Error screens
   - Network tab
   - Console output

### Useful Debugging Commands

```bash
# Check all running processes
ps aux | grep node

# Check port usage
lsof -i :3000
lsof -i :3001

# Check disk space
df -h

# Check memory usage
free -h

# Check logs
tail -f apps/backend/logs/app.log
tail -f /var/log/nginx/error.log

# Test database connection
psql -U postgres -d platform_dev -c "SELECT 1"

# Test API endpoint
curl -v http://localhost:3000/health
```

---

## Support Resources

- **Documentation**: Check all docs in `apps/super-admin/docs/`
- **API Documentation**: http://localhost:3000/api/docs
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Ask questions and share solutions
- **Email Support**: support@yourplatform.com

---

*Last Updated: November 2025*
