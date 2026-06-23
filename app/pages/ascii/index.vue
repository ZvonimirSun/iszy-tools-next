<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AsciiGroup, AsciiRow } from './children/ascii.data'
import { asciiRows, asciiSearchIndex } from './children/ascii.data'

type BaseFilter = 'all' | 'dec' | 'hex' | 'oct' | 'bin' | 'html'
type GroupFilter = 'all' | AsciiGroup

const keyword = ref('')
const baseFilter = ref<BaseFilter>('all')
const groupFilter = ref<GroupFilter>('all')
const showControlChars = ref(true)

const baseOptions = [
  { label: '全部字段', value: 'all' },
  { label: '十进制', value: 'dec' },
  { label: '十六进制', value: 'hex' },
  { label: '八进制', value: 'oct' },
  { label: '二进制', value: 'bin' },
  { label: 'HTML Code', value: 'html' },
]

const groupOptions = [
  { label: '全部分组', value: 'all' },
  { label: '控制字符', value: 'control' },
  { label: '数字', value: 'digit' },
  { label: '大写字母', value: 'uppercase' },
  { label: '小写字母', value: 'lowercase' },
  { label: '符号', value: 'symbol' },
]

const groupLabelMap: Record<AsciiGroup, string> = {
  control: '控制字符',
  digit: '数字',
  uppercase: '大写字母',
  lowercase: '小写字母',
  symbol: '符号',
}

const columns: TableColumn<AsciiRow>[] = [
  { accessorKey: 'dec', header: 'DEC', size: 90 },
  { accessorKey: 'hex', header: 'HEX', size: 90 },
  { accessorKey: 'oct', header: 'OCT', size: 90 },
  { accessorKey: 'bin', header: 'BIN', size: 160 },
  { accessorKey: 'htmlCode', header: 'HTML Code', size: 130 },
  { accessorKey: 'char', header: '字符', size: 120 },
  { accessorKey: 'escaped', header: '转义', size: 120 },
  { accessorKey: 'name', header: '说明', size: 180 },
  { accessorKey: 'group', header: '分组', size: 120 },
]

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

function matchByBase(row: AsciiRow, normalizedInput: string) {
  if (!normalizedInput) {
    return true
  }

  switch (baseFilter.value) {
    case 'dec':
      return String(row.dec).includes(normalizedInput)
    case 'hex': {
      const normalizedHex = normalizedInput.replace(/^0x/i, '').toUpperCase()
      return row.hex.includes(normalizedHex)
    }
    case 'oct': {
      const normalizedOct = normalizedInput.replace(/^0o/i, '')
      return row.oct.includes(normalizedOct)
    }
    case 'bin': {
      const normalizedBin = normalizedInput.replace(/\s+/g, '')
      return row.bin.includes(normalizedBin)
    }
    case 'html': {
      const compactInput = normalizedInput.replace(/\s+/g, '')
      const normalizedEntity = compactInput.replace(/^&#/, '').replace(/;$/, '')
      return row.htmlCode.toLowerCase().includes(compactInput) || String(row.dec).includes(normalizedEntity)
    }
    case 'all':
    default:
      return asciiSearchIndex.get(row.dec)?.includes(normalizedInput) ?? false
  }
}

const filteredRows = computed(() => {
  const normalizedInput = normalizedKeyword.value

  return asciiRows.filter((row) => {
    if (!showControlChars.value && row.isControl) {
      return false
    }

    if (groupFilter.value !== 'all' && row.group !== groupFilter.value) {
      return false
    }

    return matchByBase(row, normalizedInput)
  })
})
</script>

<template>
  <div class="w-full md:h-full overflow-auto flex flex-col gap-4">
    <ContainerToolItem label="筛选条件" content-class="flex flex-col gap-4">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <UFormField label="关键词">
          <UInput
            v-model="keyword"
            class="w-full"
            icon="i-lucide:search"
            placeholder="支持字符、转义、DEC/HEX/OCT/BIN、控制字符简称"
          />
        </UFormField>

        <UFormField label="检索范围">
          <USelect v-model="baseFilter" class="w-full" :items="baseOptions" />
        </UFormField>

        <UFormField label="字符分组">
          <USelect v-model="groupFilter" class="w-full" :items="groupOptions" />
        </UFormField>

        <UFormField label="显示控制字符">
          <USwitch v-model="showControlChars" />
        </UFormField>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="检索结果" class="flex-1 overflow-auto" content-class="flex-1 flex flex-col gap-2 items-start">
      <UBadge color="neutral" variant="subtle">
        共 {{ filteredRows.length }} 条
      </UBadge>

      <UAlert
        v-if="!filteredRows.length"
        color="neutral"
        variant="subtle"
        title="未匹配到结果，请调整筛选条件"
      />

      <UTable
        v-else
        :data="filteredRows"
        :columns="columns"
        sticky
        class="w-full rounded-lg border border-muted"
        :ui="{ tr: 'whitespace-nowrap' }"
      >
        <template #char-cell="{ row }">
          <span v-if="row.original.isControl" class="text-muted">-</span>
          <span v-else-if="row.original.char === ' '" class="font-mono">SPACE</span>
          <span v-else class="font-mono">{{ row.original.char }}</span>
        </template>

        <template #escaped-cell="{ row }">
          <span class="font-mono">{{ row.original.escaped }}</span>
        </template>

        <template #oct-cell="{ row }">
          <span class="font-mono">{{ row.original.oct }}</span>
        </template>

        <template #htmlCode-cell="{ row }">
          <span class="font-mono">{{ row.original.htmlCode }}</span>
        </template>

        <template #name-cell="{ row }">
          <span class="font-mono">{{ row.original.name }}</span>
        </template>

        <template #group-cell="{ row }">
          <UBadge :color="row.original.isControl ? 'warning' : 'neutral'" variant="subtle">
            {{ groupLabelMap[row.original.group] }}
          </UBadge>
        </template>
      </UTable>
    </ContainerToolItem>
  </div>
</template>
