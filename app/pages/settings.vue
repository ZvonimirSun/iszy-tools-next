<script setup lang="ts">
const userStore = useUserStore()

const { auth: {
  publicRegister,
} } = usePublicConfig()
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <div v-if="!userStore.profile" class="flex gap-2">
      <ULink to="/login?redirect=/settings">
        <UButton color="primary">
          登录
        </UButton>
      </ULink>
      <ULink v-if="publicRegister" to="/register">
        <UButton>
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
          <UButton>
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
          <div class="w-16 text-right">
            用户名:
          </div>
          <div>
            {{ userStore.profile.userName }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-16 text-right">
            昵称:
          </div>
          <div>
            {{ userStore.profile.nickName }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-16 text-right">
            邮箱:
          </div>
          <div>
            {{ userStore.profile.email }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-16 text-right">
            角色:
          </div>
          <div>
            {{ userStore.profile?.roles?.[0]?.alias ?? '注册用户' }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-16 text-right">
            绑定:
          </div>
          <div class="flex items-center gap-2" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">

</style>
