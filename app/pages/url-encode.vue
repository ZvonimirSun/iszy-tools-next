<script setup lang="ts">
type Mode = 'encode' | 'decode'
type Strategy = 'component' | 'uri'

const SPACE_REGEX = /%20/g
const PLUS_REGEX = /\+/g

const mode = ref<Mode>('encode')
const strategy = ref<Strategy>('component')
const autoProcess = ref(true)
const plusForSpace = ref(false)
const decodePlusAsSpace = ref(true)

const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')

const { copy } = useCopy()

const modeOptions = [
  { label: 'URL 编码', value: 'encode' },
  { label: 'URL 解码', value: 'decode' },
]

const strategyOptions = [
  { label: 'encode/decodeURIComponent (single parameter)', value: 'component' },
  { label: 'encode/decodeURI (full URL)', value: 'uri' },
]

function process() {
  errorMessage.value = ''

  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    if (mode.value === 'encode') {
      const encoded = strategy.value === 'uri'
        ? encodeURI(inputText.value)
        : encodeURIComponent(inputText.value)
      outputText.value = plusForSpace.value ? encoded.replace(SPACE_REGEX, '+') : encoded
      return
    }

    const decodeInput = decodePlusAsSpace.value ? inputText.value.replace(PLUS_REGEX, '%20') : inputText.value
    outputText.value = strategy.value === 'uri'
      ? decodeURI(decodeInput)
      : decodeURIComponent(decodeInput)
  }
  catch {
    outputText.value = ''
    errorMessage.value = mode.value === 'decode'
      ? '解码失败：输入不是合法的 URL 编码字符串，请检查 % 转义是否完整。'
      : '编码失败：请检查输入内容。'
  }
}

function swap() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  errorMessage.value = ''
}

function clear() {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
}

watch([inputText, mode, strategy, autoProcess, plusForSpace, decodePlusAsSpace], () => {
  if (autoProcess.value)
    process()
})
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="模式">
        <USelect v-model="mode" :items="modeOptions" class="w-full" />
      </UFormField>
      <UFormField label="转换方式">
        <USelect v-model="strategy" :items="strategyOptions" class="w-full" />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <USwitch v-model="autoProcess" label="输入时自动转换" />
      <USwitch
        v-if="mode === 'encode'"
        v-model="plusForSpace"
        label="将空格编码为 +（表单兼容）"
      />
      <USwitch
        v-else
        v-model="decodePlusAsSpace"
        label="解码时将 + 视为空格"
      />
    </div>

    <ContainerToolItem :label="mode === 'encode' ? '待编码内容' : '待解码内容'">
      <UTextarea
        v-model="inputText"
        class="w-full"
        :rows="6"
        resize
        autofocus
        :placeholder="mode === 'encode' ? '请输入要进行 URL 编码的文本...' : '请输入要进行 URL 解码的字符串...'"
      />
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="!autoProcess"
        color="primary"
        icon="i-lucide:play"
        @click="process"
      >
        {{ mode === 'encode' ? '开始编码' : '开始解码' }}
      </UButton>
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide:arrow-up-down"
        @click="swap"
      >
        交换输入 / 输出
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

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <ContainerToolItem :label="mode === 'encode' ? '编码结果' : '解码结果'">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full"
          :rows="6"
          resize
          readonly
          :placeholder="mode === 'encode' ? '编码结果将显示在这里...' : '解码结果将显示在这里...'"
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

<style scoped lang="scss">

</style>
