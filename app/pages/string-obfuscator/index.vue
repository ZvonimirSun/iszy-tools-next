<script setup lang="ts">
import { obfuscateString } from './children/stringObfuscator.service'

const inputText = ref('sk-live-1234567890abcdef\nuser@example.com')
const keepStart = ref(4)
const keepEnd = ref(4)
const maskChar = ref('*')
const perLine = ref(true)
const { copy } = useCopy()

const outputText = computed(() => obfuscateString(inputText.value, {
  keepStart: keepStart.value,
  keepEnd: keepEnd.value,
  maskChar: maskChar.value,
  perLine: perLine.value,
}))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-4">
      <UFormField label="保留开头">
        <UInputNumber v-model="keepStart" class="w-full" :min="0" :max="100" />
      </UFormField>
      <UFormField label="保留结尾">
        <UInputNumber v-model="keepEnd" class="w-full" :min="0" :max="100" />
      </UFormField>
      <UFormField label="遮罩字符">
        <UInput v-model="maskChar" class="w-full" maxlength="2" />
      </UFormField>
      <UFormField label="处理方式">
        <USwitch v-model="perLine" label="逐行处理" class="pt-2" />
      </UFormField>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ContainerToolItem label="原始文本">
        <UTextarea v-model="inputText" class="w-full font-mono" :rows="12" resize autofocus />
      </ContainerToolItem>
      <ContainerToolItem label="打码结果">
        <div class="flex flex-col gap-2">
          <UTextarea :model-value="outputText" class="w-full font-mono" :rows="12" resize readonly />
          <div class="flex justify-end">
            <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
              复制结果
            </UButton>
          </div>
        </div>
      </ContainerToolItem>
    </div>
  </div>
</template>
