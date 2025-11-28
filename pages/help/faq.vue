<template>
  <div class="faq-page">
    <div class="faq-page__header">
      <h1 class="faq-page__title">Frequently Asked Questions</h1>
      <p class="faq-page__subtitle">
        Find answers to common questions about the Super Admin Panel
      </p>
    </div>

    <!-- Search -->
    <div class="faq-page__search">
      <FormInput
        v-model="searchQuery"
        placeholder="Search FAQs..."
        icon="search"
      />
    </div>

    <!-- Categories -->
    <div class="faq-page__categories">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="['faq-category-button', { 'faq-category-button--active': selectedCategory === category.id }]"
        @click="selectedCategory = category.id"
      >
        <AppIcon :name="category.icon" :size="20" />
        {{ category.name }}
      </button>
    </div>

    <!-- FAQ Items -->
    <div class="faq-page__content">
      <div v-if="filteredFaqs.length === 0" class="faq-page__empty">
        <AppIcon name="search" :size="48" />
        <p>No FAQs found matching your search.</p>
      </div>

      <div v-else class="faq-list">
        <div
          v-for="faq in filteredFaqs"
          :key="faq.id"
          class="faq-item"
        >
          <button
            :class="['faq-item__question', { 'faq-item__question--open': openFaqId === faq.id }]"
            :aria-expanded="openFaqId === faq.id"
            @click="toggleFaq(faq.id)"
          >
            <span>{{ faq.question }}</span>
            <AppIcon
              name="chevron-down"
              :size="20"
              :class="['faq-item__icon', { 'faq-item__icon--open': openFaqId === faq.id }]"
            />
          </button>

          <Transition name="faq-answer">
            <div v-if="openFaqId === faq.id" class="faq-item__answer">
              <div v-html="faq.answer"/>
              <div v-if="faq.relatedLinks" class="faq-item__links">
                <h4>Related Resources:</h4>
                <ul>
                  <li v-for="link in faq.relatedLinks" :key="link.url">
                    <NuxtLink :to="link.url">{{ link.text }}</NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Contact Support -->
    <div class="faq-page__footer">
      <div class="faq-support-card">
        <AppIcon name="message-circle" :size="32" />
        <h3>Still need help?</h3>
        <p>Can't find what you're looking for? Contact our support team.</p>
        <NuxtLink to="/support" class="faq-support-card__button">
          Contact Support
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  relatedLinks?: Array<{ text: string; url: string }>
}

interface Category {
  id: string
  name: string
  icon: string
}

definePageMeta({
  layout: 'default',
  title: 'FAQ - Help Center'
})

const searchQuery = ref('')
const selectedCategory = ref('all')
const openFaqId = ref<string | null>(null)

const categories: Category[] = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'getting-started', name: 'Getting Started', icon: 'play-circle' },
  { id: 'tenants', name: 'Tenants', icon: 'users' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'credit-card' },
  { id: 'analytics', name: 'Analytics', icon: 'bar-chart' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: 'alert-circle' }
]

const faqs: FAQ[] = [
  {
    id: 'what-is-super-admin',
    category: 'getting-started',
    question: 'What is the Super Admin Panel?',
    answer: '<p>The Super Admin Panel is a centralized dashboard for managing your entire platform. It allows you to oversee all tenants, manage subscriptions, review registrations, monitor analytics, and configure system settings.</p>',
    relatedLinks: [
      { text: 'User Guide', url: '/docs/user-guide' },
      { text: 'Getting Started', url: '/docs/getting-started' }
    ]
  },
  {
    id: 'approve-registration',
    category: 'tenants',
    question: 'How do I approve a tenant registration?',
    answer: '<p>To approve a tenant registration:</p><ol><li>Navigate to <strong>Registrations</strong> in the sidebar</li><li>Click on a pending registration to view details</li><li>Review the business information and documents</li><li>Click <strong>Approve</strong> to activate the tenant</li></ol><p>The tenant will receive a welcome email with login credentials.</p>',
    relatedLinks: [
      { text: 'Registration Management Guide', url: '/docs/registrations' }
    ]
  },
  {
    id: 'reject-registration',
    category: 'tenants',
    question: 'What happens when I reject a registration?',
    answer: '<p>When you reject a registration:</p><ul><li>The applicant receives an email with your rejection reason</li><li>The registration is marked as rejected in the system</li><li>The applicant can submit a new registration if they address the issues</li></ul><p>Always provide a clear reason for rejection to help applicants understand what needs to be corrected.</p>'
  },
  {
    id: 'manage-subscription',
    category: 'subscriptions',
    question: 'How do I change a tenant\'s subscription plan?',
    answer: '<p>To change a subscription plan:</p><ol><li>Go to <strong>Subscriptions</strong></li><li>Find and click on the tenant\'s subscription</li><li>Click <strong>Change Plan</strong></li><li>Select the new plan and confirm</li></ol><p>The system will calculate prorated amounts automatically. Changes take effect immediately.</p>',
    relatedLinks: [
      { text: 'Subscription Management', url: '/docs/subscriptions' }
    ]
  },
  {
    id: 'extend-trial',
    category: 'subscriptions',
    question: 'Can I extend a tenant\'s trial period?',
    answer: '<p>Yes! To extend a trial:</p><ol><li>Navigate to the tenant\'s subscription details</li><li>Click <strong>Extend Trial</strong></li><li>Set the new trial end date</li><li>Add a reason for the extension (for audit purposes)</li><li>Confirm the change</li></ol><p>The tenant will be notified of the trial extension.</p>'
  },
  {
    id: 'apply-discount',
    category: 'subscriptions',
    question: 'How do I apply a discount to a subscription?',
    answer: '<p>To apply a discount:</p><ol><li>Open the subscription details</li><li>Click <strong>Apply Discount</strong></li><li>Choose percentage or fixed amount</li><li>Set the discount duration (in months)</li><li>Confirm to apply</li></ol><p>Discounts are applied to future billing cycles and are tracked in the billing history.</p>'
  },
  {
    id: 'view-analytics',
    category: 'analytics',
    question: 'What analytics are available?',
    answer: '<p>The Analytics section provides:</p><ul><li><strong>Dashboard Metrics:</strong> Tenant growth, revenue trends, MRR/ARR</li><li><strong>Registration Analytics:</strong> Conversion rates, approval times</li><li><strong>Revenue Analytics:</strong> Revenue by plan, growth projections</li><li><strong>Tenant Performance:</strong> Retention, churn analysis</li><li><strong>Geographic Distribution:</strong> Regional breakdown</li></ul><p>All analytics can be filtered by date range and exported in various formats.</p>',
    relatedLinks: [
      { text: 'Analytics Guide', url: '/docs/analytics' }
    ]
  },
  {
    id: 'export-reports',
    category: 'analytics',
    question: 'How do I export analytics reports?',
    answer: '<p>To export reports:</p><ol><li>Navigate to the Analytics page</li><li>Select your desired date range</li><li>Click the <strong>Export</strong> button</li><li>Choose format: CSV, PDF, or Excel</li><li>The report will download automatically</li></ol><p>You can also schedule automated reports to be emailed regularly.</p>'
  },
  {
    id: 'audit-logs',
    category: 'security',
    question: 'What are audit logs and how do I access them?',
    answer: '<p>Audit logs record all administrative actions in the system. To access them:</p><ol><li>Go to <strong>Security → Audit Logs</strong></li><li>Use filters to find specific actions, users, or date ranges</li><li>Click on any log entry for detailed information</li></ol><p>Audit logs include: user actions, resource changes, timestamps, IP addresses, and results.</p>',
    relatedLinks: [
      { text: 'Security & Audit Guide', url: '/docs/security' }
    ]
  },
  {
    id: 'block-ip',
    category: 'security',
    question: 'How do I block suspicious IP addresses?',
    answer: '<p>To block an IP address:</p><ol><li>Navigate to <strong>Security → Blocked IPs</strong></li><li>Click <strong>Block IP</strong></li><li>Enter the IP address and reason</li><li>Set an expiration date (optional)</li><li>Confirm to block</li></ol><p>Blocked IPs cannot access the platform. You can unblock them at any time.</p>'
  },
  {
    id: 'impersonate-tenant',
    category: 'tenants',
    question: 'How does tenant impersonation work?',
    answer: '<p>Tenant impersonation allows you to view the platform as a specific tenant for troubleshooting:</p><ol><li>Go to the tenant\'s details page</li><li>Click <strong>Impersonate</strong></li><li>Confirm the action</li><li>A new tab opens with the tenant\'s dashboard</li></ol><p><strong>Important:</strong> All actions during impersonation are logged in the audit trail.</p>'
  },
  {
    id: 'email-templates',
    category: 'getting-started',
    question: 'Can I customize email templates?',
    answer: '<p>Yes! To customize email templates:</p><ol><li>Go to <strong>Emails → Templates</strong></li><li>Select the template you want to edit</li><li>Use the editor to modify content</li><li>Preview your changes</li><li>Save and activate</li></ol><p>Templates support variables like {{tenant_name}}, {{user_name}}, etc.</p>',
    relatedLinks: [
      { text: 'Email Management', url: '/docs/emails' }
    ]
  },
  {
    id: 'system-settings',
    category: 'getting-started',
    question: 'Where do I configure system settings?',
    answer: '<p>System settings are located in the <strong>Settings</strong> page. You can configure:</p><ul><li>Email providers (SMTP, SendGrid, AWS SES)</li><li>Payment gateways (Stripe, PayPal)</li><li>Storage (AWS S3, Local)</li><li>Integrations (Telegram, Webhooks)</li><li>Feature flags and defaults</li></ul><p>Changes require confirmation and are logged for security.</p>',
    relatedLinks: [
      { text: 'System Configuration', url: '/docs/configuration' }
    ]
  },
  {
    id: 'dashboard-slow',
    category: 'troubleshooting',
    question: 'Why is the dashboard loading slowly?',
    answer: '<p>If the dashboard is slow:</p><ul><li>Check your internet connection</li><li>Clear browser cache and cookies</li><li>Try a different browser</li><li>Check the system health indicators</li></ul><p>If the issue persists, it may be a server-side problem. Check the <strong>System Health</strong> section on the dashboard.</p>',
    relatedLinks: [
      { text: 'Troubleshooting Guide', url: '/docs/troubleshooting' }
    ]
  },
  {
    id: 'forgot-password',
    category: 'troubleshooting',
    question: 'What if I forget my admin password?',
    answer: '<p>If you forget your password:</p><ol><li>Click <strong>Forgot Password</strong> on the login page</li><li>Enter your admin email</li><li>Check your email for a reset link</li><li>Follow the link to set a new password</li></ol><p>If you don\'t receive the email, check your spam folder or contact technical support.</p>'
  },
  {
    id: 'keyboard-shortcuts',
    category: 'getting-started',
    question: 'Are there keyboard shortcuts available?',
    answer: '<p>Yes! Press <kbd>?</kbd> or <kbd>Ctrl/Cmd + K</kbd> to open the keyboard shortcuts menu. Common shortcuts include:</p><ul><li><kbd>Ctrl/Cmd + K</kbd> - Global search</li><li><kbd>G then D</kbd> - Go to Dashboard</li><li><kbd>G then T</kbd> - Go to Tenants</li><li><kbd>G then S</kbd> - Go to Subscriptions</li><li><kbd>G then A</kbd> - Go to Analytics</li></ul>',
    relatedLinks: [
      { text: 'Keyboard Shortcuts Guide', url: '/docs/shortcuts' }
    ]
  }
]

const filteredFaqs = computed(() => {
  let filtered = faqs

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(faq => faq.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }

  return filtered
})

const toggleFaq = (id: string) => {
  openFaqId.value = openFaqId.value === id ? null : id
}
</script>

<style scoped lang="scss">
@use './faq';
</style>
