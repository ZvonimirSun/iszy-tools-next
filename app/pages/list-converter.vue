<script setup lang="ts">
type SortMode = 'none' | 'alpha' | 'reverse-alpha' | 'length' | 'reverse'

const inputText = ref('')
const trimItems = ref(true)
const removeDuplicates = ref(true)
const lowercase = ref(false)
const keepLineBreaks = ref(false)
const sortMode = ref<SortMode>('alpha')
const separator = ref(',')
const itemPrefix = ref('')
const itemSuffix = ref('')
const listPrefix = ref('')
const listSuffix = ref('')
const { copy } = useCopy()

const sortItems = [
  { label: '不排序', value: 'none' },
  { label: '按字母排序', value: 'alpha' },
  { label: '按字母倒序', value: 'reverse-alpha' },
  { label: '按长度排序', value: 'length' },
  { label: '反转列表', value: 'reverse' },
]

const inputItems = computed(() => parseItems(inputText.value))
const transformedItems = computed(() => transformItems(inputItems.value))
const outputText = computed(() => formatOutput(transformedItems.value))
const inputCount = computed(() => inputItems.value.length)
const outputCount = computed(() => transformedItems.value.length)

function parseItems(value: string) {
  return value.split(/\r?\n/)
}

function normalizeItem(value: string) {
  const trimmed = trimItems.value ? value.trim() : value
  return lowercase.value ? trimmed.toLowerCase() : trimmed
}

function transformItems(items: string[]) {
  let next = items
    .map(item => normalizeItem(item))
    .filter(item => keepLineBreaks.value || item.length > 0)

  if (removeDuplicates.value) {
    const seen = new Set<string>()
    next = next.filter((item) => {
      if (seen.has(item))
        return false
      seen.add(item)
      return true
    })
  }

  switch (sortMode.value) {
    case 'alpha':
      next = [...next].sort((a, b) => a.localeCompare(b))
      break
    case 'reverse-alpha':
      next = [...next].sort((a, b) => b.localeCompare(a))
      break
    case 'length':
      next = [...next].sort((a, b) => a.length - b.length || a.localeCompare(b))
      break
    case 'reverse':
      next = [...next].reverse()
      break
    case 'none':
    default:
      break
  }

  return next
}

function formatOutput(items: string[]) {
  const wrappedItems = items.map(item => `${itemPrefix.value}${item}${itemSuffix.value}`)
  const delimiter = keepLineBreaks.value ? `\n${separator.value}` : separator.value
  return `${listPrefix.value}${wrappedItems.join(delimiter)}${listSuffix.value}`
}

function clear() {
  inputText.value = ''
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-3">
      <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="flex flex-col gap-2">
          <h2 class="text-sm font-medium text-muted">
            处理选项
          </h2>
          <div class="grid gap-2 sm:grid-cols-2">
            <USwitch v-model="trimItems" label="去除项首尾空白" />
            <USwitch v-model="removeDuplicates" label="去除重复项" />
            <USwitch v-model="lowercase" label="转换为小写" />
            <USwitch v-model="keepLineBreaks" label="保留换行" />
          </div>
        </section>

        <section class="grid gap-3 sm:grid-cols-2">
          <UFormField label="排序" class="w-40">
            <USelect v-model="sortMode" :items="sortItems" class="w-full" />
          </UFormField>
          <UFormField label="分隔符" class="w-32">
            <UInput v-model="separator" class="w-full font-mono" placeholder="," />
          </UFormField>
        </section>

        <section class="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
          <UFormField label="项前缀">
            <UInput v-model="itemPrefix" class="w-full font-mono" placeholder="Item prefix" />
          </UFormField>
          <UFormField label="项后缀">
            <UInput v-model="itemSuffix" class="w-full font-mono" placeholder="Item suffix" />
          </UFormField>
          <UFormField label="列表前缀">
            <UInput v-model="listPrefix" class="w-full font-mono" placeholder="List prefix" />
          </UFormField>
          <UFormField label="列表后缀">
            <UInput v-model="listSuffix" class="w-full font-mono" placeholder="List suffix" />
          </UFormField>
        </section>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            输入数据
          </h2>
          <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" size="sm" @click="clear">
            清空
          </UButton>
        </div>
        <UTextarea
          v-model="inputText"
          class="w-full font-mono"
          :rows="18"
          resize
          autofocus
          placeholder="每行粘贴一个列表项..."
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            转换结果（{{ inputCount }} -> {{ outputCount }} 项）
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
          :rows="18"
          resize
          readonly
          placeholder="转换结果将显示在这里..."
        />
      </section>
    </div>
  </div>
</template>
