<script setup lang="ts">
const { title } = usePublicConfig()
const seoTitle = computed(() => `页面不存在 - ${title}`)
const seoDescription = '你访问的页面不存在，可以返回首页继续查找需要的在线工具。'

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  description: seoDescription,
  ogDescription: seoDescription,
  robots: 'noindex,nofollow',
})
</script>

<template>
  <UError
    class="w-full h-full min-h-full"
    :error="{
      statusMessage: '404',
      message: '对不起，你访问的页面不存在。',
    }"
    :clear="{
      label: '返回首页',
    }"
  />
</template>
