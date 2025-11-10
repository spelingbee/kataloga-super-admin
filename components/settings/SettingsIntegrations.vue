<template>
  <div class="settings-integrations">
    <div class="settings-integrations__header">
      <div>
        <h2 class="settings-integrations__title">Integrations</h2>
        <p class="settings-integrations__description">
          Manage third-party integrations and webhooks
        </p>
      </div>
      <NuxtLink to="/integrations" class="btn btn--primary">
        <AppIcon name="external-link" />
        Manage Integrations
      </NuxtLink>
    </div>

    <div class="settings-integrations__content">
      <p class="settings-integrations__info">
        Configure integrations like Telegram bot, webhooks, and other third-party services
        from the dedicated integrations page.
      </p>

      <div class="quick-links">
        <NuxtLink to="/integrations" class="quick-link-card">
          <div class="quick-link-card__icon">
            <AppIcon name="link" />
          </div>
          <div class="quick-link-card__content">
            <h3 class="quick-link-card__title">All Integrations</h3>
            <p class="quick-link-card__description">
              View and manage all available integrations
            </p>
          </div>
          <AppIcon name="chevron-right" class="quick-link-card__arrow" />
        </NuxtLink>

        <NuxtLink to="/integrations#telegram" class="quick-link-card">
          <div class="quick-link-card__icon">
            <AppIcon name="message-circle" />
          </div>
          <div class="quick-link-card__content">
            <h3 class="quick-link-card__title">Telegram Bot</h3>
            <p class="quick-link-card__description">
              Configure Telegram bot for notifications
            </p>
          </div>
          <AppIcon name="chevron-right" class="quick-link-card__arrow" />
        </NuxtLink>

        <NuxtLink to="/integrations#webhooks" class="quick-link-card">
          <div class="quick-link-card__icon">
            <AppIcon name="webhook" />
          </div>
          <div class="quick-link-card__content">
            <h3 class="quick-link-card__title">Webhooks</h3>
            <p class="quick-link-card__description">
              Set up webhooks for event notifications
            </p>
          </div>
          <AppIcon name="chevron-right" class="quick-link-card__arrow" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component serves as a quick link to the integrations page
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-integrations {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.settings-integrations__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.settings-integrations__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.settings-integrations__description {
  margin-top: $spacing-xs;
  color: $text-secondary;
  font-size: 0.875rem;
}

.settings-integrations__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.settings-integrations__info {
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-md;
  color: $text-secondary;
  font-size: 0.875rem;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-md;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  text-decoration: none;
  transition: all $transition-base;
  
  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

.quick-link-card__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.1);
  border-radius: $radius-md;
  color: $primary-color;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
  }
}

.quick-link-card__content {
  flex: 1;
}

.quick-link-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.quick-link-card__description {
  font-size: 0.875rem;
  color: $text-secondary;
}

.quick-link-card__arrow {
  width: 20px;
  height: 20px;
  color: $text-light;
  flex-shrink: 0;
  transition: transform $transition-base;
  
  .quick-link-card:hover & {
    transform: translateX(4px);
    color: $primary-color;
  }
}

@media (max-width: $breakpoint-md) {
  .settings-integrations__header {
    flex-direction: column;
  }
  
  .quick-links {
    grid-template-columns: 1fr;
  }
}
</style>
