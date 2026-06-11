<script setup lang="ts">
import type { GeoJsonExportFormat, GeoJsonExportOptions } from '../file/geoJson.types'
import { geoJsonExportFormatItems } from '../file/geoJson.file'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [options: GeoJsonExportOptions]
}>()

const selectedFormat = ref<GeoJsonExportFormat>('geojson')
const pretty = ref(false)
const featureBbox = ref(false)
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

watch(() => props.open, (open) => {
  if (open) {
    selectedFormat.value = 'geojson'
    pretty.value = false
    featureBbox.value = false
  }
})

function confirm() {
  emit('confirm', {
    format: selectedFormat.value,
    pretty: pretty.value,
    featureBbox: featureBbox.value,
  })
}
</script>

<template>
  <UModal v-model:open="isOpen" title="导出">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="文件格式">
          <USelect
            v-model="selectedFormat"
            class="w-full"
            :items="geoJsonExportFormatItems"
          />
        </UFormField>

        <div v-show="selectedFormat === 'geojson'" class="flex flex-col gap-3">
          <UCheckbox v-model="pretty" label="格式化" />
          <UCheckbox v-model="featureBbox" label="添加 bbox 属性到 Feature" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="isOpen = false"
        >
          取消
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          @click="confirm"
        >
          导出
        </UButton>
      </div>
    </template>
  </UModal>
</template>
