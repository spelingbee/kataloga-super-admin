export default defineNuxtPlugin(() => {
  const accessibility = useAccessibility()

  // Add skip link
  accessibility.addSkipLink('main-content', 'Skip to main content')

  // Manage focus on route changes
  accessibility.manageFocusOnRouteChange()

  // Add global styles for accessibility
  if (import.meta.client) {
    const style = document.createElement('style')
    style.textContent = `
      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      /* Skip link */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #0ea5e9;
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 10000;
        font-weight: 500;
      }

      .skip-link:focus {
        top: 0;
      }

      /* Focus visible styles */
      *:focus-visible {
        outline: 2px solid #0ea5e9;
        outline-offset: 2px;
      }

      /* Remove outline for mouse users */
      *:focus:not(:focus-visible) {
        outline: none;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        * {
          border-color: currentColor !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Focus indicators for interactive elements */
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid #0ea5e9;
        outline-offset: 2px;
        border-radius: 4px;
      }

      /* Ensure sufficient color contrast */
      ::selection {
        background-color: #0ea5e9;
        color: white;
      }
    `
    document.head.appendChild(style)
  }

  // Provide accessibility utilities globally
  return {
    provide: {
      accessibility,
    },
  }
})
