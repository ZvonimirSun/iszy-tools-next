<script setup lang="ts">
import type { GeoJsonImportFormat } from '../file/geoJson.types'
import { geoJsonImportFormatItems } from '../file/geoJson.file'

const props = defineProps<{
  open: boolean
  fileName?: string
  defaultFormat: GeoJsonImportFormat
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [format: GeoJsonImportFormat]
  'cancel': []
}>()

const selectedFormat = ref<GeoJsonImportFormat>(props.defaultFormat)
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

watch(() => [props.open, props.defaultFormat] as const, ([open, format]) => {
  if (open) {
    selectedFormat.value = format
  }
})

function cancel() {
  emit('update:open', false)
  emit('cancel')
}

function confirm() {
  emit('confirm', selectedFormat.value)
}
</script>

<template>
  <UModal v-model:open="isOpen" title="导入">
    <template #body>
      <div class="flex flex-col gap-4">
        <div v-if="fileName" class="break-all rounded-md border border-muted bg-elevated/40 px-3 py-2 text-sm text-muted">
          {{ fileName }}
        </div>
        <UFormField label="文件格式">
          <USelect
            v-model="selectedFormat"
            class="w-full"
            :items="geoJsonImportFormatItems"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="cancel"
        >
          取消
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          @click="confirm"
        >
          导入
        </UButton>
      </div>
    </template>
  </UModal>
</template>
