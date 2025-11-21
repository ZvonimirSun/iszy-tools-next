<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <div>
    <h1>{{ error?.statusCode }}</h1>
    <NuxtLink to="/">
      返回主页
    </NuxtLink>
  </div>
</template>
