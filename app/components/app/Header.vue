<script setup lang="ts">
const { site: { title: siteTitle } } = usePublicConfig()
const tool = useCurrentTool()

const route = useRoute()
const settingsPath = computed(() => {
  return route.path === '/settings' ? '/' : '/settings'
})
</script>

<template>
  <UHeader>
    <template #left>
      <div class="flex gap-1.5 items-center">
        <ULink
          to="/"
          class="font-bold text-xl text-highlighted"
        >
          {{ siteTitle }}
        </ULink>
        <template v-if="tool">
          <span>-</span>
          <span class="text-default">{{ tool.label }}</span>
        </template>
      </div>
    </template>
    <template #right>
      <ColorModeButtonExtend />
      <UTooltip
        text="个人中心"
      >
        <ULink :to="settingsPath">
          <UButton
            icon="icon-park-outline:user"
            color="neutral"
            variant="ghost"
            aria-label="个人中心"
          />
        </ULink>
      </UTooltip>
    </template>
  </UHeader>
</template>

<style scoped>

</style>
