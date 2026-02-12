<script setup lang="ts">
import draggable from 'vuedraggable'

interface FileItem {
  id: string
  name: string
  status?: {
    rotate?: number
  }
  file: File
  url: string
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
    url: URL.createObjectURL(file),
  })))
}

function removeFile(id: string) {
  const index = fileList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    const item = fileList.value[index]!
    URL.revokeObjectURL(item.url)
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
  if (fileList.value.length === 0) {
    return
  }
  const { PDFDocument, degrees } = await usePdfLib()
  const pdf = await PDFDocument.create()

  for (const item of fileList.value) {
    const arrayBuffer = await item.file.arrayBuffer()
    const type = item.file.type

    let image
    if (type === 'image/png') {
      image = await pdf.embedPng(arrayBuffer)
    }
    else {
      image = await pdf.embedJpg(arrayBuffer)
    }

    const rotation = item.status?.rotate || 0
    const isRotated = rotation === 90 || rotation === 270
    const pageWidth = isRotated ? image.height : image.width
    const pageHeight = isRotated ? image.width : image.height

    const page = pdf.addPage([pageWidth, pageHeight])

    if (rotation === 0) {
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      })
    }
    else if (rotation === 90) {
      page.drawImage(image, {
        x: 0,
        y: pageHeight,
        width: image.width,
        height: image.height,
        rotate: degrees(-90),
      })
    }
    else if (rotation === 180) {
      page.drawImage(image, {
        x: pageWidth,
        y: pageHeight,
        width: image.width,
        height: image.height,
        rotate: degrees(-180),
      })
    }
    else if (rotation === 270) {
      page.drawImage(image, {
        x: pageWidth,
        y: 0,
        width: image.width,
        height: image.height,
        rotate: degrees(-270),
      })
    }
  }

  const pdfBytes = await pdf.save()
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'images.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

onBeforeUnmount(() => {
  fileList.value.forEach(item => URL.revokeObjectURL(item.url))
})
</script>

<template>
  <div class="w-full h-full flex flex-col items-start gap-4">
    <div class="flex gap-2">
      <UFileUpload v-slot="{ open }" :model-value="[]" :reset="true" multiple accept="image/jpeg,image/png,image/webp" @update:model-value="addFiles">
        <UButton @click="open()">
          选择图片
        </UButton>
      </UFileUpload>
      <UButton @click="convert">
        转换为PDF
      </UButton>
    </div>
    <ContainerToolItem class="flex-1 w-full h-full" content-class="overflow-auto h-full">
      <draggable v-model="fileList" item-key="id" class="flex flex-wrap gap-4 justify-center w-full">
        <template #item="{ element }">
          <div class="group w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default cursor-move relative">
            <div class="w-full h-full flex justify-center items-center">
              <img
                class="max-w-full max-h-full shadow object-contain"
                :src="element.url"
                :alt="element.name"
                :style="{
                  rotate: element.status?.rotate ? `${element.status.rotate}deg` : '0deg',
                }"
              >
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
