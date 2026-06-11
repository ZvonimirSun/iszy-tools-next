<script setup lang="ts">
import { parseDocument, stringify as stringifyYaml } from 'yaml'

type ConvertMode = 'json-to-yaml' | 'yaml-to-json'

const mode = ref<ConvertMode>('json-to-yaml')
const inputText = ref('{"a":[{"b":1,"c":true},{"b":2,"c":false}]}')
const outputText = ref('')
const errorMessage = ref('')
const indent = ref(2)
const { copy } = useCopy()

const modeItems = [
  { label: 'JSON 转 YAML', value: 'json-to-yaml' },
  { label: 'YAML 转 JSON', value: 'yaml-to-json' },
]

const inputLabel = computed(() => mode.value === 'json-to-yaml' ? 'JSON 内容' : 'YAML 内容')
const outputLabel = computed(() => mode.value === 'json-to-yaml' ? 'YAML 结果' : 'JSON 结果')
const inputPlaceholder = computed(() => mode.value === 'json-to-yaml' ? '在这里粘贴 JSON 内容...' : '在这里粘贴 YAML 内容...')
const outputPlaceholder = computed(() => mode.value === 'json-to-yaml' ? '转换后的 YAML 将显示在这里...' : '转换后的 JSON 将显示在这里...')

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function convertJsonToYaml() {
  const data = JSON.parse(inputText.value)
  outputText.value = stringifyYaml(data, {
    indent: indent.value,
    lineWidth: 0,
  }).trimEnd()
}

function convertYamlToJson() {
  const doc = parseDocument(inputText.value, {
    prettyErrors: false,
  })

  if (doc.errors.length) {
    throw doc.errors[0]
  }

  outputText.value = JSON.stringify(doc.toJSON(), null, indent.value)
}

function convert() {
  errorMessage.value = ''
  outputText.value = ''

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要转换的内容'
    return
  }

  try {
    if (mode.value === 'json-to-yaml') {
      convertJsonToYaml()
    }
    else {
      convertYamlToJson()
    }
  }
  catch (error) {
    errorMessage.value = `转换失败，${getErrorMessage(error)}`
  }
}

function exchange() {
  const nextMode: ConvertMode = mode.value === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml'
  inputText.value = outputText.value
  outputText.value = ''
  errorMessage.value = ''
  mode.value = nextMode
}

function fillExample() {
  errorMessage.value = ''
  outputText.value = ''
  inputText.value = mode.value === 'json-to-yaml'
    ? '{"a":[{"b":1,"c":true},{"b":2,"c":false}]}'
    : 'a:\n - b: 1\n   c: true\n - b: 2\n   c: false\n'
}

function clear() {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect v-model="mode" class="w-44" :items="modeItems" />
        <span class="text-sm text-muted">缩进大小</span>
        <UInputNumber
          v-model="indent"
          class="w-28"
          :min="0"
          :max="10"
          :step="1"
          :step-strictly="true"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide:wand-sparkles" color="neutral" variant="soft" @click="fillExample">
          填入示例
        </UButton>
        <UButton icon="i-lucide:refresh-cw" color="neutral" variant="outline" :disabled="!outputText" @click="exchange">
          交换方向
        </UButton>
        <UButton icon="i-lucide:trash-2" color="neutral" variant="outline" @click="clear">
          清空
        </UButton>
        <UButton color="primary" icon="i-lucide:arrow-right-left" @click="convert">
          开始转换
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            {{ inputLabel }}
          </h2>
        </div>
        <UTextarea
          v-model="inputText"
          class="w-full font-mono"
          :rows="16"
          resize
          :placeholder="inputPlaceholder"
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            {{ outputLabel }}
          </h2>
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            size="sm"
            @click="copy(outputText)"
          >
            复制
          </UButton>
        </div>
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="16"
          resize
          readonly
          :placeholder="outputPlaceholder"
        />
      </section>
    </div>
  </div>
</template>
