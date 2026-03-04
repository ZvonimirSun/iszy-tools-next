<script setup lang="ts">
definePageMeta({
  layout: 'full',
})

const userStore = useUserStore()
const { auth: {
  publicRegister,
} } = usePublicConfig()
const settings = useSettingsStore().general
const toast = useToast()

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

async function bind(type: 'github' | 'linuxdo', title?: string) {
  // todo 绑定
  toast.add({
    title: `绑定 ${title || type}`,
    description: '功能正在开发中，敬请期待~',
    color: 'info',
  })
}

async function unbind(type: 'github' | 'linuxdo', title?: string) {
  // todo 解绑
  toast.add({
    title: `解绑 ${title || type}`,
    description: '功能正在开发中，敬请期待~',
    color: 'info',
  })
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
              <UButton v-if="userStore.profile[item.type]" variant="link" class="p-0 cursor-pointer" @click="unbind(item.type, item.title)">
                解绑
              </UButton>
              <UButton v-else variant="link" class="p-0 cursor-pointer" @click="bind(item.type, item.title)">
                绑定
              </UButton>
            </div>
          </div>
        </div>
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
  </div>
</template>

<style scoped lang="scss">

</style>
