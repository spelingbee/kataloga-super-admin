import { ref, computed } from 'vue'

export interface OnboardingStep {
  id: string
  title: string
  content: string
  target: string // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

export interface OnboardingTour {
  id: string
  name: string
  steps: OnboardingStep[]
}

const tours: Record<string, OnboardingTour> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Super Admin Panel',
        content: 'This is your central hub for managing the entire platform. Let\'s take a quick tour!',
        target: '.dashboard-overview',
        position: 'bottom'
      },
      {
        id: 'metrics',
        title: 'Key Metrics',
        content: 'Monitor your platform\'s health with real-time metrics including tenant count, revenue, and growth.',
        target: '.metric-card',
        position: 'bottom'
      },
      {
        id: 'activity',
        title: 'Recent Activity',
        content: 'Stay updated with the latest tenant registrations and important events.',
        target: '.recent-activity',
        position: 'left'
      },
      {
        id: 'navigation',
        title: 'Navigation',
        content: 'Use the sidebar to access different sections like tenants, subscriptions, analytics, and more.',
        target: '.app-sidebar',
        position: 'right'
      }
    ]
  },
  tenants: {
    id: 'tenants',
    name: 'Tenant Management Tour',
    steps: [
      {
        id: 'tenant-list',
        title: 'Tenant List',
        content: 'View and manage all tenants on your platform. Use filters and search to find specific tenants.',
        target: '.data-table',
        position: 'top'
      },
      {
        id: 'tenant-actions',
        title: 'Tenant Actions',
        content: 'Click on any tenant to view details, manage settings, or perform actions like activate/suspend.',
        target: '.data-table__row',
        position: 'top'
      }
    ]
  },
  registrations: {
    id: 'registrations',
    name: 'Registration Approval Tour',
    steps: [
      {
        id: 'pending-list',
        title: 'Pending Registrations',
        content: 'Review new tenant registration requests. Each request requires your approval before activation.',
        target: '.data-table',
        position: 'top'
      },
      {
        id: 'review-process',
        title: 'Review Process',
        content: 'Click on a registration to review details, then approve, reject, or request more information.',
        target: '.data-table__row',
        position: 'top'
      }
    ]
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Tour',
    steps: [
      {
        id: 'date-range',
        title: 'Date Range Selector',
        content: 'Select custom date ranges to analyze your platform\'s performance over time.',
        target: '.date-range-selector',
        position: 'bottom'
      },
      {
        id: 'charts',
        title: 'Analytics Charts',
        content: 'Visualize key metrics with interactive charts. Hover over data points for detailed information.',
        target: '.chart-container',
        position: 'top'
      },
      {
        id: 'export',
        title: 'Export Reports',
        content: 'Export analytics data in various formats (CSV, PDF) for further analysis or reporting.',
        target: '.export-menu',
        position: 'left'
      }
    ]
  }
}

const currentTour = ref<OnboardingTour | null>(null)
const currentStepIndex = ref(0)
const isActive = ref(false)
const completedTours = ref<string[]>([])

// Load completed tours from localStorage
if (import.meta.client) {
  const stored = localStorage.getItem('onboarding_completed')
  if (stored) {
    try {
      completedTours.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse completed tours:', e)
    }
  }
}

export const useOnboarding = () => {
  const currentStep = computed(() => {
    if (!currentTour.value) return null
    return currentTour.value.steps[currentStepIndex.value] || null
  })

  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => {
    if (!currentTour.value) return false
    return currentStepIndex.value === currentTour.value.steps.length - 1
  })

  const progress = computed(() => {
    if (!currentTour.value) return 0
    return ((currentStepIndex.value + 1) / currentTour.value.steps.length) * 100
  })

  const startTour = (tourId: string) => {
    const tour = tours[tourId]
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`)
      return
    }

    currentTour.value = tour
    currentStepIndex.value = 0
    isActive.value = true
  }

  const nextStep = () => {
    if (!currentTour.value) return

    if (currentStep.value?.action) {
      currentStep.value.action()
    }

    if (isLastStep.value) {
      completeTour()
    } else {
      currentStepIndex.value++
    }
  }

  const previousStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  const skipTour = () => {
    isActive.value = false
    currentTour.value = null
    currentStepIndex.value = 0
  }

  const completeTour = () => {
    if (!currentTour.value) return

    const tourId = currentTour.value.id
    if (!completedTours.value.includes(tourId)) {
      completedTours.value.push(tourId)
      if (import.meta.client) {
        localStorage.setItem('onboarding_completed', JSON.stringify(completedTours.value))
      }
    }

    isActive.value = false
    currentTour.value = null
    currentStepIndex.value = 0
  }

  const isTourCompleted = (tourId: string) => {
    return completedTours.value.includes(tourId)
  }

  const resetTour = (tourId: string) => {
    completedTours.value = completedTours.value.filter(id => id !== tourId)
    if (import.meta.client) {
      localStorage.setItem('onboarding_completed', JSON.stringify(completedTours.value))
    }
  }

  const resetAllTours = () => {
    completedTours.value = []
    if (import.meta.client) {
      localStorage.removeItem('onboarding_completed')
    }
  }

  const availableTours = computed(() => {
    return Object.values(tours).map(tour => ({
      id: tour.id,
      name: tour.name,
      completed: isTourCompleted(tour.id)
    }))
  })

  return {
    // State
    currentTour,
    currentStep,
    currentStepIndex,
    isActive,
    completedTours,
    availableTours,

    // Computed
    isFirstStep,
    isLastStep,
    progress,

    // Methods
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    isTourCompleted,
    resetTour,
    resetAllTours
  }
}
