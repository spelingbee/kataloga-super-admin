interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
  category?: string
}

interface ShortcutOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
}

export const useKeyboardShortcuts = () => {
  const shortcuts = ref<Map<string, KeyboardShortcut>>(new Map())
  const enabled = ref(true)

  /**
   * Register a keyboard shortcut
   */
  const register = (
    shortcut: KeyboardShortcut,
    options: ShortcutOptions = {}
  ) => {
    const key = getShortcutKey(shortcut)
    shortcuts.value.set(key, shortcut)

    if (options.enabled !== false) {
      enabled.value = true
    }
  }

  /**
   * Unregister a keyboard shortcut
   */
  const unregister = (shortcut: Omit<KeyboardShortcut, 'description' | 'action'>) => {
    const key = getShortcutKey(shortcut)
    shortcuts.value.delete(key)
  }

  /**
   * Get shortcut key string
   */
  const getShortcutKey = (shortcut: Partial<KeyboardShortcut>): string => {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.meta) parts.push('meta')
    parts.push(shortcut.key?.toLowerCase() || '')
    return parts.join('+')
  }

  /**
   * Get display string for shortcut
   */
  const getShortcutDisplay = (shortcut: Partial<KeyboardShortcut>): string => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const parts: string[] = []
    
    if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl')
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
    if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win')
    
    // Format key
    const key = shortcut.key?.toUpperCase() || ''
    parts.push(key)
    
    return parts.join(isMac ? '' : '+')
  }

  /**
   * Handle keyboard event
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape key even in inputs
      if (event.key !== 'Escape') {
        return
      }
    }

    const key = event.key.toLowerCase()
    const shortcutKey = getShortcutKey({
      key,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    })

    const shortcut = shortcuts.value.get(shortcutKey)
    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()
      shortcut.action()
    }
  }

  /**
   * Get all registered shortcuts grouped by category
   */
  const getAllShortcuts = (): Record<string, KeyboardShortcut[]> => {
    const grouped: Record<string, KeyboardShortcut[]> = {}
    
    shortcuts.value.forEach((shortcut) => {
      const category = shortcut.category || 'General'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(shortcut)
    })
    
    return grouped
  }

  /**
   * Enable/disable shortcuts
   */
  const setEnabled = (value: boolean) => {
    enabled.value = value
  }

  // Set up event listener
  onMounted(() => {
    if (process.client) {
      window.addEventListener('keydown', handleKeyDown)
    }
  })

  onUnmounted(() => {
    if (process.client) {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  return {
    register,
    unregister,
    getShortcutDisplay,
    getAllShortcuts,
    setEnabled,
    enabled,
  }
}
