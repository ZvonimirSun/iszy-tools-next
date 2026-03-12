<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'

const { site } = usePublicConfig()
const tool = useCurrentTool()

const seoTitle = computed(() => {
  return `${tool.value ? `${tool.value.label} - ` : ''}${site.title}`
})

useHead({
  htmlAttrs: {
    lang: zh_cn.code,
    dir: zh_cn.dir,
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
  <UApp :locale="zh_cn">
    <AppHeader />
    <UMain as="main">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    <AppFooter />
  </UApp>
</template>
