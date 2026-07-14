<script setup lang="ts">
import { generateTokens } from './children/tokenGenerator.service'

const length = ref(32)
const count = ref(5)
const uppercase = ref(true)
const lowercase = ref(true)
const numbers = ref(true)
const symbols = ref(false)
const { copy } = useCopy()

const generated = computed(() => {
  try {
    return {
      error: '',
      tokens: generateTokens({
        length: length.value,
        count: count.value,
        uppercase: uppercase.value,
        lowercase: lowercase.value,
        numbers: numbers.value,
        symbols: symbols.value,
      }),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      tokens: [],
    }
  }
})

const outputText = computed(() => generated.value.tokens.join('\n'))

function enableSafeDefault() {
  uppercase.value = true
  lowercase.value = true
  numbers.value = true
  symbols.value = false
  length.value = 32
  count.value = 5
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="Token 长度">
        <UInputNumber v-model="length" class="w-full" :min="1" :max="512" />
      </UFormField>
      <UFormField label="生成数量">
        <UInputNumber v-model="count" class="w-full" :min="1" :max="1000" />
      </UFormField>
    </div>

    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 sm:grid-cols-2">
      <UCheckbox v-model="uppercase" label="大写字母 A-Z" />
      <UCheckbox v-model="lowercase" label="小写字母 a-z" />
      <UCheckbox v-model="numbers" label="数字 0-9" />
      <UCheckbox v-model="symbols" label="符号 !@#$..." />
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:rotate-ccw" @click="enableSafeDefault">
        默认配置
      </UButton>
    </div>

    <UAlert
      v-if="generated.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="generated.error"
    />

    <ContainerToolItem label="生成结果">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="Token 将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制全部
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
