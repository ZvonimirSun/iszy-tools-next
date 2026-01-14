<script setup lang="ts">
const colorMode = useColorMode()
const settingsStore = useSettingsStore()

if (colorMode.preference !== settingsStore.general.theme.mode) {
  colorMode.preference = settingsStore.general.theme.mode
}

const colorButtonIcon = computed(() => {
  switch (colorMode.preference) {
    case 'light':
      return 'i-lucide-sun'
    case 'dark':
      return 'i-lucide-moon'
    case 'system':
      return 'i-lucide-monitor'
  }
  return 'i-lucide-monitor'
})

const targetMode = computed(() => {
  let targetMode: 'light' | 'dark' | 'system' = 'system'
  switch (colorMode.preference) {
    case 'light':
      targetMode = 'dark'
      break
    case 'dark':
      targetMode = 'system'
      break
    case 'system':
      targetMode = 'light'
      break
  }
  return targetMode
})

const colorAriaLabel = computed(() => {
  return `切换到${getAlias(targetMode.value)}`
})

watch(colorMode, (val) => {
  settingsStore.general.theme.mode = val.preference as 'light' | 'dark' | 'system'
})

function switchMode() {
  colorMode.preference = targetMode.value
}

function getAlias(mode: 'light' | 'dark' | 'system'): string {
  switch (mode) {
    case 'light':
      return '浅色'
    case 'dark':
      return '深色'
    case 'system':
      return '跟随系统'
  }
}
</script>

<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="colorButtonIcon"
      color="neutral"
      variant="ghost"
      :aria-label="colorAriaLabel"
      @click="switchMode"
    />
  </ClientOnly>
</template>

<style scoped>

</style>
