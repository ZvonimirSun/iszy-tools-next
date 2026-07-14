<script setup lang="ts">
import { generateLoremIpsum } from './children/loremIpsum.service'

const paragraphs = ref(3)
const sentenceMin = ref(3)
const sentenceMax = ref(8)
const wordMin = ref(8)
const wordMax = ref(15)
const startWithLoremIpsum = ref(true)
const asHtml = ref(false)
const refreshKey = ref(0)
const { copy } = useCopy()

const outputText = computed(() => {
  void refreshKey.value

  return generateLoremIpsum({
    paragraphs: paragraphs.value,
    sentencesPerParagraph: [sentenceMin.value, sentenceMax.value],
    wordsPerSentence: [wordMin.value, wordMax.value],
    startWithLoremIpsum: startWithLoremIpsum.value,
    asHtml: asHtml.value,
  })
})

function refresh() {
  refreshKey.value += 1
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-3">
      <UFormField label="段落数">
        <UInputNumber v-model="paragraphs" class="w-full" :min="1" :max="50" />
      </UFormField>
      <UFormField label="每段句子最少">
        <UInputNumber v-model="sentenceMin" class="w-full" :min="1" :max="50" />
      </UFormField>
      <UFormField label="每段句子最多">
        <UInputNumber v-model="sentenceMax" class="w-full" :min="1" :max="50" />
      </UFormField>
      <UFormField label="每句单词最少">
        <UInputNumber v-model="wordMin" class="w-full" :min="1" :max="50" />
      </UFormField>
      <UFormField label="每句单词最多">
        <UInputNumber v-model="wordMax" class="w-full" :min="1" :max="50" />
      </UFormField>
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <USwitch v-model="startWithLoremIpsum" label="以 Lorem ipsum 开头" />
        <USwitch v-model="asHtml" label="HTML 段落" />
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="primary" icon="i-lucide:refresh-cw" @click="refresh">
        重新生成
      </UButton>
    </div>

    <ContainerToolItem label="占位文本">
      <div class="flex flex-col gap-2">
        <UTextarea :model-value="outputText" class="w-full" :rows="16" resize readonly />
        <div class="flex justify-end">
          <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
            复制文本
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
