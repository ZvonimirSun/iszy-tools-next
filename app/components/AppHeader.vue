<script setup lang="ts">
const { header } = useAppConfig()
const { public: { siteTitle } } = useRuntimeConfig()
</script>

<template>
  <UHeader :to="header?.to || '/'">
    <template #title>
      {{ siteTitle }}
    </template>
    <template #right>
      <ColorModeButtonExtend />
    </template>
  </UHeader>
</template>

<style scoped>

</style>
