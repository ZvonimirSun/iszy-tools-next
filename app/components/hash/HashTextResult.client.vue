<script setup lang="ts">
import type { AlgoNames } from '~/utils/hashText'
import HashWorker from '~/workers/hashText.worker?worker'

const props = withDefaults(defineProps<{
  value?: string
  encoding?: string
}>(), {
  value: '',
  encoding: 'Hex',
})

const { copy, copied } = useClipboard()
const { post, data, terminate } = useWebWorker<{
  [K in AlgoNames]: string
} | undefined>(new HashWorker())

let algoNames: AlgoNames[] = []

calculate()

onBeforeMount(async () => {
  algoNames = (await import('~/utils/hashText')).algoNames
})

onBeforeUnmount(() => {
  terminate()
})

function calculate() {
  post({ value: props.value, encoding: props.encoding })
}

watchEffect(() => {
  calculate()
})
</script>

<template>
  <div v-if="data && algoNames" class="flex flex-col gap-2">
    <UInput
      v-for="algo in algoNames"
      :key="algo"
      v-model="data[algo]"
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
            @click="copy(data[algo])"
          />
        </UTooltip>
      </template>
    </UInput>
  </div>
</template>

<style scoped lang="scss">

</style>
