<script setup lang="ts">
const route = useRoute()
const { title } = usePublicConfig()

const seoTitle = computed(() => `网络不可用 - ${title}`)
const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return '/'
  }
  if (redirect.startsWith('//')) {
    return '/'
  }
  return redirect
})

useSeoMeta({
  title: () => seoTitle.value,
  ogTitle: () => seoTitle.value,
  description: '当前网络不可用，联网后将继续打开需要网络的工具。',
  ogDescription: '当前网络不可用，联网后将继续打开需要网络的工具。',
  robots: 'noindex,nofollow',
})

async function continueToTarget() {
  await navigateTo(redirectTarget.value, { replace: true })
}

function handleOnline() {
  void continueToTarget()
}

onMounted(() => {
  if (navigator.onLine) {
    void continueToTarget()
    return
  }

  window.addEventListener('online', handleOnline)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
})
</script>

<template>
  <div class="flex h-full min-h-0 items-center justify-center">
    <UPageCard
      class="w-full max-w-lg border border-muted bg-elevated"
      icon="i-lucide:wifi-off"
      title="网络不可用"
      description="当前工具需要网络连接。联网后将自动继续打开。"
    >
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            to="/"
          >
            返回首页
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide:refresh-cw"
            @click="continueToTarget"
          >
            重试
          </UButton>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
