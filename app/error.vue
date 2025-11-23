<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <UError
    :error="{
      statusMessage: error?.statusCode?.toString(),
      message: '对不起，你访问的页面不存在。',
    }"
    :clear="{
      label: '返回首页',
    }"
  />
</template>
