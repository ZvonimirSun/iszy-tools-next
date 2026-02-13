<script setup lang="ts">
import draggable from 'vuedraggable'

interface FileItem {
  id: string
  name: string
  status?: {
    rotate?: number
  }
  file: File
}

const fileList = ref<FileItem[]>([])
const quality = ref(0.9)
const isProcessing = ref(false)

function addFiles(files: File[] | null | undefined) {
  if (!files) {
    return
  }
  fileList.value.push(...files.map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    file,
  })))
}

function removeFile(id: string) {
  const index = fileList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

function rotateFile(item: FileItem) {
  if (!item.status) {
    item.status = {}
  }
  item.status.rotate = ((item.status.rotate || 0) + 90) % 360
}

async function convert() {
  if (fileList.value.length === 0 || isProcessing.value) {
    return
  }

  isProcessing.value = true

  try {
    const { getDocument } = await usePdfJs()
    const results: { name: string, data: Blob }[] = []

    for (const item of fileList.value) {
      const arrayBuffer = await item.file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      const baseName = item.name.replace(/\.pdf$/i, '')
      const rotation = item.status?.rotate || 0

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 2
        const viewport = page.getViewport({ scale, rotation })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, viewport }).promise
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => {
            resolve(b!)
          }, 'image/jpeg', quality.value)
        })
        const fileName = pdf.numPages > 1
          ? `${baseName}_${String(i).padStart(String(pdf.numPages).length, '0')}.jpg`
          : `${baseName}.jpg`
        results.push({ name: fileName, data: blob })
      }

      pdf.destroy()
    }

    const zipBlob = await createZip(results)
    downloadBlob(zipBlob, 'pdf_to_jpg.zip')
  }
  finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-start gap-4">
    <div class="flex flex-wrap gap-2 items-center">
      <UFileUpload v-slot="{ open }" :model-value="[]" :reset="true" multiple accept=".pdf" @update:model-value="addFiles">
        <UButton @click="open()">
          选择PDF文件
        </UButton>
      </UFileUpload>
      <div class="flex items-center gap-2">
        <span class="text-sm whitespace-nowrap">质量:</span>
        <USlider
          v-model="quality"
          :min="0.1"
          :max="1"
          :step="0.1"
          class="w-32"
        />
        <span class="text-sm w-8">{{ quality }}</span>
      </div>
      <UButton :disabled="!fileList.length" :loading="isProcessing" @click="convert">
        {{ isProcessing ? '转换中...' : '转换并下载' }}
      </UButton>
    </div>
    <ContainerToolItem class="flex-1 w-full h-full" content-class="overflow-auto h-full">
      <draggable v-model="fileList" item-key="id" class="flex flex-wrap gap-4 justify-center w-full">
        <template #item="{ element }">
          <div class="group w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default cursor-move relative">
            <div class="w-full h-full flex justify-center items-center">
              <pdf-viewer class="max-w-full max-h-full shadow" :file="element.file" :rotate="element.status?.rotate" :page="1" />
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-8 px-2 text-sm/8 overflow-hidden text-ellipsis whitespace-nowrap text-center">
              <span :title="element.name">{{ element.name }}</span>
            </div>
            <div class="absolute hidden group-hover:flex gap-2 right-2 top-2">
              <UButton
                class="rounded-full cursor-pointer"
                icon="i-icon-park-outline-rotating-forward"
                variant="outline"
                size="xs"
                color="neutral"
                @click="rotateFile(element)"
              />
              <UButton
                class="rounded-full cursor-pointer"
                icon="i-icon-park-outline-close"
                variant="outline"
                size="xs"
                color="neutral"
                @click="removeFile(element.id)"
              />
            </div>
          </div>
        </template>
      </draggable>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
