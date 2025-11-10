import { vPermission } from '~/directives/permission'
import { vFocusTrap } from '~/directives/focus-trap'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('permission', vPermission)
  nuxtApp.vueApp.directive('focus-trap', vFocusTrap)
})
