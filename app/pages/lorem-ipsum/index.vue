<script setup lang="ts">
import { generateLoremIpsum } from './children/loremIpsum.service'

const paragraphs = ref(3)
const sentencesPerParagraph = ref(4)
const wordsPerSentence = ref(12)
const { copy } = useCopy()

const outputText = computed(() => generateLoremIpsum({
  paragraphs: paragraphs.value,
  sentencesPerParagraph: sentencesPerParagraph.value,
  wordsPerSentence: wordsPerSentence.value,
}))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-3">
      <UFormField label="段落数">
        <UInputNumber v-model="paragraphs" class="w-full" :min="1" :max="50" />
      </UFormField>
      <UFormField label="每段句子数">
        <UInputNumber v-model="sentencesPerParagraph" class="w-full" :min="1" :max="20" />
      </UFormField>
      <UFormField label="每句单词数">
        <UInputNumber v-model="wordsPerSentence" class="w-full" :min="3" :max="40" />
      </UFormField>
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
