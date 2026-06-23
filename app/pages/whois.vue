<script setup lang="ts">
const loading = ref(false)
const domains = ref('')
const result = ref<string>()
const toast = useToast()
const { cdnOrigin } = usePublicConfig()

async function search() {
  const domain = domains.value.trim()
  if (!domain)
    return

  loading.value = true

  try {
    const res = await $fetch<string>(`${cdnOrigin}/cors/https://www.iana.org/whois?q=${domain}`, {
      responseType: 'text',
    })
    const tree = new DOMParser().parseFromString(res, 'text/html')
    result.value = tree.querySelector('#results + pre')?.innerHTML
  }
  catch {
    toast.add({ title: '查询失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-3">
    <div class="flex gap-2">
      <UInput
        v-model="domains"
        class="flex-1"
        placeholder="输入域名查询"
        @keyup.enter="search"
      />
      <UButton
        color="primary"
        icon="i-lucide:search"
        :loading="loading"
        @click="search"
      >
        查询
      </UButton>
    </div>

    <pre class="flex-1 overflow-auto rounded-md border border-default p-3">{{ loading ? '查询中...' : result }}</pre>
  </div>
</template>
