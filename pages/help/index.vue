<template>
  <div class="help-center">
    <div class="help-center__header">
      <h1 class="help-center__title">Help Center</h1>
      <p class="help-center__subtitle">
        Get help with the Super Admin Panel
      </p>
    </div>

    <div class="help-center__grid">
      <!-- Quick Links -->
      <NuxtLink to="/help/faq" class="help-card">
        <div class="help-card__icon">
          <AppIcon name="help-circle" :size="32" />
        </div>
        <h3 class="help-card__title">FAQ</h3>
        <p class="help-card__description">
          Find answers to frequently asked questions
        </p>
      </NuxtLink>

      <NuxtLink to="/docs" class="help-card">
        <div class="help-card__icon">
          <AppIcon name="book-open" :size="32" />
        </div>
        <h3 class="help-card__title">Documentation</h3>
        <p class="help-card__description">
          Read comprehensive guides and tutorials
        </p>
      </NuxtLink>

      <button class="help-card" @click="startTour">
        <div class="help-card__icon">
          <AppIcon name="play-circle" :size="32" />
        </div>
        <h3 class="help-card__title">Take a Tour</h3>
        <p class="help-card__description">
          Learn the basics with an interactive tour
        </p>
      </button>

      <NuxtLink to="/support" class="help-card">
        <div class="help-card__icon">
          <AppIcon name="message-circle" :size="32" />
        </div>
        <h3 class="help-card__title">Contact Support</h3>
        <p class="help-card__description">
          Get help from our support team
        </p>
      </NuxtLink>
    </div>

    <!-- Available Tours -->
    <div class="help-center__tours">
      <h2 class="help-center__section-title">Interactive Tours</h2>
      <div class="tours-grid">
        <div
          v-for="tour in availableTours"
          :key="tour.id"
          class="tour-card"
        >
          <div class="tour-card__header">
            <h3 class="tour-card__title">{{ tour.name }}</h3>
            <span v-if="tour.completed" class="tour-card__badge">
              <AppIcon name="check-circle" :size="16" />
              Completed
            </span>
          </div>
          <div class="tour-card__actions">
            <button
              class="tour-card__button tour-card__button--primary"
              @click="startTour(tour.id)"
            >
              {{ tour.completed ? 'Restart Tour' : 'Start Tour' }}
            </button>
            <button
              v-if="tour.completed"
              class="tour-card__button tour-card__button--secondary"
              @click="resetTour(tour.id)"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts -->
    <div class="help-center__shortcuts">
      <h2 class="help-center__section-title">Keyboard Shortcuts</h2>
      <p class="help-center__text">
        Press <kbd>?</kbd> or <kbd>Ctrl/Cmd + K</kbd> to view all keyboard shortcuts
      </p>
      <button class="help-center__button" @click="showShortcuts">
        View Shortcuts
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOnboarding } from '~/composables/useOnboarding'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

definePageMeta({
  layout: 'default',
  title: 'Help Center'
})

const { availableTours, startTour: startOnboardingTour, resetTour } = useOnboarding()
const { showModal } = useKeyboardShortcuts()

const startTour = (tourId?: string) => {
  if (tourId) {
    startOnboardingTour(tourId)
  } else {
    // Start dashboard tour by default
    startOnboardingTour('dashboard')
  }
}

const showShortcuts = () => {
  showModal()
}



<style scoped lang="scss">
@use './index';
</style>
