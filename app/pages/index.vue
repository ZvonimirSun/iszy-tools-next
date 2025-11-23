<script setup lang="ts">
const input = useTemplateRef('input')

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})
</script>

<template>
  <div>
    test
  </div>
</template>

<style scoped>

</style>
