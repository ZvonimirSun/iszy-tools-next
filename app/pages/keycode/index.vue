<script setup lang="ts">
interface KeyInfo {
  label: string
  value: string
}

const { copy } = useCopy()

const lastEvent = ref<KeyboardEvent | null>(null)

const rows = computed<KeyInfo[]>(() => {
  const event = lastEvent.value
  if (!event) {
    return [
      { label: 'key', value: '-' },
      { label: 'code', value: '-' },
      { label: 'keyCode', value: '-' },
      { label: 'which', value: '-' },
      { label: 'location', value: '-' },
      { label: 'modifiers', value: '-' },
    ]
  }

  const modifiers = [
    event.ctrlKey ? 'Ctrl' : '',
    event.shiftKey ? 'Shift' : '',
    event.altKey ? 'Alt' : '',
    event.metaKey ? 'Meta' : '',
  ].filter(Boolean).join(' + ')

  return [
    { label: 'key', value: event.key },
    { label: 'code', value: event.code },
    { label: 'keyCode', value: String(event.keyCode) },
    { label: 'which', value: String(event.which) },
    { label: 'location', value: formatLocation(event.location) },
    { label: 'modifiers', value: modifiers || '-' },
  ]
})

const copyText = computed(() => rows.value.map(row => `${row.label}: ${row.value}`).join('\n'))

function handleKeydown(event: KeyboardEvent) {
  event.preventDefault()
  lastEvent.value = event
}

function clear() {
  lastEvent.value = null
}

function formatLocation(location: number) {
  const labels: Record<number, string> = {
    0: 'Standard (0)',
    1: 'Left (1)',
    2: 'Right (2)',
    3: 'Numpad (3)',
  }

  return labels[location] ?? String(location)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div
      class="rounded-lg border border-dashed border-primary/60 bg-primary/5 p-6 text-center outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      tabindex="0"
      @keydown="handleKeydown"
    >
      <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <UIcon name="i-lucide:keyboard" class="size-6" />
      </div>
      <h1 class="text-lg font-semibold">
        点击此区域后按下任意按键
      </h1>
      <p class="mt-1 text-sm text-muted">
        支持组合键，按键信息仅在当前页面显示。
      </p>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          :disabled="!lastEvent"
          color="neutral"
          variant="outline"
          icon="i-lucide:copy"
          @click="copy(copyText)"
        >
          复制全部
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:trash-2"
          @click="clear"
        >
          清空
        </UButton>
      </div>

      <div class="mt-4 divide-y divide-muted">
        <div
          v-for="row in rows"
          :key="row.label"
          class="grid items-center gap-3 py-2 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)_2rem]"
        >
          <span class="text-sm font-medium text-muted sm:text-right">{{ row.label }}</span>
          <UInput :model-value="row.value" class="min-w-0 font-mono" readonly />
          <UButton
            :disabled="row.value === '-'"
            color="neutral"
            variant="ghost"
            icon="i-lucide:copy"
            size="sm"
            class="w-8 shrink-0"
            :aria-label="`复制 ${row.label}`"
            @click="copy(row.value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
