// Common types for Super Admin Panel

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  statusCode?: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'support_admin' | 'analytics_viewer'
  permissions?: string[]
  twoFactorEnabled?: boolean
  createdAt: string
  lastLogin?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'pending' | 'suspended' | 'deleted'
  createdAt: string
  updatedAt: string
}

export interface TenantListItem {
  id: string
  name: string
  slug: string
  businessType: string
  status: 'active' | 'pending' | 'suspended' | 'deleted'
  subscriptionPlan: string
  subscriptionStatus: string
  createdAt: string
  lastActive: string
  revenue: number
  orderCount: number
}

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface TenantSettings {
  timezone: string
  currency: string
  language: string
  [key: string]: any
}

export interface TenantOwner {
  name: string
  email: string
  phone: string
}

export interface TenantStatistics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  menuItemsCount: number
  activeUsersCount: number
}

export interface SubscriptionDetails {
  id: string
  plan: string
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt: string | null
}

export interface TenantDetails extends TenantListItem {
  owner: TenantOwner
  address: Address
  settings: TenantSettings
  statistics: TenantStatistics
  subscription: SubscriptionDetails
}

export interface TenantFilters {
  status?: 'active' | 'pending' | 'suspended' | 'deleted' | ''
  search?: string
  businessType?: string
  subscriptionPlan?: string
}

export interface TenantState {
  tenants: TenantListItem[]
  currentTenant: TenantDetails | null
  filters: TenantFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
}

export interface Subscription {
  id: string
  tenantId: string
  tenantName: string
  plan: {
    id: string
    name: string
    price: number
    features: string[]
  }
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt: string | null
  cancelledAt: string | null
  paymentMethod?: PaymentMethod
}

export interface PaymentMethod {
  type: 'card' | 'bank_account' | 'paypal'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export interface BillingHistoryItem {
  id: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  date: string
  invoiceUrl?: string
  description?: string
}

export interface SubscriptionFilters {
  status?: 'trial' | 'active' | 'cancelled' | 'expired' | ''
  plan?: string
  billingCycle?: 'monthly' | 'yearly' | ''
  search?: string
}

export interface SubscriptionState {
  subscriptions: Subscription[]
  currentSubscription: Subscription | null
  billingHistory: BillingHistoryItem[]
  filters: SubscriptionFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
}

// Dashboard types
export interface DashboardMetrics {
  tenants: {
    total: number
    active: number
    pending: number
    suspended: number
    growth: number // percentage
  }
  revenue: {
    mrr: number
    arr: number
    growth: number
    churnRate: number
  }
  registrations: {
    today: number
    thisWeek: number
    thisMonth: number
    pending: number
  }
  system: {
    apiUptime: number
    databaseStatus: 'healthy' | 'degraded' | 'down'
    emailDeliveryRate: number
    storageUsed: number
  }
}

export interface Activity {
  id: string
  type: 'registration' | 'approval' | 'subscription' | 'payment' | 'system'
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
  metadata?: Record<string, any>
}

export interface SystemHealth {
  apiUptime: number
  databaseStatus: 'healthy' | 'degraded' | 'down'
  emailDeliveryRate: number
  storageUsed: number
}

export interface DashboardState {
  metrics: DashboardMetrics | null
  recentActivity: Activity[]
  systemHealth: SystemHealth | null
  loading: boolean
  error: string | null
  lastFetched: number | null
}

// Registration types
export interface RegistrationListItem {
  id: string
  name: string
  slug: string
  businessType: string
  status: 'pending' | 'approved' | 'rejected' | 'info_requested'
  createdAt: string
  updatedAt: string
  owner: {
    name: string
    email: string
    phone: string
  }
  registrationAge: number // days since registration
  priority?: 'high' | 'medium' | 'low'
}

export interface RegistrationDocument {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
  size: number
}

export interface RegistrationDetails extends RegistrationListItem {
  address: Address
  businessDetails: {
    description?: string
    website?: string
    taxId?: string
    registrationNumber?: string
  }
  documents: RegistrationDocument[]
  notes?: string
  rejectionReason?: string
  infoRequestMessage?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface RegistrationFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'info_requested' | ''
  search?: string
  businessType?: string
  sortBy?: 'createdAt' | 'name' | 'businessType'
  sortOrder?: 'asc' | 'desc'
}

export interface RegistrationState {
  registrations: RegistrationListItem[]
  currentRegistration: RegistrationDetails | null
  filters: RegistrationFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  selectedIds: string[]
  loading: boolean
  error: string | null
}

// Analytics types
export interface DateRange {
  from: string
  to: string
}

export interface RegistrationMetrics {
  total: number
  approved: number
  rejected: number
  pending: number
  conversionRate: number
  trends: {
    date: string
    count: number
    status: 'pending' | 'approved' | 'rejected'
  }[]
  statusBreakdown: {
    status: string
    count: number
    percentage: number
  }[]
}

export interface TenantPerformanceMetrics {
  totalTenants: number
  activeTenants: number
  churnedTenants: number
  retentionRate: number
  churnRate: number
  growthTrend: {
    date: string
    total: number
    active: number
    churned: number
  }[]
  topPerformers: {
    id: string
    name: string
    revenue: number
    orderCount: number
    growthRate: number
  }[]
}

export interface RevenueMetrics {
  mrr: number
  arr: number
  totalRevenue: number
  revenueGrowth: number
  revenueTrend: {
    date: string
    amount: number
    mrr: number
  }[]
  revenueByPlan: {
    plan: string
    revenue: number
    percentage: number
    subscriberCount: number
  }[]
  projections: {
    nextMonth: number
    nextQuarter: number
    nextYear: number
  }
}

export interface ConversionFunnelMetrics {
  stages: {
    name: string
    count: number
    percentage: number
    dropOffRate: number
  }[]
  totalStarted: number
  totalCompleted: number
  overallConversionRate: number
  insights: {
    bottleneck: string
    recommendation: string
  }[]
}

export interface CohortAnalysisMetrics {
  cohorts: {
    cohortDate: string
    cohortSize: number
    retentionByMonth: {
      month: number
      retained: number
      retentionRate: number
    }[]
  }[]
  averageRetention: {
    month: number
    rate: number
  }[]
  behaviorPatterns: {
    pattern: string
    description: string
    affectedCohorts: string[]
  }[]
}

export interface GeographicDistributionMetrics {
  regions: {
    country: string
    countryCode: string
    tenantCount: number
    revenue: number
    percentage: number
    growthRate: number
  }[]
  topRegions: {
    country: string
    tenantCount: number
    revenue: number
  }[]
  trends: {
    date: string
    country: string
    tenantCount: number
  }[]
}

export interface AnalyticsState {
  registrationMetrics: RegistrationMetrics | null
  tenantMetrics: TenantPerformanceMetrics | null
  revenueMetrics: RevenueMetrics | null
  conversionFunnelMetrics: ConversionFunnelMetrics | null
  cohortAnalysisMetrics: CohortAnalysisMetrics | null
  geographicMetrics: GeographicDistributionMetrics | null
  dateRange: DateRange
  loading: boolean
  error: string | null
  lastFetched: number | null
}

// Email types
export interface EmailListItem {
  id: string
  recipient: string
  recipientName?: string
  subject: string
  type: 'welcome' | 'approval' | 'rejection' | 'notification' | 'announcement' | 'system'
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'pending'
  sentAt: string
  deliveredAt?: string
  openedAt?: string
  clickedAt?: string
  tenantId?: string
  tenantName?: string
}

export interface EmailTrackingEvent {
  id: string
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'spam_report'
  timestamp: string
  metadata?: Record<string, any>
}

export interface EmailDetails extends EmailListItem {
  htmlContent: string
  textContent?: string
  fromEmail: string
  fromName: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: {
    name: string
    size: number
    type: string
  }[]
  trackingEvents: EmailTrackingEvent[]
  provider: string
  providerId?: string
  errorMessage?: string
}

export interface EmailDashboardMetrics {
  totalSent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  volumeTrend: {
    date: string
    sent: number
    delivered: number
    opened: number
    clicked: number
  }[]
  typeBreakdown: {
    type: string
    count: number
    percentage: number
  }[]
  statusBreakdown: {
    status: string
    count: number
    percentage: number
  }[]
}

export interface EmailFilters {
  type?: 'welcome' | 'approval' | 'rejection' | 'notification' | 'announcement' | 'system' | ''
  status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'pending' | ''
  search?: string
  fromDate?: string
  toDate?: string
  tenantId?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  type: 'welcome' | 'approval' | 'rejection' | 'notification' | 'announcement' | 'system'
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  version: number
}

export interface EmailTemplateListItem {
  id: string
  name: string
  subject: string
  type: 'welcome' | 'approval' | 'rejection' | 'notification' | 'announcement' | 'system'
  isActive: boolean
  updatedAt: string
  usageCount?: number
}

export interface EmailProvider {
  id: string
  name: string
  type: 'smtp' | 'sendgrid' | 'aws_ses' | 'mailgun' | 'postmark'
  isActive: boolean
  isPrimary: boolean
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'error'
  lastTested?: string
  createdAt: string
  updatedAt: string
}

export interface EmailState {
  emails: EmailListItem[]
  currentEmail: EmailDetails | null
  dashboardMetrics: EmailDashboardMetrics | null
  templates: EmailTemplateListItem[]
  currentTemplate: EmailTemplate | null
  providers: EmailProvider[]
  filters: EmailFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  selectedIds: string[]
  loading: boolean
  error: string | null
  lastFetched: number | null
}

// Audit types
export interface AuditLog {
  id: string
  timestamp: string
  adminUser: string
  adminUserId: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  result: 'success' | 'failure'
  errorMessage?: string
}

export interface AuditLogListItem {
  id: string
  timestamp: string
  adminUser: string
  action: string
  resource: string
  resourceId: string
  result: 'success' | 'failure'
  ipAddress: string
}

export interface AuditAnalytics {
  totalActions: number
  successRate: number
  failureRate: number
  actionBreakdown: {
    action: string
    count: number
    percentage: number
  }[]
  userActivityMetrics: {
    userId: string
    userName: string
    actionCount: number
    lastActivity: string
  }[]
  trendAnalysis: {
    date: string
    totalActions: number
    successCount: number
    failureCount: number
  }[]
  topResources: {
    resource: string
    count: number
  }[]
  recentFailures: {
    id: string
    timestamp: string
    action: string
    resource: string
    errorMessage: string
  }[]
}

export interface AuditFilters {
  action?: string
  user?: string
  resource?: string
  result?: 'success' | 'failure' | ''
  fromDate?: string
  toDate?: string
  search?: string
}

export interface AuditState {
  logs: AuditLogListItem[]
  currentLog: AuditLog | null
  analytics: AuditAnalytics | null
  filters: AuditFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
  lastFetched: number | null
}

// Security types
export interface SecurityDashboardMetrics {
  failedLoginAttempts: {
    total: number
    last24Hours: number
    last7Days: number
    trend: {
      date: string
      count: number
    }[]
  }
  blockedIPs: {
    total: number
    active: number
    expired: number
  }
  suspiciousActivity: {
    total: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  securityEvents: {
    total: number
    critical: number
    warning: number
    info: number
  }
  recentAlerts: {
    id: string
    type: string
    severity: 'critical' | 'warning' | 'info'
    message: string
    timestamp: string
  }[]
}

export interface SecurityEvent {
  id: string
  type: 'failed_login' | 'suspicious_activity' | 'ip_blocked' | 'brute_force' | 'unauthorized_access' | 'data_breach_attempt'
  severity: 'critical' | 'warning' | 'info'
  description: string
  ipAddress: string
  userAgent?: string
  userId?: string
  userName?: string
  metadata: Record<string, any>
  timestamp: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  notes?: string
}

export interface SecurityEventListItem {
  id: string
  type: 'failed_login' | 'suspicious_activity' | 'ip_blocked' | 'brute_force' | 'unauthorized_access' | 'data_breach_attempt'
  severity: 'critical' | 'warning' | 'info'
  description: string
  ipAddress: string
  timestamp: string
  resolved: boolean
}

export interface BlockedIP {
  id: string
  ipAddress: string
  reason: string
  blockedBy: string
  blockedAt: string
  expiresAt: string | null
  isPermanent: boolean
  attemptCount: number
  lastAttemptAt: string
  notes?: string
}

export interface BlockedIPListItem {
  id: string
  ipAddress: string
  reason: string
  blockedAt: string
  expiresAt: string | null
  isPermanent: boolean
  attemptCount: number
}

export interface SuspiciousActivity {
  id: string
  type: 'multiple_failed_logins' | 'unusual_location' | 'rapid_requests' | 'data_scraping' | 'sql_injection' | 'xss_attempt'
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  description: string
  ipAddress: string
  userAgent?: string
  userId?: string
  userName?: string
  detectedAt: string
  metadata: Record<string, any>
  actions: {
    action: string
    takenAt: string
    takenBy: string
  }[]
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
}

export interface SuspiciousActivityListItem {
  id: string
  type: 'multiple_failed_logins' | 'unusual_location' | 'rapid_requests' | 'data_scraping' | 'sql_injection' | 'xss_attempt'
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  description: string
  ipAddress: string
  detectedAt: string
  resolved: boolean
}

export interface SecurityFilters {
  type?: string
  severity?: 'critical' | 'warning' | 'info' | ''
  resolved?: boolean | ''
  fromDate?: string
  toDate?: string
  search?: string
  ipAddress?: string
}

export interface SecurityState {
  dashboardMetrics: SecurityDashboardMetrics | null
  events: SecurityEventListItem[]
  currentEvent: SecurityEvent | null
  blockedIPs: BlockedIPListItem[]
  currentBlockedIP: BlockedIP | null
  suspiciousActivities: SuspiciousActivityListItem[]
  currentActivity: SuspiciousActivity | null
  filters: SecurityFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
  lastFetched: number | null
}

// Settings types
export interface GeneralSettings {
  platformName: string
  platformDescription?: string
  supportEmail: string
  supportPhone?: string
  defaultTimezone: string
  defaultCurrency: string
  defaultLanguage: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  featureFlags: {
    [key: string]: boolean
  }
}

export interface EmailProviderConfig {
  id?: string
  type: 'smtp' | 'sendgrid' | 'aws_ses' | 'mailgun' | 'postmark'
  isActive: boolean
  isPrimary: boolean
  config: {
    // SMTP
    host?: string
    port?: number
    secure?: boolean
    username?: string
    password?: string
    // API-based providers
    apiKey?: string
    apiSecret?: string
    region?: string
    domain?: string
    fromEmail?: string
    fromName?: string
  }
}

export interface PaymentGatewayConfig {
  id?: string
  type: 'stripe' | 'paypal'
  isActive: boolean
  isPrimary: boolean
  config: {
    // Stripe
    publishableKey?: string
    secretKey?: string
    webhookSecret?: string
    // PayPal
    clientId?: string
    clientSecret?: string
    mode?: 'sandbox' | 'live'
  }
}

export interface StorageConfig {
  id?: string
  type: 'local' | 's3' | 'gcs' | 'azure'
  isActive: boolean
  isPrimary: boolean
  config: {
    // S3
    bucket?: string
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
    endpoint?: string
    // Local
    path?: string
    baseUrl?: string
  }
  usage?: {
    used: number
    total: number
    percentage: number
  }
}

export interface SystemSettings {
  general: GeneralSettings
  emailProviders: EmailProviderConfig[]
  paymentGateways: PaymentGatewayConfig[]
  storage: StorageConfig[]
}

export interface SettingsState {
  settings: SystemSettings | null
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  lastFetched: number | null
}

// Integration types
export interface TelegramBotConfig {
  id?: string
  botToken: string
  webhookUrl: string
  isActive: boolean
  notificationSettings: {
    newRegistrations: boolean
    approvals: boolean
    subscriptionChanges: boolean
    securityAlerts: boolean
    systemAlerts: boolean
  }
  lastTested?: string
  status?: 'connected' | 'disconnected' | 'error'
}

export interface WebhookConfig {
  id?: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  headers?: Record<string, string>
  retryPolicy: {
    maxRetries: number
    retryDelay: number
  }
  lastDelivery?: {
    timestamp: string
    status: 'success' | 'failed'
    statusCode?: number
    errorMessage?: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface WebhookLog {
  id: string
  webhookId: string
  webhookName: string
  event: string
  url: string
  status: 'success' | 'failed' | 'pending'
  statusCode?: number
  requestPayload: Record<string, any>
  responseBody?: string
  errorMessage?: string
  attempt: number
  timestamp: string
  duration?: number
}

export interface Integration {
  id: string
  name: string
  type: 'telegram' | 'webhook' | 'slack' | 'discord'
  description: string
  icon: string
  isActive: boolean
  isConfigured: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  config?: TelegramBotConfig | WebhookConfig | Record<string, any>
}

export interface IntegrationState {
  integrations: Integration[]
  telegramConfig: TelegramBotConfig | null
  webhooks: WebhookConfig[]
  webhookLogs: WebhookLog[]
  currentWebhook: WebhookConfig | null
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  lastFetched: number | null
}

// Announcement types
export interface AnnouncementListItem {
  id: string
  title: string
  type: 'info' | 'warning' | 'success' | 'critical'
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  targetType: 'all' | 'specific' | 'plan' | 'status'
  targetCount: number
  scheduledFor?: string
  sentAt?: string
  createdBy: string
  createdAt: string
  deliveryStats?: {
    sent: number
    delivered: number
    opened: number
    failed: number
  }
}

export interface AnnouncementTarget {
  type: 'all' | 'specific' | 'plan' | 'status'
  tenantIds?: string[]
  plans?: string[]
  statuses?: ('active' | 'trial' | 'suspended')[]
}

export interface Announcement extends AnnouncementListItem {
  content: string
  htmlContent?: string
  target: AnnouncementTarget
  channels: ('email' | 'in_app' | 'telegram')[]
  priority: 'low' | 'medium' | 'high'
  expiresAt?: string
  metadata?: Record<string, any>
  updatedAt: string
  updatedBy?: string
}

export interface AnnouncementDelivery {
  id: string
  announcementId: string
  tenantId: string
  tenantName: string
  channel: 'email' | 'in_app' | 'telegram'
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed'
  sentAt?: string
  deliveredAt?: string
  openedAt?: string
  errorMessage?: string
}

export interface AnnouncementFilters {
  status?: 'draft' | 'scheduled' | 'sent' | 'failed' | ''
  type?: 'info' | 'warning' | 'success' | 'critical' | ''
  targetType?: 'all' | 'specific' | 'plan' | 'status' | ''
  search?: string
  fromDate?: string
  toDate?: string
}

export interface AnnouncementState {
  announcements: AnnouncementListItem[]
  currentAnnouncement: Announcement | null
  deliveries: AnnouncementDelivery[]
  filters: AnnouncementFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  saving: boolean
  error: string | null
  lastFetched: number | null
}

// Menu types
export interface MenuListItem {
  id: string
  name: string
  description?: string
  isActive: boolean
  itemCount: number
  activeItemCount: number
  createdAt: string
  updatedAt: string
}

export interface MenuCategory {
  id: string
  name: string
}

export interface CategoryWithItemCount {
  id: string
  name: string
  itemCount: number
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isActive: boolean
  category: MenuCategory
  createdAt: string
  updatedAt: string
}

export interface MenuDetails extends MenuListItem {
  tenantId: string
  items: MenuItem[]
}

export interface MenuItemFilters {
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  isActive?: boolean
}

export interface MenuState {
  menus: MenuListItem[]
  currentMenu: MenuDetails | null
  menuItems: MenuItem[]
  categories: CategoryWithItemCount[]
  itemFilters: MenuItemFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
}

// Support Ticket types
export interface TicketListItem {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tenantId: string
  tenantName: string
  createdBy: string
  createdByEmail: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  lastReplyAt?: string
  ticketAge: number // hours since creation
  responseCount: number
  hasUnreadMessages: boolean
}

export interface TicketMessage {
  id: string
  ticketId: string
  content: string
  isInternal: boolean
  createdBy: string
  createdByName: string
  createdByRole: 'admin' | 'tenant'
  createdAt: string
  attachments?: TicketAttachment[]
  isRead: boolean
}

export interface TicketAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
  uploadedBy: string
}

export interface Ticket extends TicketListItem {
  description: string
  messages: TicketMessage[]
  tenant: {
    id: string
    name: string
    email: string
    phone?: string
    subscriptionPlan: string
    subscriptionStatus: string
  }
  tags?: string[]
  metadata?: Record<string, any>
  closedAt?: string
  closedBy?: string
  resolutionTime?: number // hours to resolve
}

export interface TicketFilters {
  status?: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed' | ''
  priority?: 'low' | 'medium' | 'high' | 'urgent' | ''
  assignedTo?: string
  tenantId?: string
  search?: string
  fromDate?: string
  toDate?: string
  hasUnread?: boolean
}

export interface TicketState {
  tickets: TicketListItem[]
  currentTicket: Ticket | null
  filters: TicketFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  saving: boolean
  error: string | null
  lastFetched: number | null
}

// Subscription History types
export interface SubscriptionHistoryItem {
  id: string
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'extend' | 'discount' | 'expire'
  fromPlan: string
  toPlan: string
  reason?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface SubscriptionHistory {
  subscriptionId: string
  tenantId: string
  tenantName: string
  history: SubscriptionHistoryItem[]
  total: number
}

// Menu History types
export interface MenuHistoryItem {
  id: string
  action: string
  resource: string
  resourceId: string | null
  userId: string
  details: {
    tenantId: string
    menuId?: string
    menuItemId?: string
    categoryId?: string
    action: string
    entityType: string
    changes?: Record<string, any>
    metadata?: Record<string, any>
  }
  createdAt: string
}

export interface MenuHistory {
  tenantId: string
  history: MenuHistoryItem[]
  total: number
}

// Audit Export types
export interface AuditExportFilters {
  type: 'subscription' | 'menu'
  format?: 'json' | 'csv'
  tenantId?: string
  subscriptionId?: string
  changeType?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface AuditExportResponse {
  data: any[]
  total: number
  page: number
  limit: number
  totalPages: number
  exportedAt: string
}
