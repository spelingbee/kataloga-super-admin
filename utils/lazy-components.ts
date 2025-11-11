/**
 * Lazy component loading utilities
 * Provides dynamic imports for code splitting
 */

import { defineAsyncComponent, type Component } from 'vue'

/**
 * Create a lazy-loaded component with loading and error states
 */
export const lazyComponent = (
  loader: () => Promise<Component>,
  options: {
    loadingComponent?: Component
    errorComponent?: Component
    delay?: number
    timeout?: number
  } = {}
) => {
  return defineAsyncComponent({
    loader,
    loadingComponent: options.loadingComponent,
    errorComponent: options.errorComponent,
    delay: options.delay || 200,
    timeout: options.timeout || 30000,
  })
}

/**
 * Lazy load chart components (heavy dependencies)
 */
export const LazyChartComponents = {
  ApexChart: () => import('vue3-apexcharts').catch(() => null),
  ConversionFunnel: () => import('~/components/analytics/ConversionFunnelAnalytics.vue').catch(() => null),
  CohortAnalysis: () => import('~/components/analytics/CohortAnalysis.vue').catch(() => null),
  GeographicDistribution: () => import('~/components/analytics/GeographicDistribution.vue').catch(() => null),
  RevenueAnalytics: () => import('~/components/analytics/RevenueAnalytics.vue').catch(() => null),
  TenantPerformance: () => import('~/components/analytics/TenantPerformanceAnalytics.vue').catch(() => null),
  RegistrationAnalytics: () => import('~/components/analytics/RegistrationAnalytics.vue').catch(() => null),
}

/**
 * Lazy load modal components
 */
export const LazyModalComponents = {
  // Tenant modals
  ImpersonationModal: () => import('~/components/tenant/ImpersonationModal.vue').catch(() => null),
  TenantSettingsForm: () => import('~/components/tenant/TenantSettingsForm.vue').catch(() => null),
  
  // Registration modals
  DocumentViewer: () => import('~/components/registration/DocumentViewer.vue').catch(() => null),
  RejectionModal: () => import('~/components/registration/RejectionModal.vue').catch(() => null),
  RequestInfoModal: () => import('~/components/registration/RequestInfoModal.vue').catch(() => null),
  
  // Subscription modals
  ChangePlanModal: () => import('~/components/subscription/ChangePlanModal.vue').catch(() => null),
  ExtendTrialModal: () => import('~/components/subscription/ExtendTrialModal.vue').catch(() => null),
  ApplyDiscountModal: () => import('~/components/subscription/ApplyDiscountModal.vue').catch(() => null),
  CancelSubscriptionModal: () => import('~/components/subscription/CancelSubscriptionModal.vue').catch(() => null),
  
  // Email modals
  TemplateEditorModal: () => import('~/components/email/TemplateEditorModal.vue').catch(() => null),
  TemplatePreviewModal: () => import('~/components/email/TemplatePreviewModal.vue').catch(() => null),
  ProviderConfigModal: () => import('~/components/email/ProviderConfigModal.vue').catch(() => null),
  
  // Audit modals
  AuditLogDetailModal: () => import('~/components/audit/AuditLogDetailModal.vue').catch(() => null),
  ExportAuditLogsModal: () => import('~/components/audit/ExportAuditLogsModal.vue').catch(() => null),
  
  // Security modals
  EventDetailModal: () => import('~/components/security/EventDetailModal.vue').catch(() => null),
  BlockIPModal: () => import('~/components/security/BlockIPModal.vue').catch(() => null),
  SuspiciousActivityDetailModal: () => import('~/components/security/SuspiciousActivityDetailModal.vue').catch(() => null),
  
  // Integration modals
  TelegramConfigModal: () => import('~/components/integrations/TelegramConfigModal.vue').catch(() => null),
  WebhookConfigModal: () => import('~/components/integrations/WebhookConfigModal.vue').catch(() => null),
  WebhookLogsModal: () => import('~/components/integrations/WebhookLogsModal.vue').catch(() => null),
  
  // Settings modals
  EmailProviderModal: () => import('~/components/settings/EmailProviderModal.vue').catch(() => null),
  PaymentGatewayModal: () => import('~/components/settings/PaymentGatewayModal.vue').catch(() => null),
  StorageConfigModal: () => import('~/components/settings/StorageConfigModal.vue').catch(() => null),
}

/**
 * Lazy load export utilities (heavy dependencies)
 */
export const LazyExportUtils = {
  pdfExport: () => import('~/utils/pdf-export').catch(() => null),
  exportUtils: () => import('~/utils/export').catch(() => null),
}

/**
 * Preload component for better UX
 */
export const preloadLazyComponent = (loader: () => Promise<Component>) => {
  // Trigger the import but don't wait for it
  loader().catch(() => {
    // Silently fail, component will be loaded when needed
  })
}

/**
 * Preload multiple components
 */
export const preloadLazyComponents = (loaders: Array<() => Promise<Component>>) => {
  loaders.forEach(loader => preloadLazyComponent(loader))
}

/**
 * Route-based component preloading
 */
export const preloadRouteModules = (routeName: string) => {
  const preloadMap: Record<string, Array<() => Promise<Component>>> = {
    analytics: [
      LazyChartComponents.RevenueAnalytics,
      LazyChartComponents.TenantPerformance,
      LazyChartComponents.RegistrationAnalytics,
    ],
    tenants: [
      LazyModalComponents.ImpersonationModal,
      LazyModalComponents.TenantSettingsForm,
    ],
    subscriptions: [
      LazyModalComponents.ChangePlanModal,
      LazyModalComponents.ExtendTrialModal,
    ],
    emails: [
      LazyModalComponents.TemplateEditorModal,
      LazyModalComponents.ProviderConfigModal,
    ],
  }

  const components = preloadMap[routeName]
  if (components) {
    preloadLazyComponents(components)
  }
}
