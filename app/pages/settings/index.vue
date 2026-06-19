<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Device } from '@zvonimirsun/iszy-common'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import AiChatSettings from './children/AiChatSettings.vue'
import JsonEditorSettings from './children/JsonEditorSettings.vue'

const { title, adminOrigin, features: { publicRegister } } = usePublicConfig()
const seoTitle = computed(() => `个人设置 - ${title}`)
const seoDescription = '管理个人偏好、首页展示、第三方登录绑定、应用配置和登录设备。'

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  description: seoDescription,
  ogDescription: seoDescription,
  robots: 'noindex,nofollow',
})

const userStore = useUserStore()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const settings = settingsStore.general
const toast = useToast()
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
const adminRoleNames = new Set([RoleEnum.ADMIN, RoleEnum.SUPERADMIN]) as Set<string>
const showAdminLink = computed(() => {
  return !!adminOrigin && !!userStore.profile?.roles?.some((role) => {
    return adminRoleNames.has(role.name)
  })
})
const visibleAppSettingItems = computed(() => {
  return appSettingItems.filter((item) => {
    const tool = toolsStore.toolItemsMap[item.toolName]
    return !!tool && !tool.noAccess
  })
})

/** ************** 三方登录绑定 ***************/

const thirdParties: {
  type: 'github' | 'linuxdo'
  title: string
  icon: string
}[] = [
  {
    type: 'github',
    title: 'Github',
    icon: 'i-simple-icons:github',
  },
  {
    type: 'linuxdo',
    title: 'LINUX DO',
    icon: 'i-custom:linuxdo',
  },
]

const binding = ref(false)
let pollIndex: number | null = null

onBeforeUnmount(() => {
  if (pollIndex != null) {
    clearInterval(pollIndex)
    pollIndex = null
  }
  window.removeEventListener('message', bindCallback)
})

async function bind(type: 'github' | 'linuxdo', title = '绑定第三方登录', width = 500, height = 600) {
  if (userStore.profile![type]) {
    return
  }
  if (binding.value) {
    toast.add({ title: '绑定中', description: '绑定进行中，请勿重复点击', color: 'warning' })
    return
  }
  binding.value = true
  window.addEventListener('message', bindCallback)
  const top = (window.screen.height - width) / 2
  const left = (window.screen.width - height) / 2
  const page = window.open(`/api/oauth/${type}/bind`, title, `popup,width=${width},height=${height},top=${top},left=${left}`)
  if (!page) {
    binding.value = false
    toast.add({ title: '登录失败', description: '请允许浏览器弹出窗口！', color: 'error' })
    return
  }
  pollIndex = window.setInterval(() => {
    if (page.closed) {
      binding.value = false
      if (pollIndex != null) {
        clearInterval(pollIndex)
        pollIndex = null
      }
    }
  }, 500)
}

async function bindCallback(e: MessageEvent<{
  success: boolean
  message?: string
}>) {
  const page = e.source as Window
  if (e.origin !== window.location.origin) {
    return
  }
  if (e.data.success == null) {
    return
  }
  binding.value = false
  window.removeEventListener('message', bindCallback)
  if (pollIndex != null) {
    clearInterval(pollIndex)
    pollIndex = null
  }
  page.close()
  if (e.data.success) {
    await userStore.pullProfile(true)
    toast.add({ title: '绑定成功', color: 'success' })
  }
  else {
    toast.add({ title: '绑定失败', description: e.data.message, color: 'error' })
  }
}

async function unbind(type: 'github' | 'linuxdo') {
  if (!userStore.profile![type]) {
    return
  }
  try {
    await userStore.thirdPartyUnbind(type)
    toast.add({ title: '解绑成功', color: 'success' })
  }
  catch (e) {
    toast.add({ title: '解绑失败', description: (e as Error).message, color: 'error' })
  }
}

/** ************** 登录设备管理 ***************/
type DeviceRow = Device & {
  createTime?: string
  lastLoginTime?: string
}

const deviceColumns: TableColumn<DeviceRow>[] = [
  {
    accessorKey: 'name',
    header: '设备名称',
    size: 260,
  },
  {
    accessorKey: 'lastLoginTime',
    header: '最近登录时间',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center',
      },
    },
    size: 180,
  },
  {
    accessorKey: 'ip',
    header: '登录 IP',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center',
      },
    },
    size: 160,
  },
  {
    id: 'operations',
    header: '操作',
    enableHiding: false,
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center',
      },
    },
    size: 120,
  },
]

const devices = ref<DeviceRow[]>([])

async function manageDevices() {
  try {
    devices.value = await userStore.getDevices()
  }
  catch (e) {
    toast.add({ title: '获取设备列表失败', description: (e as Error).message, color: 'error' })
  }
}

async function removeDevice(options: {
  deviceId?: string
  other?: boolean
}) {
  try {
    await userStore.removeDevice(options)
    toast.add({ title: '操作成功', color: 'success' })
    await manageDevices()
  }
  catch (e) {}
}
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4 items-start">
    <div v-if="!userStore.profile" class="flex gap-2">
      <ULink to="/login?redirect=/settings">
        <UButton color="primary" class="cursor-pointer">
          登录
        </UButton>
      </ULink>
      <ULink v-if="publicRegister" to="/register">
        <UButton class="cursor-pointer">
          注册
        </UButton>
      </ULink>
    </div>
    <template v-else>
      <h3 class="text-xl text-pretty font-semibold text-highlighted">
        {{ userStore.profile.nickName }} 欢迎你~
      </h3>
      <div class="flex gap-2">
        <ULink to="/logout">
          <UButton class="cursor-pointer">
            登出
          </UButton>
        </ULink>
        <ULink
          v-if="showAdminLink"
          :to="adminOrigin"
          target="_blank"
        >
          <UButton
            class="cursor-pointer"
            color="neutral"
            variant="outline"
            icon="i-lucide:external-link"
          >
            管理后台
          </UButton>
        </ULink>
      </div>
      <USeparator />
      <h3 class="text-xl text-pretty font-semibold text-highlighted">
        账户信息
      </h3>
      <div class="flex flex-col items-start gap-2">
        <div class="flex items-center gap-2">
          <div class="w-20 text-right">
            用户名:
          </div>
          <div>
            {{ userStore.profile.userName }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-20 text-right">
            昵称:
          </div>
          <div>
            {{ userStore.profile.nickName }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-20 text-right">
            邮箱:
          </div>
          <div>
            {{ userStore.profile.email }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-20 text-right">
            角色:
          </div>
          <div>
            {{ userStore.profile?.roles?.[0]?.alias ?? '注册用户' }}
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="w-20 text-right">
            三方登录:
          </div>
          <div class="flex flex-col gap-2">
            <div v-for="item in thirdParties" :key="item.type" class="flex gap-2 items-center">
              <div class="w-30 flex gap-2 items-center justify-end">
                <span>{{ item.title }}</span>
                <UIcon :name="item.icon" class="size-5" />
                <span>:</span>
              </div>
              <UButton v-if="userStore.profile[item.type]" variant="link" class="p-0 cursor-pointer" @click="unbind(item.type)">
                解绑
              </UButton>
              <UButton v-else variant="link" class="p-0 cursor-pointer" @click="bind(item.type, item.title)">
                绑定
              </UButton>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <UModal
          title="管理登录设备"
          :ui="{
            content: 'modal-container',
          }"
        >
          <UButton
            class="cursor-pointer"
            color="neutral"
            variant="outline"
            @click="manageDevices"
          >
            登录设备管理
          </UButton>
          <template #body>
            <div class="flex flex-col gap-3">
              <div class="flex justify-end">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  @click="removeDevice({ other: true })"
                >
                  登出所有
                </UButton>
              </div>

              <UAlert
                v-if="!devices.length"
                color="neutral"
                variant="subtle"
                title="暂无登录设备"
              />

              <UTable
                v-else
                :data="devices"
                :columns="deviceColumns"
                :column-pinning="{ right: ['operations'] }"
                sticky
                class="w-full rounded-lg border border-muted"
                :ui="{ tr: 'whitespace-nowrap' }"
              >
                <template #name-cell="{ row }">
                  <div class="flex items-center gap-2">
                    <span class="overflow-hidden text-ellipsis font-medium" :title="row.original.name || row.original.id">
                      {{ row.original.name || row.original.id }}
                    </span>
                    <UBadge v-if="row.original.current" color="primary" variant="subtle">
                      当前设备
                    </UBadge>
                  </div>
                </template>

                <template #lastLoginTime-cell="{ row }">
                  {{ row.original.lastLoginTime || '-' }}
                </template>

                <template #ip-cell="{ row }">
                  <span class="font-mono">{{ row.original.ip || '未知' }}</span>
                </template>

                <template #operations-cell="{ row }">
                  <UButton
                    :disabled="row.original.current"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    @click="removeDevice({ deviceId: row.original.id })"
                  >
                    登出
                  </UButton>
                </template>
              </UTable>
            </div>
          </template>
        </UModal>
      </div>
    </template>
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
