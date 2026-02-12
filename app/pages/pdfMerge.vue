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

async function merge() {
  if (fileList.value.length === 0) {
    return
  }
  const { PDFDocument, degrees } = await usePdfLib()
  const mergedPdf = await PDFDocument.create()
  for (const item of fileList.value) {
    const arrayBuffer = await item.file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => {
      if (item.status?.rotate) {
        const rotate = item.status.rotate
        page.setRotation(degrees(rotate))
      }
      mergedPdf.addPage(page)
    })
  }
  const mergedPdfBytes = await mergedPdf.save()
  const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'merged.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-start gap-4">
    <div class="flex gap-2">
      <UFileUpload v-slot="{ open }" :reset="true" multiple accept=".pdf" @update:model-value="addFiles">
        <UButton @click="open()">
          选择PDF文件
        </UButton>
      </UFileUpload>
      <UButton @click="merge">
        合并PDF
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
