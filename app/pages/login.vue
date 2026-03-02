<script setup lang="ts">
import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { auth: { publicRegister } } = usePublicConfig()
const toast = useToast()
const userStore = useUserStore()

const fields: AuthFormField[] = [{
  name: 'userName',
  type: 'text',
  label: '用户名',
}, {
  name: 'password',
  label: '密码',
  type: 'password',
}]

const providers: ButtonProps[] = [
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => {
      toast.add({ title: 'GitHub', description: 'Login with GitHub' })
    },
  },
  {
    label: 'Linux Do',
    icon: 'i-custom-linuxdo',
    onClick: () => {
      toast.add({ title: 'Linux Do', description: 'Login with Linux Do' })
    },
  },
]

const schema = z.object({
  userName: z.string('请输入用户名'),
  password: z.string('请输入密码'),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!navigator.onLine) {
    toast.add({ title: '网络异常', description: '请检查您的网络连接', color: 'error' })
    return
  }
  try {
    await userStore.login(payload.data)
  }
  catch (e) {}
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="欢迎回来！"
        icon="i-lucide-lock"
        :fields="fields"
        :providers="providers"
        :loading-auto="true"
        separator="或"
        :submit="{
          label: '登录',
        }"
        @submit="onSubmit"
      >
        <template v-if="publicRegister" #description>
          没有账户？<ULink to="/register" class="text-primary font-medium">
            注册
          </ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<style scoped lang="scss">

</style>
