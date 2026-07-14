<script setup lang="ts">
import { decodeHtmlEntities, encodeHtmlEntities } from './children/htmlEntities.service'

type Mode = 'encode' | 'decode'

const mode = ref<Mode>('encode')
const autoProcess = ref(true)
const inputText = ref('<div class="message">Tom & Jerry</div>')
const outputText = ref('')
const { copy } = useCopy()

const modeOptions = [
  { label: 'HTML 实体编码', value: 'encode' },
  { label: 'HTML 实体解码', value: 'decode' },
]

function process() {
  outputText.value = mode.value === 'encode'
    ? encodeHtmlEntities(inputText.value)
    : decodeHtmlEntities(inputText.value)
}

function swap() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  process()
}

function fillExample() {
  inputText.value = mode.value === 'encode'
    ? '<button aria-label="Save & close">保存</button>'
    : '&lt;button aria-label=&quot;Save &amp; close&quot;&gt;保存&lt;/button&gt;'
  process()
}

function clear() {
  inputText.value = ''
  outputText.value = ''
}

watch([inputText, mode, autoProcess], () => {
  if (autoProcess.value) {
    process()
  }
}, { immediate: true })
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <UFormField label="转换模式">
        <USelect v-model="mode" :items="modeOptions" class="w-full" />
      </UFormField>
      <USwitch v-model="autoProcess" label="输入时自动转换" class="pb-1" />
    </div>

    <ContainerToolItem :label="mode === 'encode' ? '待编码 HTML / 文本' : '待解码实体字符串'">
      <UTextarea
        v-model="inputText"
        class="w-full font-mono"
        :rows="7"
        resize
        autofocus
        :placeholder="mode === 'encode' ? '请输入需要转义的 HTML 或文本...' : '请输入包含 &amp;lt;、&#60; 等实体的字符串...'"
      />
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="!autoProcess"
        color="primary"
        icon="i-lucide:play"
        @click="process"
      >
        开始转换
      </UButton>
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide:arrow-up-down"
        :disabled="!outputText"
        @click="swap"
      >
        交换输入 / 输出
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide:file-input"
        @click="fillExample"
      >
        示例
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

    <ContainerToolItem :label="mode === 'encode' ? '实体编码结果' : '实体解码结果'">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="7"
          resize
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
