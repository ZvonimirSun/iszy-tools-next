<script setup lang="ts">
import type { JsonDiffKind } from './children/jsonDiff.service'
import { createJsonDiffSummary, diffJson, formatJsonValue } from './children/jsonDiff.service'

const leftText = ref('{\n  "name": "Alice",\n  "age": 18,\n  "roles": ["admin"],\n  "enabled": true\n}')
const rightText = ref('{\n  "name": "Alice",\n  "age": 19,\n  "roles": ["admin", "editor"],\n  "city": "Shanghai"\n}')
const showEqual = ref(false)
const { copy } = useCopy()

const parsed = computed(() => {
  try {
    const rows = diffJson(leftText.value, rightText.value)
    return {
      error: '',
      rows,
      visibleRows: showEqual.value ? rows : rows.filter(row => row.kind !== 'equal'),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      rows: [],
      visibleRows: [],
    }
  }
})

const summary = computed(() => createJsonDiffSummary(parsed.value.rows))

function clear() {
  leftText.value = ''
  rightText.value = ''
}

function kindLabel(kind: JsonDiffKind) {
  const labels: Record<JsonDiffKind, string> = {
    equal: '相同',
    change: '修改',
    insert: '新增',
    delete: '删除',
  }

  return labels[kind]
}

function kindColor(kind: JsonDiffKind) {
  const colors: Record<JsonDiffKind, 'neutral' | 'warning' | 'success' | 'error'> = {
    equal: 'neutral',
    change: 'warning',
    insert: 'success',
    delete: 'error',
  }

  return colors[kind]
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="grid gap-4 lg:grid-cols-2">
      <ContainerToolItem label="左侧 JSON">
        <UTextarea
          v-model="leftText"
          class="w-full font-mono"
          :rows="12"
          resize
          autofocus
          placeholder="输入左侧 JSON..."
        />
      </ContainerToolItem>
      <ContainerToolItem label="右侧 JSON">
        <UTextarea
          v-model="rightText"
          class="w-full font-mono"
          :rows="12"
          resize
          placeholder="输入右侧 JSON..."
        />
      </ContainerToolItem>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <USwitch v-model="showEqual" label="显示相同项" />
      <div class="flex flex-wrap gap-2">
        <UButton
          :disabled="!summary"
          color="neutral"
          variant="outline"
          icon="i-lucide:copy"
          @click="copy(summary)"
        >
          复制差异摘要
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
          清空
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="parsed.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="parsed.error"
    />

    <div v-else class="overflow-hidden rounded-lg border border-muted bg-muted/30">
      <div class="grid grid-cols-[minmax(10rem,1fr)_6rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-muted px-4 py-3 text-sm font-medium text-muted">
        <span>路径</span>
        <span>状态</span>
        <span>左侧值</span>
        <span>右侧值</span>
      </div>
      <div class="max-h-[32rem] overflow-auto">
        <div
          v-for="row in parsed.visibleRows"
          :key="`${row.path}-${row.kind}`"
          class="grid min-w-[48rem] grid-cols-[minmax(10rem,1fr)_6rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-muted px-4 py-3 text-sm last:border-b-0"
        >
          <code class="break-all">{{ row.path }}</code>
          <UBadge :color="kindColor(row.kind)" variant="soft" class="w-fit">
            {{ kindLabel(row.kind) }}
          </UBadge>
          <code class="break-all text-error">{{ formatJsonValue(row.left) }}</code>
          <code class="break-all text-success">{{ formatJsonValue(row.right) }}</code>
        </div>
        <div v-if="parsed.visibleRows.length === 0" class="px-4 py-8 text-center text-sm text-muted">
          没有需要显示的差异。
        </div>
      </div>
    </div>
  </div>
</template>
