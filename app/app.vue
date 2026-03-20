<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'

const { site, favicon } = usePublicConfig()
const tool = useCurrentTool()
const route = useRoute()

const title = computed(() => {
  return `${tool.value ? `${tool.value.label} - ` : ''}${site.title}`
})
const url = computed(() => {
  return `${site.origin}${route.path}`
})

const link = computed(() => {
  const links = []
  links.push({ rel: 'canonical', href: url.value })
  if (favicon) {
    if (favicon.small) {
      links.push({ rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon.small })
    }
    if (favicon.medium) {
      links.push({ rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon.medium })
    }
    if (favicon.appleTouchIcon) {
      links.push({ rel: 'apple-touch-icon', sizes: '180x180', href: favicon.appleTouchIcon })
    }
    if (favicon.safariPinnedTab) {
      links.push({ rel: 'mask-icon', href: favicon.safariPinnedTab })
    }
    if (favicon.androidManifest) {
      links.push({ rel: 'manifest', href: favicon.androidManifest })
    }
  }
  return links
})

useHead({
  htmlAttrs: {
    lang: zh_cn.code,
    dir: zh_cn.dir,
  },
  link,
})

useSeoMeta({
  title: () => title.value,
  ogTitle: () => title.value,
  ogUrl: () => url.value,
  description: site.description,
  ogDescription: site.description,
})

if (site.image) {
  useSeoMeta({
    ogImage: () => `${site.origin}${site.image}`,
  })
}
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
