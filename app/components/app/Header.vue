<script setup lang="ts">
const { title } = usePublicConfig()
const tool = useCurrentTool()
const userStore = useUserStore()

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
          {{ title }}
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
        :text="userStore.logged ? '个人中心' : '网站设置'"
      >
        <ULink :to="settingsPath">
          <UButton
            v-if="userStore.logged"
            icon="icon-park-outline:user"
            color="neutral"
            variant="ghost"
            aria-label="个人中心"
          />
          <UButton
            v-else
            icon="icon-park-outline:setting-two"
            color="neutral"
            variant="ghost"
            aria-label="网站设置"
          />
        </ULink>
      </UTooltip>
    </template>
  </UHeader>
</template>

<style scoped>

</style>
