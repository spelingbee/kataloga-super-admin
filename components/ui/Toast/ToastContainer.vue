<template>
  <teleport to="body">
    <div class="toast-container">
      <Toast
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        :duration="notification.duration"
        :action="notification.action"
        @close="removeNotification(notification.id)"
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '~/stores/notification'
import Toast from './Toast.vue'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

function removeNotification(id: string) {
  notificationStore.remove(id)
}
</script>

<style scoped lang="scss">
@use './toast-container';
</style>
