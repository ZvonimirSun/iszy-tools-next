<script setup lang="ts">
import { convertJsonToCsv } from './children/jsonCsv.service'

type Delimiter = ',' | ';' | '\t'

const sampleJson = `[
  {
    "name": "Alice",
    "age": 18,
    "address": {
      "city": "Shanghai"
    },
    "tags": ["admin", "editor"]
  },
  {
    "name": "Bob",
    "age": 22,
    "address": {
      "city": "Hangzhou"
    },
    "tags": ["viewer"]
  }
]`

const inputText = ref(sampleJson)
const delimiter = ref<Delimiter>(',')
const includeBom = ref(true)
const { copy } = useCopy()

const delimiterOptions = [
  { label: '逗号 ,', value: ',' },
  { label: '分号 ;', value: ';' },
  { label: '制表符 Tab', value: '\t' },
]

const parsed = computed(() => {
  try {
    return {
      error: '',
      result: convertJsonToCsv(inputText.value, {
        delimiter: delimiter.value,
        includeBom: includeBom.value,
      }),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      result: null,
    }
  }
})

const result = computed(() => parsed.value.result)
const errorMessage = computed(() => parsed.value.error)
const csvOutput = computed(() => result.value?.csv ?? '')
const fieldSummary = computed(() => result.value ? `${result.value.fields.length} 个字段，${result.value.rows.length} 行数据` : '')

function clear() {
  inputText.value = ''
}

function fillExample() {
  inputText.value = sampleJson
}

function downloadCsv() {
  if (!csvOutput.value) {
    return
  }

  const blob = new Blob([csvOutput.value], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'data.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
      <UFormField label="分隔符">
        <USelect v-model="delimiter" :items="delimiterOptions" class="w-full" />
      </UFormField>
      <UFormField label="Excel 兼容">
        <USwitch v-model="includeBom" label="包含 UTF-8 BOM" class="pt-2" />
      </UFormField>
    </div>

    <ContainerToolItem label="JSON 对象或对象数组">
      <UTextarea
        v-model="inputText"
        class="w-full font-mono"
        :rows="10"
        resize
        autofocus
        placeholder="请输入 JSON 对象或对象数组..."
      />
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
        示例
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
        清空
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <ContainerToolItem :label="fieldSummary || 'CSV 结果'">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="csvOutput"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="CSV 结果将显示在这里..."
        />
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            :disabled="!csvOutput"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(csvOutput)"
          >
            复制 CSV
          </UButton>
          <UButton
            :disabled="!csvOutput"
            color="primary"
            icon="i-lucide:download"
            @click="downloadCsv"
          >
            下载 CSV
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
