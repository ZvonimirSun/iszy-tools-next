<script setup lang="ts">
import draggable from 'vuedraggable'

const { cdnOrigin } = usePublicConfig()

let pdfjsLib: null | Pick<typeof import('pdfjs-dist'), 'getDocument'> = null

interface FileItem {
  id: string
  name: string
  preview?: string
  status?: {
    rotate?: number
  }
  file: File
}

const emptyFileList = ref<File[]>([])
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
  emptyFileList.value = []
  getPreview()
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

async function getPreview() {
  for (const item of fileList.value) {
    if (item.preview) {
      continue
    }
    const arrayBuffer = await item.file.arrayBuffer()
    const getDocument = await _loadPdfJsLib()
    const pdf = await getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const scale = 2 // 清晰度，可调
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise
    item.preview = canvas.toDataURL()
    await afterRequestAnimationFrame()
  }
}

async function merge() {
  if (fileList.value.length === 0) {
    return
  }
  const { PDFDocument, degrees } = await import('pdf-lib')
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

async function _loadPdfJsLib() {
  if (pdfjsLib) {
    return pdfjsLib.getDocument
  }
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = `${cdnOrigin}/jsd/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`
  }
  pdfjsLib = { getDocument }
  return pdfjsLib.getDocument
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-start gap-4">
    <div class="flex gap-2">
      <UFileUpload v-slot="{ open }" v-model="emptyFileList" multiple accept=".pdf" @update:model-value="addFiles">
        <UButton @click="open()">
          选择PDF文件
        </UButton>
      </UFileUpload>
      <UButton @click="merge">
        合并PDF
      </UButton>
    </div>
    <ContainerToolItem class="flex-1 w-full h-full" content-class="overflow-auto h-full">
      <draggable v-model="fileList" item-key="name" class="grid grid-cols-24 gap-4 w-full">
        <template #item="{ element }">
          <div class="col-span-24 sm:col-span-8 md:col-span-6 flex justify-center items-center">
            <div class="group w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default cursor-move relative">
              <div class="w-full h-full flex justify-center items-center">
                <img
                  v-if="element.preview"
                  class="max-w-full max-h-full object-contain shadow"
                  :alt="element.name"
                  :src="element.preview"
                  :style="{
                    rotate: element.status?.rotate ? `${element.status.rotate}deg` : '0deg',
                  }"
                >
                <UIcon v-else name="i-icon-park-outline-file-pdf-one" class="size-24 text-red-400" />
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
          </div>
        </template>
      </draggable>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
