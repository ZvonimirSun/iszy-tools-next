<script setup lang="ts">
const targetUrl = ref('')
const sourceHtml = ref('')
const highlightedHtml = ref('')
const errorMessage = ref('')
const loading = ref(false)

const isDark = useIsDark()
const { cdnOrigin } = usePublicConfig()

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`

    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }

    return url.toString()
  }
  catch {
    return ''
  }
}

async function renderHighlight() {
  highlightedHtml.value = ''
  if (!sourceHtml.value) {
    return
  }

  try {
    const { codeToHtml } = await import('shiki')
    highlightedHtml.value = await codeToHtml(sourceHtml.value, {
      lang: 'html',
      theme: isDark.value ? 'github-dark' : 'github-light',
      transformers: [
        {
          pre(node) {
            node.properties.style = ''
          },
        },
      ],
    })
  }
  catch {
    // Fallback to plain <pre><code> when Shiki init fails.
    highlightedHtml.value = ''
  }
}

async function handleViewSource() {
  errorMessage.value = ''

  const normalizedUrl = normalizeUrl(targetUrl.value)
  if (!normalizedUrl) {
    sourceHtml.value = ''
    highlightedHtml.value = ''
    errorMessage.value = '请输入合法的网页地址（http:// 或 https://）'
    return
  }

  loading.value = true
  try {
    sourceHtml.value = await $fetch<string>(`${cdnOrigin}/cors/${normalizedUrl}`, {
      responseType: 'text',
    })
    await renderHighlight()
  }
  catch (error) {
    sourceHtml.value = ''
    highlightedHtml.value = ''
    errorMessage.value = (error as Error)?.message || '获取源码失败，请检查地址是否可访问。'
  }
  finally {
    loading.value = false
  }
}

watch(isDark, async () => {
  if (!sourceHtml.value) {
    return
  }
  await renderHighlight()
})
</script>

<template>
  <div class="h-full w-full flex flex-col gap-3">
    <div class="flex gap-2">
      <UInput
        v-model="targetUrl"
        class="flex-1"
        placeholder="请输入网页地址，例如 https://nuxt.com"
        @keyup.enter="handleViewSource"
      />
      <UButton
        color="primary"
        icon="i-lucide:search"
        :loading="loading"
        @click="handleViewSource"
      >
        查看
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <ContainerToolItem
      label="源码预览"
      class="flex-1 overflow-auto"
      content-class="flex-1 flex flex-col"
    >
      <div
        v-if="loading"
        class="flex-1 flex items-center justify-center text-muted bg-default rounded-lg"
      >
        正在获取源码...
      </div>

      <div
        v-else-if="sourceHtml"
        class="flex-1 overflow-auto bg-default p-4 rounded-lg"
      >
        <div
          v-if="highlightedHtml"
          v-html="highlightedHtml"
        />
        <pre
          v-else
          class="source-pre"
        ><code>{{ sourceHtml }}</code></pre>
      </div>

      <div
        v-else
        class="flex-1 flex items-center justify-center text-muted bg-default rounded-lg"
      >
        输入网页地址并点击“查看”，将在此处展示网页源码。
      </div>
    </ContainerToolItem>
  </div>
</template>
