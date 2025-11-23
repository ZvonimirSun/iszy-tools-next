<script setup lang="ts">
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <AppHeader />
    <UMain as="main">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    <AppFooter />
  </UApp>
</template>
