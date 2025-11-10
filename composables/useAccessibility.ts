interface FocusTrapOptions {
  initialFocus?: HTMLElement | string
  returnFocus?: boolean
}

export const useAccessibility = () => {
  /**
   * Create a focus trap for modals and dialogs
   */
  const createFocusTrap = (
    element: HTMLElement,
    options: FocusTrapOptions = {}
  ) => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    let previouslyFocusedElement: HTMLElement | null = null

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(element.querySelectorAll(focusableSelectors))
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    const activate = () => {
      previouslyFocusedElement = document.activeElement as HTMLElement

      // Set initial focus
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        if (options.initialFocus) {
          const initialElement = typeof options.initialFocus === 'string'
            ? element.querySelector<HTMLElement>(options.initialFocus)
            : options.initialFocus
          initialElement?.focus()
        } else {
          focusableElements[0]?.focus()
        }
      }

      element.addEventListener('keydown', handleKeyDown)
    }

    const deactivate = () => {
      element.removeEventListener('keydown', handleKeyDown)

      // Return focus to previously focused element
      if (options.returnFocus !== false && previouslyFocusedElement) {
        previouslyFocusedElement.focus()
      }
    }

    return {
      activate,
      deactivate,
    }
  }

  /**
   * Announce message to screen readers
   */
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!process.client) return

    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Check if element is visible to screen readers
   */
  const isVisibleToScreenReader = (element: HTMLElement): boolean => {
    if (!element) return false

    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.getAttribute('aria-hidden') !== 'true'
    )
  }

  /**
   * Get accessible label for element
   */
  const getAccessibleLabel = (element: HTMLElement): string | null => {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy)
      if (labelElement) return labelElement.textContent
    }

    // Check associated label
    if (element instanceof HTMLInputElement) {
      const label = document.querySelector(`label[for="${element.id}"]`)
      if (label) return label.textContent
    }

    // Check title
    const title = element.getAttribute('title')
    if (title) return title

    return null
  }

  /**
   * Add skip link for keyboard navigation
   */
  const addSkipLink = (targetId: string, label: string = 'Skip to main content') => {
    if (!process.client) return

    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.className = 'skip-link'
    skipLink.textContent = label
    skipLink.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView()
      }
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  /**
   * Manage focus for route changes
   */
  const manageFocusOnRouteChange = () => {
    const router = useRouter()

    router.afterEach(() => {
      // Focus main content after route change
      nextTick(() => {
        const main = document.querySelector('main')
        if (main) {
          main.setAttribute('tabindex', '-1')
          main.focus()
          announce('Page loaded')
        }
      })
    })
  }

  /**
   * Add ARIA attributes to element
   */
  const addAriaAttributes = (
    element: HTMLElement,
    attributes: Record<string, string>
  ) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
  }

  /**
   * Create accessible button
   */
  const createAccessibleButton = (
    label: string,
    onClick: () => void,
    options: {
      icon?: string
      disabled?: boolean
      ariaLabel?: string
    } = {}
  ): HTMLButtonElement => {
    const button = document.createElement('button')
    button.textContent = label
    button.onclick = onClick
    button.setAttribute('type', 'button')

    if (options.disabled) {
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
    }

    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel)
    }

    return button
  }

  /**
   * Set page title for screen readers
   */
  const setPageTitle = (title: string) => {
    if (!process.client) return
    
    document.title = `${title} - Super Admin`
    announce(`Navigated to ${title}`, 'polite')
  }

  /**
   * Announce error to screen readers
   */
  const announceError = (message: string) => {
    announce(`Error: ${message}`, 'assertive')
  }

  /**
   * Announce success to screen readers
   */
  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'polite')
  }

  /**
   * Check if reduced motion is preferred
   */
  const prefersReducedMotion = (): boolean => {
    if (!process.client) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Check if high contrast is preferred
   */
  const prefersHighContrast = (): boolean => {
    if (!process.client) return false
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  return {
    createFocusTrap,
    announce,
    isVisibleToScreenReader,
    getAccessibleLabel,
    addSkipLink,
    manageFocusOnRouteChange,
    addAriaAttributes,
    createAccessibleButton,
    setPageTitle,
    announceError,
    announceSuccess,
    prefersReducedMotion,
    prefersHighContrast,
  }
}
