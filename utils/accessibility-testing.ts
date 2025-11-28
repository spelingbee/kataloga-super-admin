/**
 * Accessibility Testing Utilities
 * 
 * Helper functions for testing and validating accessibility features
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  element: HTMLElement
  message: string
  wcagCriterion?: string
}

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  // Check aria-label
  if (element.getAttribute('aria-label')) return true
  
  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement && labelElement.textContent) return true
  }
  
  // Check associated label
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label && label.textContent) return true
  }
  
  // Check title
  if (element.getAttribute('title')) return true
  
  // Check text content for buttons and links
  if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
    if (element.textContent?.trim()) return true
  }
  
  return false
}

/**
 * Check color contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
    const values = rgb.map(val => {
      const sRGB = val / 255
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })
    const [r = 0, g = 0, b = 0] = values
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  // Interactive elements should be focusable
  const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
  
  if (interactiveElements.includes(element.tagName)) {
    // Check if disabled
    if (element.hasAttribute('disabled')) return false
    
    // Check tabindex
    const tabindex = element.getAttribute('tabindex')
    if (tabindex === '-1') return false
    
    return true
  }
  
  // Elements with tabindex >= 0 are keyboard accessible
  const tabindex = element.getAttribute('tabindex')
  if (tabindex && parseInt(tabindex) >= 0) return true
  
  return false
}

/**
 * Check if element has proper focus indicator
 */
export function hasFocusIndicator(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element, ':focus-visible')
  
  // Check for outline
  if (styles.outline && styles.outline !== 'none' && styles.outline !== '0px') {
    return true
  }
  
  // Check for box-shadow (alternative focus indicator)
  if (styles.boxShadow && styles.boxShadow !== 'none') {
    return true
  }
  
  // Check for border change
  const normalBorder = window.getComputedStyle(element).border
  if (styles.border !== normalBorder) {
    return true
  }
  
  return false
}

/**
 * Find all accessibility issues on page
 */
export function findAccessibilityIssues(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  
  // Check images for alt text
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        element: img,
        message: 'Image missing alt attribute',
        wcagCriterion: '1.1.1'
      })
    }
  })
  
  // Check buttons for accessible names
  document.querySelectorAll('button').forEach(button => {
    if (!hasAccessibleName(button)) {
      issues.push({
        type: 'error',
        element: button,
        message: 'Button missing accessible name',
        wcagCriterion: '4.1.2'
      })
    }
  })
  
  // Check links for accessible names
  document.querySelectorAll('a').forEach(link => {
    if (!hasAccessibleName(link)) {
      issues.push({
        type: 'error',
        element: link,
        message: 'Link missing accessible name',
        wcagCriterion: '4.1.2'
      })
    }
  })
  
  // Check form inputs for labels
  document.querySelectorAll('input, textarea, select').forEach(input => {
    if (input instanceof HTMLElement && !hasAccessibleName(input)) {
      issues.push({
        type: 'error',
        element: input,
        message: 'Form input missing label',
        wcagCriterion: '3.3.2'
      })
    }
  })
  
  // Check for heading hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let previousLevel = 0
  headings.forEach(heading => {
    const tagName = heading.tagName
    const levelChar = tagName[1]
    if (!levelChar) return
    
    const level = parseInt(levelChar, 10)
    if (level - previousLevel > 1) {
      issues.push({
        type: 'warning',
        element: heading as HTMLElement,
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        wcagCriterion: '1.3.1'
      })
    }
    previousLevel = level
  })
  
  // Check for duplicate IDs
  const ids = new Map<string, HTMLElement[]>()
  document.querySelectorAll('[id]').forEach(element => {
    const id = element.getAttribute('id')
    if (id) {
      if (!ids.has(id)) {
        ids.set(id, [])
      }
      ids.get(id)!.push(element as HTMLElement)
    }
  })
  
  ids.forEach((elements, id) => {
    if (elements.length > 1 && id) {
      elements.forEach(element => {
        issues.push({
          type: 'error',
          element,
          message: `Duplicate ID: ${id}`,
          wcagCriterion: '4.1.1'
        })
      })
    }
  })
  
  return issues
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(): {
  focusableElements: HTMLElement[]
  issues: AccessibilityIssue[]
} {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelectors)
  )
  
  const issues: AccessibilityIssue[] = []
  
  focusableElements.forEach(element => {
    // Check if element is visible
    const styles = window.getComputedStyle(element)
    if (styles.display === 'none' || styles.visibility === 'hidden') {
      issues.push({
        type: 'warning',
        element,
        message: 'Focusable element is hidden',
        wcagCriterion: '2.4.3'
      })
    }
    
    // Check for focus indicator
    if (!hasFocusIndicator(element)) {
      issues.push({
        type: 'warning',
        element,
        message: 'Element may lack visible focus indicator',
        wcagCriterion: '2.4.7'
      })
    }
  })
  
  return {
    focusableElements,
    issues
  }
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(): {
  summary: {
    errors: number
    warnings: number
    info: number
  }
  issues: AccessibilityIssue[]
  keyboardNavigation: ReturnType<typeof testKeyboardNavigation>
} {
  const issues = findAccessibilityIssues()
  const keyboardNavigation = testKeyboardNavigation()
  
  const allIssues = [...issues, ...keyboardNavigation.issues]
  
  const summary = {
    errors: allIssues.filter(i => i.type === 'error').length,
    warnings: allIssues.filter(i => i.type === 'warning').length,
    info: allIssues.filter(i => i.type === 'info').length,
  }
  
  return {
    summary,
    issues: allIssues,
    keyboardNavigation
  }
}

/**
 * Log accessibility report to console
 */
export function logAccessibilityReport(): void {
  const report = generateAccessibilityReport()
  
  console.group('🔍 Accessibility Report')
  console.log('Summary:', report.summary)
  
  if (report.issues.length > 0) {
    console.group('Issues')
    report.issues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`${icon} ${issue.message}`, issue.element)
      if (issue.wcagCriterion) {
        console.log(`   WCAG: ${issue.wcagCriterion}`)
      }
    })
    console.groupEnd()
  }
  
  console.log(`Focusable elements: ${report.keyboardNavigation.focusableElements.length}`)
  console.groupEnd()
}

/**
 * Enable accessibility testing mode
 * Adds visual indicators for accessibility features
 */
export function enableAccessibilityTestingMode(): void {
  if (!import.meta.client) return
  
  const style = document.createElement('style')
  style.id = 'a11y-testing-mode'
  style.textContent = `
    /* Highlight focusable elements */
    a[href],
    button:not([disabled]),
    textarea:not([disabled]),
    input:not([disabled]),
    select:not([disabled]),
    [tabindex]:not([tabindex="-1"]) {
      outline: 2px dashed rgba(14, 165, 233, 0.5) !important;
      outline-offset: 2px !important;
    }
    
    /* Highlight ARIA landmarks */
    [role="navigation"],
    [role="main"],
    [role="banner"],
    [role="contentinfo"],
    [role="complementary"],
    [role="search"] {
      outline: 3px solid rgba(16, 185, 129, 0.5) !important;
      outline-offset: -3px !important;
    }
    
    /* Highlight headings */
    h1, h2, h3, h4, h5, h6 {
      outline: 2px solid rgba(245, 158, 11, 0.5) !important;
      outline-offset: -2px !important;
    }
    
    /* Show alt text for images */
    img[alt]::after {
      content: "ALT: " attr(alt);
      display: block;
      font-size: 10px;
      background: rgba(14, 165, 233, 0.9);
      color: white;
      padding: 2px 4px;
      position: absolute;
      bottom: 0;
      left: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `
  
  document.head.appendChild(style)
  console.log('✅ Accessibility testing mode enabled')
}

/**
 * Disable accessibility testing mode
 */
export function disableAccessibilityTestingMode(): void {
  if (!import.meta.client) return
  
  const style = document.getElementById('a11y-testing-mode')
  if (style) {
    style.remove()
    console.log('❌ Accessibility testing mode disabled')
  }
}
