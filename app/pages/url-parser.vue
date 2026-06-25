<script setup lang="ts">
interface UrlPart {
  label: string
  value: string
}

interface QueryPart {
  key: string
  value: string
}

const urlInput = ref('https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash')
const { copy } = useCopy()

const parsed = computed(() => {
  try {
    const url = new URL(urlInput.value.trim())
    const query = [...url.searchParams.entries()].map(([key, value]) => ({ key, value }))

    return {
      error: '',
      parts: [
        { label: 'Protocol', value: url.protocol },
        { label: 'Username', value: url.username },
        { label: 'Password', value: url.password },
        { label: 'Hostname', value: url.hostname },
        { label: 'Port', value: url.port },
        { label: 'Path', value: url.pathname },
        { label: 'Params', value: url.search },
        { label: 'Hash', value: url.hash },
      ] satisfies UrlPart[],
      query,
    }
  }
  catch {
    return {
      error: '请输入包含协议的完整 URL，例如 https://example.com/path?a=1',
      parts: [] as UrlPart[],
      query: [] as QueryPart[],
    }
  }
})

function clear() {
  urlInput.value = ''
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_2rem]">
        <label class="text-sm font-medium text-muted sm:text-right">待解析 URL：</label>
        <UInput
          v-model="urlInput"
          class="w-full font-mono"
          autofocus
          placeholder="输入完整 URL..."
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide:trash-2"
          size="sm"
          aria-label="清空"
          @click="clear"
        />
      </div>
    </div>

    <UAlert
      v-if="urlInput && parsed.error"
      color="error"
      variant="soft"
      :title="parsed.error"
      icon="i-lucide:circle-alert"
    />

    <div v-if="!parsed.error" class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="flex flex-col divide-y divide-muted">
        <div
          v-for="part in parsed.parts"
          :key="part.label"
          class="grid items-center gap-3 py-2 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)_2rem]"
        >
          <span class="text-sm font-medium text-muted sm:text-right">
            {{ part.label }}
          </span>
          <UInput
            :model-value="part.value || '-'"
            class="min-w-0 font-mono"
            readonly
          />
          <UButton
            :disabled="!part.value"
            color="neutral"
            variant="ghost"
            icon="i-lucide:copy"
            size="sm"
            class="w-8 shrink-0"
            :aria-label="`复制 ${part.label}`"
            @click="copy(part.value)"
          />
        </div>

        <div
          v-for="(item, index) in parsed.query"
          :key="`${item.key}-${index}`"
          class="grid items-center gap-3 py-2 sm:grid-cols-[8rem_minmax(0,1fr)]"
        >
          <span class="text-sm text-muted sm:text-right">↳</span>
          <div class="grid min-w-0 gap-3 sm:grid-cols-2">
            <div class="grid min-w-0 items-center gap-2 grid-cols-[minmax(0,1fr)_2rem]">
              <UInput
                :model-value="item.key"
                class="min-w-0 font-mono"
                readonly
              />
              <UButton
                :disabled="!item.key"
                color="neutral"
                variant="ghost"
                icon="i-lucide:copy"
                size="sm"
                class="w-8 shrink-0"
                :aria-label="`复制参数名 ${item.key}`"
                @click="copy(item.key)"
              />
            </div>
            <div class="grid min-w-0 items-center gap-2 grid-cols-[minmax(0,1fr)_2rem]">
              <UInput
                :model-value="item.value"
                class="min-w-0 font-mono"
                readonly
              />
              <UButton
                :disabled="!item.value"
                color="neutral"
                variant="ghost"
                icon="i-lucide:copy"
                size="sm"
                class="w-8 shrink-0"
                :aria-label="`复制参数值 ${item.key}`"
                @click="copy(item.value)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
