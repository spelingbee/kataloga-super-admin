import type { Directive } from 'vue'

interface FocusTrapBinding {
  active?: boolean
  initialFocus?: string
  returnFocus?: boolean
}

export const vFocusTrap: Directive<HTMLElement, FocusTrapBinding> = {
  mounted(el, binding) {
    const accessibility = useAccessibility()
    const trap = accessibility.createFocusTrap(el, {
      initialFocus: binding.value?.initialFocus,
      returnFocus: binding.value?.returnFocus,
    })

    // Store trap instance on element
    ;(el as any)._focusTrap = trap

    // Activate if active is true
    if (binding.value?.active !== false) {
      trap.activate()
    }
  },

  updated(el, binding) {
    const trap = (el as any)._focusTrap
    if (!trap) return

    if (binding.value?.active) {
      trap.activate()
    } else {
      trap.deactivate()
    }
  },

  unmounted(el) {
    const trap = (el as any)._focusTrap
    if (trap) {
      trap.deactivate()
      delete (el as any)._focusTrap
    }
  },
}
