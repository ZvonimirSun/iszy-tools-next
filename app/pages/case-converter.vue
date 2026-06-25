<script setup lang="ts">
import { camelCase, kebabCase, pascalCase, snakeCase, splitByCase, titleCase } from 'scule'

interface CaseResult {
  label: string
  value: string
}

const inputText = ref('lorem ipsum dolor sit amet')
const { copy } = useCopy()

const words = computed(() => splitByCase(inputText.value).map(word => word.toLowerCase()).filter(Boolean))
const normalizedText = computed(() => words.value.join(' '))
const results = computed<CaseResult[]>(() => [
  { label: 'Lowercase', value: normalizedText.value },
  { label: 'Uppercase', value: normalizedText.value.toUpperCase() },
  { label: 'Camelcase', value: camelCase(inputText.value) },
  { label: 'Capitalcase', value: titleCase(inputText.value) },
  { label: 'Constantcase', value: snakeCase(inputText.value).toUpperCase() },
  { label: 'Dotcase', value: joinWords(words.value, '.') },
  { label: 'Headercase', value: titleCase(inputText.value).replace(/\s+/g, '-') },
  { label: 'Nocase', value: normalizedText.value },
  { label: 'Paramcase', value: kebabCase(inputText.value) },
  { label: 'Pascalcase', value: pascalCase(inputText.value) },
  { label: 'Pathcase', value: joinWords(words.value, '/') },
  { label: 'Sentencecase', value: toSentenceCase(words.value) },
  { label: 'Snakecase', value: snakeCase(inputText.value) },
  { label: 'Mockingcase', value: toMockingCase(normalizedText.value) },
])

function joinWords(words: string[], separator: string) {
  return words.join(separator)
}

function toSentenceCase(words: string[]) {
  const text = words.join(' ')
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`
}

function toMockingCase(value: string) {
  let letterIndex = 0

  return [...value].map((char) => {
    if (!/[a-z]/i.test(char))
      return char

    const next = letterIndex % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
    letterIndex += 1
    return next
  }).join('')
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid items-center gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_2rem]">
        <label class="text-right text-sm font-medium text-muted">输入文本:</label>
        <div class="min-w-0">
          <UInput
            v-model="inputText"
            class="w-full font-mono"
            autofocus
            placeholder="输入需要转换的文本..."
          />
        </div>
        <span aria-hidden="true" />
      </div>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="flex flex-col divide-y divide-muted">
        <div
          v-for="item in results"
          :key="item.label"
          class="grid items-center gap-3 py-2 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)_2rem]"
        >
          <span class="text-right text-sm font-medium text-muted sm:text-right">
            {{ item.label }}:
          </span>
          <UInput
            :model-value="item.value"
            class="min-w-0 font-mono"
            readonly
            placeholder="-"
          />
          <UButton
            :disabled="!item.value"
            color="neutral"
            variant="ghost"
            icon="i-lucide:copy"
            size="sm"
            :aria-label="`复制 ${item.label}`"
            @click="copy(item.value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
