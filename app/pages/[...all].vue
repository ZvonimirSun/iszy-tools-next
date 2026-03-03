<script setup lang="ts">
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
