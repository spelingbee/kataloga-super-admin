import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'default'
  confirmText?: string
  cancelText?: string
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

export function useConfirm() {
  const state = ref<ConfirmState>({
    isOpen: false,
    message: '',
  })

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        ...options,
        isOpen: true,
        resolve,
      }
    })
  }

  function handleConfirm() {
    state.value.resolve?.(true)
    state.value.isOpen = false
  }

  function handleCancel() {
    state.value.resolve?.(false)
    state.value.isOpen = false
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
