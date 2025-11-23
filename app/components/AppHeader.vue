<script setup lang="ts">
const { header } = useAppConfig()
const { public: { siteTitle } } = useRuntimeConfig()
const input = useTemplateRef('input')

const route = useRoute()

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})
</script>

<template>
  <UHeader>
    <UInput
      v-if="route.path === '/'"
      ref="input"
      icon="i-lucide-search"
      placeholder="搜索..."
      class="w-full"
    >
      <template #trailing>
        <UKbd value="/" />
      </template>
    </UInput>
    <template
      #title
    >
      <NuxtLink :to="header?.to || '/'">
        {{ siteTitle }}
      </NuxtLink>
    </template>
    <template #right>
      <UColorModeButton v-if="header?.colorMode" />
    </template>
  </UHeader>
</template>

<style scoped>

</style>
