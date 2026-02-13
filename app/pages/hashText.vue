<script setup lang="ts">
import type { AlgoNames } from '~/utils/hashText'

const { copy, copied } = useClipboard()
const { post, terminate, data } = useHashText()

let algoNames: AlgoNames[] = []
const clearText = ref('')
const encoding = ref<Encoding>('Hex')
const encodingOptions = [
  {
    label: 'Binary (base 2)',
    value: 'Bin',
  },
  {
    label: 'Hexadecimal (base 16)',
    value: 'Hex',
  },
  {
    label: 'Base64 (base 64)',
    value: 'Base64',
  },
  {
    label: 'Base64url (base 64 with url safe chars)',
    value: 'Base64url',
  },
]

onMounted(async () => {
  algoNames = (await import('~/utils/hashText')).algoNames
  calculate()
})

onUnmounted(() => {
  terminate()
})

function calculate() {
  post({ value: clearText.value, encoding: encoding.value })
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <span>待计算的内容</span>
    <UTextarea
      v-model="clearText"
      class="w-full h-full"
      resize
      textarea-class="h-full"
      placeholder="请输入要计算的文本..."
      @input="calculate"
    />
    <template v-if="data && algoNames">
      <span>Digest 编码</span>
      <USelect v-model="encoding" :items="encodingOptions" @change="calculate" />
      <ContainerToolItem label="结果" content-class="flex flex-col gap-2">
        <UInput
          v-for="algo in algoNames"
          :key="algo"
          :model-value="data[algo]"
          class="w-full"
          :ui="{ base: 'ps-28' }"
        >
          <template #leading>
            <span class="">{{ algo }}</span>
          </template>
          <template #trailing>
            <UTooltip text="复制到剪贴板" :content="{ side: 'right' }">
              <UButton
                :color="copied ? 'success' : 'neutral'"
                variant="link"
                size="sm"
                :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                aria-label="Copy to clipboard"
                @click="copy(data[algo] || '')"
              />
            </UTooltip>
          </template>
        </UInput>
      </ContainerToolItem>
    </template>
  </div>
</template>
