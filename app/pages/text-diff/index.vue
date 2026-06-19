<script setup lang="ts">
import type { DiffRow } from './children/textDiff.service'
import { createGitDiff, diffText } from './children/textDiff.service'

definePageMeta({ layout: 'bounded' })

const leftText = ref('')
const rightText = ref('')
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)
const showEqualLines = ref(true)
const hasCompared = ref(false)
const rows = ref<DiffRow[]>([])
const leftFileInput = useTemplateRef<HTMLInputElement>('leftFileInput')
const rightFileInput = useTemplateRef<HTMLInputElement>('rightFileInput')
const { copy } = useCopy()

const visibleRows = computed(() => hasCompared.value
  ? showEqualLines.value ? rows.value : rows.value.filter(row => row.kind !== 'equal')
  : [])
const changedRows = computed(() => rows.value.filter(row => row.kind !== 'equal'))
const deleteCount = computed(() => rows.value.filter(row => row.kind === 'delete' || row.kind === 'change').length)
const insertCount = computed(() => rows.value.filter(row => row.kind === 'insert' || row.kind === 'change').length)
const gitDiffText = computed(() => createGitDiff(rows.value))
const diffOptions = computed(() => ({
  ignoreWhitespace: ignoreWhitespace.value,
  ignoreCase: ignoreCase.value,
}))

const statItems = computed(() => [
  { label: '总行数', value: rows.value.length, color: 'neutral' as const },
  { label: '差异行', value: changedRows.value.length, color: 'warning' as const },
  { label: '删除/修改', value: deleteCount.value, color: 'error' as const },
  { label: '新增/修改', value: insertCount.value, color: 'success' as const },
])

function clearResult() {
  rows.value = []
  hasCompared.value = false
}

function compareText() {
  rows.value = diffText(leftText.value, rightText.value, diffOptions.value)
  hasCompared.value = true
}

function openFilePicker(side: 'left' | 'right') {
  if (side === 'left') {
    leftFileInput.value?.click()
  }
  else {
    rightFileInput.value?.click()
  }
}

async function readFile(event: Event, side: 'left' | 'right') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  const content = await file.text()
  if (side === 'left') {
    leftText.value = content
  }
  else {
    rightText.value = content
  }
}

function swapText() {
  const nextLeft = rightText.value
  rightText.value = leftText.value
  leftText.value = nextLeft
  clearResult()
}

function clearText() {
  leftText.value = ''
  rightText.value = ''
  clearResult()
}

watch([leftText, rightText, ignoreWhitespace, ignoreCase], clearResult)
</script>

<template>
  <div class="flex max-h-full flex-col gap-4 overflow-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <UButton color="neutral" variant="soft" icon="i-lucide:file-up" @click="openFilePicker('left')">
          选择原文
        </UButton>
        <UButton color="neutral" variant="soft" icon="i-lucide:file-up" @click="openFilePicker('right')">
          选择对比文本
        </UButton>
        <UButton color="primary" icon="i-lucide:git-compare" @click="compareText">
          开始对比
        </UButton>
        <UButton color="primary" variant="soft" icon="i-lucide:arrow-left-right" @click="swapText">
          交换
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clearText">
          清空
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide:copy" :disabled="!gitDiffText" @click="copy(gitDiffText)">
          复制 Git Diff
        </UButton>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <USwitch v-model="ignoreWhitespace" label="忽略空白" />
        <USwitch v-model="ignoreCase" label="忽略大小写" />
        <USwitch v-model="showEqualLines" label="显示相同行" />
      </div>

      <input
        ref="leftFileInput"
        type="file"
        class="hidden"
        @change="readFile($event, 'left')"
      >
      <input
        ref="rightFileInput"
        type="file"
        class="hidden"
        @change="readFile($event, 'right')"
      >
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ContainerToolItem label="原文">
        <UTextarea
          v-model="leftText"
          class="w-full font-mono"
          :rows="12"
          resize
          autofocus
          placeholder="输入或选择本地文本文件..."
        />
      </ContainerToolItem>
      <ContainerToolItem label="对比文本">
        <UTextarea
          v-model="rightText"
          class="w-full font-mono"
          :rows="12"
          resize
          placeholder="输入或选择本地文本文件..."
        />
      </ContainerToolItem>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in statItems"
        :key="item.label"
        class="rounded-lg border border-muted bg-default p-3"
      >
        <div class="text-sm text-muted">
          {{ item.label }}
        </div>
        <div class="mt-1 text-2xl font-semibold">
          {{ item.value }}
        </div>
      </div>
    </div>

    <ContainerToolItem label="差异结果">
      <EditorMergeDiffViewer
        v-if="hasCompared && visibleRows.length"
        :left-text="leftText"
        :right-text="rightText"
        :diff-options="diffOptions"
        :show-equal-lines="showEqualLines"
      />

      <div v-else-if="hasCompared" class="rounded-lg border border-muted p-6 text-center text-muted">
        当前没有需要展示的差异
      </div>
      <div v-else class="rounded-lg border border-muted p-6 text-center text-muted">
        点击“开始对比”后显示差异结果
      </div>
    </ContainerToolItem>
  </div>
</template>
