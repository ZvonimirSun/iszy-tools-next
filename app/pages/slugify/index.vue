<script setup lang="ts">
import { slugifyText } from './children/slugify.service'

const inputText = ref('Crème brûlée 与 Iszy Tools')
const separator = ref('-')
const lowercase = ref(true)
const keepCjk = ref(true)
const { copy } = useCopy()

const outputText = computed(() => slugifyText(inputText.value, {
  separator: separator.value,
  lowercase: lowercase.value,
  keepCjk: keepCjk.value,
}))

function clear() {
  inputText.value = ''
}

function fillExample() {
  inputText.value = 'Crème brûlée 与 Iszy Tools'
  separator.value = '-'
  lowercase.value = true
  keepCjk.value = true
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
      <UFormField label="待转换文本">
        <UInput
          v-model="inputText"
          class="w-full"
          autofocus
          placeholder="输入标题、文件名或任意文本..."
        />
      </UFormField>
      <UFormField label="分隔符">
        <UInput v-model="separator" class="w-full font-mono" maxlength="4" />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-4 rounded-lg border border-muted bg-muted/30 p-4">
      <USwitch v-model="lowercase" label="转换为小写" />
      <USwitch v-model="keepCjk" label="保留中文字符" />
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
        示例
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
        清空
      </UButton>
    </div>

    <ContainerToolItem label="Slug 结果">
      <div class="grid gap-2">
        <UInput
          :model-value="outputText"
          class="w-full font-mono"
          readonly
          placeholder="转换结果将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制结果
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
