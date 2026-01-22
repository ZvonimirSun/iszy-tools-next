<script setup lang="ts">
const { site } = usePublicConfig()

const route = useRoute()
const toolsStore = useToolsStore()

const tool = computed(() => {
  return toolsStore.toolItemsMap[route.path.slice(1)]
})

const seoTitle = computed(() => {
  return `${tool.value ? `${tool.value.label} - ` : ''}${site.title}`
})

useHead({
  htmlAttrs: {
    lang: site.lang,
  },
})

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  description: site.description,
  ogDescription: site.description,
})
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
