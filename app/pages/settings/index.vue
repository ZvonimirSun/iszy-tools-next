<script setup lang="ts">
import AiChatSettings from './children/AiChatSettings.vue'
import JsonEditorSettings from './children/JsonEditorSettings.vue'

const { title, adminOrigin } = usePublicConfig()
const seoTitle = computed(() => `个人设置 - ${title}`)
const seoDescription = '管理个人偏好、首页展示、第三方登录绑定、应用配置和登录设备。'

definePageMeta({
  layout: 'full',
})

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  description: seoDescription,
  ogDescription: seoDescription,
  robots: 'noindex,nofollow',
})

const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const settings = settingsStore.general
const feedbackUrl = 'https://github.com/ZvonimirSun/iszy-tools-next/discussions'
const appSettingItems = [
  {
    key: 'jsonEditor',
    toolName: 'json-editor',
    label: 'JSON编辑器',
    path: '/json-editor',
    component: JsonEditorSettings,
  },
  {
    key: 'aiChat',
    toolName: 'ai-chat',
    label: 'AI 对话',
    path: '/ai-chat',
    component: AiChatSettings,
  },
] as const
type AppSettingKey = typeof appSettingItems[number]['key']
const openedAppSettingKey = ref<AppSettingKey>()
const visibleAppSettingItems = computed(() => {
  return appSettingItems.filter((item) => {
    const tool = toolsStore.toolItemsMap[item.toolName]
    return !!tool && !tool.noAccess
  })
})
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4 items-start">
    <AccountSecurityPanel :admin-origin="adminOrigin" login-redirect="/settings" />
    <USeparator />
    <h3 class="text-xl text-pretty font-semibold text-highlighted">
      全局设置
    </h3>
    <h4 class="text-lg text-pretty font-semibold text-highlighted">
      外观
    </h4>
    <UColorModeSelect />
    <h4 class="text-lg text-pretty font-semibold text-highlighted">
      访问统计
    </h4>
    <div class="flex gap-2">
      <UCheckbox v-model="settings.showMost" label="最常访问" />
      <UCheckbox v-model="settings.showRecent" label="最近访问" />
    </div>
    <h4 class="text-lg text-pretty font-semibold text-highlighted">
      其他设置
    </h4>
    <div class="flex gap-2">
      <UCheckbox v-model="settings.showSearch" label="显示搜索" />
      <UCheckbox v-model="settings.showType" label="显示分类" />
      <UCheckbox v-model="settings.openInNewTab" label="新标签页打开工具" />
    </div>
    <h4 class="text-lg text-pretty font-semibold text-highlighted">
      反馈与支持
    </h4>
    <div class="flex flex-wrap gap-2">
      <ULink
        :to="feedbackUrl"
        target="_blank"
      >
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:message-circle"
        >
          留言反馈
        </UButton>
      </ULink>
    </div>
    <USeparator />
    <h3 class="text-xl text-pretty font-semibold text-highlighted">
      应用设置
    </h3>
    <div class="flex w-full flex-col gap-3">
      <div
        v-for="item in visibleAppSettingItems"
        :key="item.key"
        class="rounded-lg border border-muted bg-elevated/50"
      >
        <div class="flex items-center gap-2 px-2 py-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="min-w-0 flex-1 justify-between px-2 py-1.5"
            @click="openedAppSettingKey = openedAppSettingKey === item.key ? undefined : item.key"
          >
            <span class="truncate text-base font-medium text-highlighted">{{ item.label }}</span>
            <UIcon name="i-lucide:chevron-down" class="size-4 transition-transform" :class="{ 'rotate-180': openedAppSettingKey === item.key }" />
          </UButton>
          <ULink :to="item.path">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              icon="i-lucide:external-link"
            >
              打开
            </UButton>
          </ULink>
        </div>
        <div v-if="openedAppSettingKey === item.key" class="border-t border-muted p-4">
          <component :is="item.component" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
