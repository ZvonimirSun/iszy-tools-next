<script setup lang="ts">
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

onMounted(() => {
  userStore.logout()
    .then(() => {
      toast.add({ title: '登出成功', color: 'success' })
    })
    .catch(() => {
      toast.add({ title: '登出失败', description: '请稍后再试', color: 'error' })
    })
    .finally(() => {
      router.push(!route.redirectedFrom || (route.redirectedFrom.path === '/logout') ? '/' : route.redirectedFrom.path)
    })
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div data-slot="root" class="w-full space-y-6">
        <div data-slot="header" class="flex flex-col text-center">
          <div data-slot="leading" class="mb-2">
            <UIcon name="i-lucide-lock" data-slot="leadingIcon" class="size-8 shrink-0 inline-block" />
          </div>
          <div data-slot="title" class="text-xl text-pretty font-semibold text-highlighted">
            登出中...
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
