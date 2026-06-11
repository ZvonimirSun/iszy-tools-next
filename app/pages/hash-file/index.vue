<script setup lang="ts">
import type { AlgoNames } from './children/hashFile.service'
import { useHashFile } from './children/useHashFile'

const { copy, copied } = useClipboard()
const { post, cancel, terminate, data, error, isCalculating, progress, isCanceled } = useHashFile()

const file = ref<File>()
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024
const fastAlgorithms: AlgoNames[] = ['MD5', 'SHA256']
const fullAlgorithms: AlgoNames[] = ['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3']
const useFullAlgorithms = ref(false)
const activeAlgorithms = computed<AlgoNames[]>(() => {
  if (!file.value) {
    return fullAlgorithms
  }
  if (useFullAlgorithms.value) {
    return fullAlgorithms
  }
  return file.value.size >= LARGE_FILE_THRESHOLD ? fastAlgorithms : fullAlgorithms
})
const isLargeFile = computed(() => (file.value?.size || 0) >= LARGE_FILE_THRESHOLD)

onUnmounted(() => {
  terminate()
})

function addFiles(current: File | null | undefined) {
  if (!current) {
    return
  }
  file.value = current
  useFullAlgorithms.value = false
  calculate()
}

function calculate() {
  if (!file.value) {
    return
  }
  post({
    file: file.value,
    algorithms: activeAlgorithms.value,
  })
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)} KB`
  }
  if (size < 1024 ** 3) {
    return `${(size / 1024 ** 2).toFixed(2)} MB`
  }
  return `${(size / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <ContainerToolItem label="上传文件" content-class="flex flex-col gap-3">
      <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" @update:model-value="addFiles">
        <div
          class="w-full p-8 border-2 border-dashed border-muted rounded-lg text-center cursor-pointer transition-colors hover:bg-elevated/50"
          role="button"
          tabindex="0"
          @click="open()"
        >
          <p class="text-base font-medium text-highlighted">
            点击或拖拽文件到这里上传
          </p>
          <p class="text-sm text-muted mt-1">
            上传后自动计算 Hash
          </p>
        </div>
      </UFileUpload>
      <div v-if="file" class="text-sm text-muted break-all">
        {{ file.name }} ({{ formatFileSize(file.size) }})
      </div>
      <div v-if="file" class="text-xs text-muted">
        当前算法：{{ activeAlgorithms.join(' / ') }}
      </div>
      <div v-if="isLargeFile" class="flex items-center gap-2">
        <UButton
          size="xs"
          variant="soft"
          :color="useFullAlgorithms ? 'primary' : 'neutral'"
          @click="useFullAlgorithms = !useFullAlgorithms; calculate()"
        >
          {{ useFullAlgorithms ? '使用快速算法（MD5 + SHA256）' : '展开全部算法（更慢）' }}
        </UButton>
      </div>
    </ContainerToolItem>

    <ContainerToolItem v-if="file" label="结果" content-class="flex flex-col gap-2">
      <div v-if="isCalculating" class="text-sm text-muted">
        <div>正在计算中，请稍候... {{ progress }}%</div>
        <UButton class="mt-2 w-fit" size="sm" color="warning" variant="soft" @click="cancel">
          取消计算
        </UButton>
      </div>
      <div v-else-if="isCanceled" class="text-sm text-warning">
        已取消计算，可重新上传或再次计算。
      </div>
      <div v-else-if="error" class="text-sm text-error">
        {{ error }}
      </div>
      <template v-else-if="data">
        <UInput
          v-for="algo in activeAlgorithms"
          :key="algo"
          :model-value="data[algo] || ''"
          readonly
          class="w-full"
          :ui="{ base: 'ps-28' }"
        >
          <template #leading>
            <span>{{ algo }}</span>
          </template>
          <template #trailing>
            <UTooltip text="复制到剪贴板" :content="{ side: 'right' }">
              <UButton
                :color="copied ? 'success' : 'neutral'"
                variant="link"
                size="sm"
                :icon="copied ? 'i-lucide:copy-check' : 'i-lucide:copy'"
                aria-label="Copy to clipboard"
                @click="copy(data[algo] || '')"
              />
            </UTooltip>
          </template>
        </UInput>
      </template>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
