export default defineNuxtPlugin(() => {
  const router = useRouter()
  const keyboardShortcuts = useKeyboardShortcuts()

  // Navigation shortcuts
  keyboardShortcuts.register({
    key: 'h',
    meta: true,
    description: 'Go to Dashboard',
    action: () => router.push('/'),
    category: 'Navigation',
  })

  keyboardShortcuts.register({
    key: 't',
    meta: true,
    description: 'Go to Tenants',
    action: () => router.push('/tenants'),
    category: 'Navigation',
  })

  keyboardShortcuts.register({
    key: 's',
    meta: true,
    description: 'Go to Subscriptions',
    action: () => router.push('/subscriptions'),
    category: 'Navigation',
  })

  keyboardShortcuts.register({
    key: 'a',
    meta: true,
    description: 'Go to Analytics',
    action: () => router.push('/analytics'),
    category: 'Navigation',
  })

  keyboardShortcuts.register({
    key: 'r',
    meta: true,
    description: 'Go to Registrations',
    action: () => router.push('/registrations'),
    category: 'Navigation',
  })

  keyboardShortcuts.register({
    key: 'e',
    meta: true,
    description: 'Go to Emails',
    action: () => router.push('/emails'),
    category: 'Navigation',
  })

  // Action shortcuts
  keyboardShortcuts.register({
    key: 'k',
    meta: true,
    description: 'Open Search',
    action: () => {
      // Trigger global search
      const event = new CustomEvent('open-global-search')
      window.dispatchEvent(event)
    },
    category: 'Actions',
  })

  keyboardShortcuts.register({
    key: 'n',
    meta: true,
    description: 'New Item (context-dependent)',
    action: () => {
      // Trigger new item action based on current route
      const event = new CustomEvent('new-item')
      window.dispatchEvent(event)
    },
    category: 'Actions',
  })

  keyboardShortcuts.register({
    key: 'f',
    meta: true,
    description: 'Focus Search/Filter',
    action: () => {
      // Focus the first search input on the page
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
      )
      if (searchInput) {
        searchInput.focus()
      }
    },
    category: 'Actions',
  })

  keyboardShortcuts.register({
    key: 'Escape',
    description: 'Close Modal/Dialog',
    action: () => {
      // Trigger close modal event
      const event = new CustomEvent('close-modal')
      window.dispatchEvent(event)
    },
    category: 'Actions',
  })

  // Utility shortcuts
  keyboardShortcuts.register({
    key: 'r',
    meta: true,
    shift: true,
    description: 'Refresh Page',
    action: () => {
      window.location.reload()
    },
    category: 'Utility',
  })

  keyboardShortcuts.register({
    key: ',',
    meta: true,
    description: 'Go to Settings',
    action: () => router.push('/settings'),
    category: 'Utility',
  })

  keyboardShortcuts.register({
    key: '/',
    description: 'Focus Search',
    action: () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
      )
      if (searchInput) {
        searchInput.focus()
      }
    },
    category: 'Utility',
  })

  // Debug shortcuts (development only)
  if (process.env.NODE_ENV === 'development') {
    keyboardShortcuts.register({
      key: 'd',
      meta: true,
      shift: true,
      description: 'Toggle DevTools',
      action: () => {
        console.log('DevTools shortcut triggered')
      },
      category: 'Debug',
    })
  }
})
