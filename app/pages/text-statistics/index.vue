<script setup lang="ts">
import { analyzeText, formatReadingTime } from './children/textStatistics.service'

const inputText = ref('Hello world.\n你好世界！')
const stats = computed(() => analyzeText(inputText.value))

const rows = computed(() => [
  { label: '字符数', value: stats.value.characters },
  { label: 'Unicode 码点', value: stats.value.codePoints },
  { label: '词数', value: stats.value.words },
  { label: '行数', value: stats.value.lines },
  { label: '句子数', value: stats.value.sentences },
  { label: 'UTF-8 字节数', value: stats.value.bytes },
  { label: '阅读时间', value: formatReadingTime(stats.value.readingMinutes) },
])
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <ContainerToolItem label="文本内容">
      <UTextarea
        v-model="inputText"
        class="w-full"
        :rows="12"
        resize
        autofocus
        placeholder="输入需要统计的文本..."
      />
    </ContainerToolItem>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="row in rows"
        :key="row.label"
        class="rounded-lg border border-muted bg-muted/30 p-4"
      >
        <p class="text-sm text-muted">
          {{ row.label }}
        </p>
        <p class="mt-2 font-mono text-2xl font-semibold">
          {{ row.value }}
        </p>
      </div>
    </div>
  </div>
</template>
