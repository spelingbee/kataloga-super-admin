<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <h1 class="settings-page__title">System Settings</h1>
      <p class="settings-page__description">Configure platform-wide settings and integrations</p>
    </div>

    <div v-if="loading" class="settings-page__loading">
      <div class="spinner"/>
      <p>Loading settings...</p>
    </div>

    <div v-else-if="error" class="settings-page__error">
      <p>{{ error }}</p>
      <button class="btn btn--primary" @click="loadSettings">
        Retry
      </button>
    </div>

    <div v-else class="settings-page__content">
      <!-- Tabs Navigation -->
      <div class="settings-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['settings-tabs__tab', { 'settings-tabs__tab--active': activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <AppIcon :name="tab.icon" class="settings-tabs__icon" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="settings-content">
        <!-- General Settings Tab -->
        <div v-show="activeTab === 'general'" class="settings-content__panel">
          <SettingsGeneral />
        </div>

        <!-- Email Provider Tab -->
        <div v-show="activeTab === 'email'" class="settings-content__panel">
          <SettingsEmailProvider />
        </div>

        <!-- Payment Gateway Tab -->
        <div v-show="activeTab === 'payment'" class="settings-content__panel">
          <SettingsPaymentGateway />
        </div>

        <!-- Storage Tab -->
        <div v-show="activeTab === 'storage'" class="settings-content__panel">
          <SettingsStorage />
        </div>

        <!-- Integrations Tab -->
        <div v-show="activeTab === 'integrations'" class="settings-content__panel">
          <SettingsIntegrations />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['super_admin'],
})

const settingsStore = useSettingsStore()

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'email', label: 'Email Provider', icon: 'mail' },
  { id: 'payment', label: 'Payment Gateway', icon: 'credit-card' },
  { id: 'storage', label: 'Storage', icon: 'database' },
  { id: 'integrations', label: 'Integrations', icon: 'link' },
]

const loading = computed(() => settingsStore.loading)
const error = computed(() => settingsStore.error)

const loadSettings = async () => {
  try {
    await settingsStore.fetchSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-page {
  max-width: 1200px;
}

.settings-page__header {
  margin-bottom: $spacing-xl;
}

.settings-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
}

.settings-page__description {
  margin-top: $spacing-sm;
  color: $text-secondary;
}

.settings-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.settings-page__error {
  padding: $spacing-xl;
  text-align: center;
  background: $bg-secondary;
  border-radius: $radius-lg;
  
  p {
    color: $error-color;
    margin-bottom: $spacing-md;
  }
}

.settings-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.settings-tabs {
  display: flex;
  gap: $spacing-xs;
  border-bottom: 2px solid $border-color;
  overflow-x: auto;
}

.settings-tabs__tab {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: $text-secondary;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  white-space: nowrap;
  margin-bottom: -2px;
  
  &:hover {
    color: $text-primary;
    background: $bg-secondary;
  }
}

.settings-tabs__tab--active {
  color: $primary-color;
  border-bottom-color: $primary-color;
  
  &:hover {
    background: transparent;
  }
}

.settings-tabs__icon {
  width: 20px;
  height: 20px;
}

.settings-content {
  background: $bg-primary;
}

.settings-content__panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: $breakpoint-md) {
  .settings-tabs {
    gap: 0;
  }
  
  .settings-tabs__tab {
    padding: $spacing-sm $spacing-md;
    font-size: 0.875rem;
  }
}
</style>
