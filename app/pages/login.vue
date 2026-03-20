<script setup lang="ts">
import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import type { LocationQuery } from 'vue-router'
import * as z from 'zod'

const { features: { publicRegister } } = usePublicConfig()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const userStore = useUserStore()

const redirect = ref<string>()
const otherQuery = ref({})
const error = ref<string>()

const query = route.query
if (query) {
  if (typeof query.redirect === 'string') {
    redirect.value = query.redirect
  }
  otherQuery.value = _getOtherQuery(query)
}

const fields: AuthFormField[] = [{
  name: 'userName',
  type: 'text',
  label: '用户名',
}, {
  name: 'password',
  label: '密码',
  type: 'password',
}]

const loading = ref(false)
let pollIndex: number | null = null
const providers: ButtonProps[] = [
  {
    label: 'GitHub',
    icon: 'i-simple-icons:github',
    onClick: () => {
      thirdPartyLogin('/api/oauth/github', 'GitHub 登录')
    },
  },
  {
    label: 'Linux Do',
    icon: 'i-custom:linuxdo',
    onClick: () => {
      thirdPartyLogin('/api/oauth/linuxdo', 'LINUX DO 登录')
    },
  },
]

const schema = z.object({
  userName: z.string('请输入用户名'),
  password: z.string('请输入密码'),
})

type Schema = z.output<typeof schema>

onMounted(() => {
  if (userStore.logged) {
    router.push({ path: redirect.value || '/', query: otherQuery.value })
    toast.add({ title: '已登录', description: '您已经登录，无需再次登录', color: 'info' })
  }
})

onBeforeUnmount(() => {
  if (pollIndex != null) {
    clearInterval(pollIndex)
    pollIndex = null
  }
  window.removeEventListener('message', thirdPartyLoginCallback)
})

async function login(payload: FormSubmitEvent<Schema>) {
  if (loading.value) {
    return
  }
  if (!navigator.onLine) {
    toast.add({ title: '网络异常', description: '请检查您的网络连接', color: 'error' })
    return
  }
  try {
    loading.value = true
    await userStore.login(payload.data)
    _afterLogin()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  }
  finally {
    loading.value = false
  }
}

function thirdPartyLogin(url: string, title = '第三方登录', width = 500, height = 600) {
  if (loading.value) {
    toast.add({ title: '登录中', description: '登录进行中，请勿重复点击', color: 'warning' })
    return
  }
  loading.value = true
  window.addEventListener('message', thirdPartyLoginCallback)
  const top = (window.screen.height - width) / 2
  const left = (window.screen.width - height) / 2
  const page = window.open(url, title, `popup,width=${width},height=${height},top=${top},left=${left}`)
  if (!page) {
    loading.value = false
    toast.add({ title: '登录失败', description: '请允许浏览器弹出窗口！', color: 'error' })
    return
  }
  pollIndex = window.setInterval(() => {
    if (page.closed) {
      loading.value = false
      if (pollIndex != null) {
        clearInterval(pollIndex)
        pollIndex = null
      }
    }
  }, 500)
}

async function thirdPartyLoginCallback(e: MessageEvent<{
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
  loading.value = false
  window.removeEventListener('message', thirdPartyLoginCallback)
  if (pollIndex != null) {
    clearInterval(pollIndex)
    pollIndex = null
  }
  page.close()
  if (e.data.success) {
    await userStore.pullProfile(true)
    _afterLogin()
  }
  else {
    error.value = e.data.message || '登录失败'
  }
}

function _afterLogin() {
  toast.add({ title: '登录成功', description: '欢迎回来！', color: 'success' })
  router.push({ path: redirect.value || '/', query: otherQuery.value })
}

function _getOtherQuery(query: LocationQuery) {
  const { redirect, ...result } = query
  return result
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="欢迎回来！"
        icon="i-lucide:lock"
        :fields="fields"
        :providers="providers"
        :loading="loading"
        separator="或"
        :submit="{
          label: '登录',
        }"
        @submit="login"
      >
        <template v-if="publicRegister" #description>
          没有账户？<ULink to="/register" class="text-primary font-medium">
            注册
          </ULink>.
        </template>
        <template v-if="error" #validation>
          <UAlert color="error" icon="i-lucide:info" :title="error" />
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<style scoped lang="scss">

</style>
