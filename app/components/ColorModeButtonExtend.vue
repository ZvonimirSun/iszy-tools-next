<script setup lang="ts">
const colorMode = useColorMode()
const settingsStore = useSettingsStore()

if (colorMode.preference !== settingsStore.general.theme.mode) {
  colorMode.preference = settingsStore.general.theme.mode
}

watch(colorMode, (val) => {
  settingsStore.general.theme.mode = val.preference as 'light' | 'dark' | 'system'
})
</script>

<template>
  <UColorModeButton />
</template>

<style scoped>

</style>
