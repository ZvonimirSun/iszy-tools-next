<script setup lang="ts">
import JSZip from 'jszip'

// PDF 文件状态
const pdfFile = shallowRef<File | null>(null)
const pdfName = ref('')
const pageCount = ref(0)

// 拆分模式: 'range' | 'page'
const splitMode = ref<'range' | 'page'>('range')

const items = [
  { label: '按范围', value: 'range' },
  { label: '按页面', value: 'page' },
]

// 范围拆分配置
const ranges = ref<{
  id: string
  start: number
  end: number
}[]>([])
const newRangeStart = ref(1)
const newRangeEnd = ref(1)

const pages = ref<{
  pageNum: number
  selected: boolean
}[]>([])
// 手动选择配置
const mergeSelection = ref(false) // false: 拆分为多个PDF, true: 合并为一个PDF

// 处理状态
const isProcessing = ref(false)

// 选择文件
function onUpload(file: File | null | undefined) {
  if (!file) {
    return
  }
  resetState()
  pdfFile.value = file
  pdfName.value = file.name.replace(/\.pdf$/i, '')
  loadPdfInfo()
}

// 重置状态
function resetState() {
  pdfFile.value = null
  pdfName.value = ''
  pageCount.value = 0

  pages.value = []
  ranges.value = []

  newRangeStart.value = 1
  newRangeEnd.value = 1
}

// 加载 PDF 信息并生成预览
async function loadPdfInfo() {
  if (!pdfFile.value) {
    return
  }

  const pdfManager = usePdfManager()
  const pdf = await pdfManager.loadPdf(pdfFile.value)
  pageCount.value = pdf.numPages
  newRangeEnd.value = pdf.numPages

  // 初始化页面列表
  pages.value = Array.from({ length: pdf.numPages }, (_, i) => ({
    pageNum: i + 1,
    selected: true,
  }))
}

/**
 ******************************** 按范围 ********************************
 */
// 添加范围
function addRange() {
  if (newRangeStart.value < 1 || newRangeEnd.value > pageCount.value || newRangeStart.value > newRangeEnd.value) {
    return
  }
  ranges.value.push({
    id: crypto.randomUUID(),
    start: newRangeStart.value,
    end: newRangeEnd.value,
  })
  newRangeStart.value = newRangeEnd.value + 1 > pageCount.value ? newRangeEnd.value : newRangeEnd.value + 1
  newRangeEnd.value = pageCount.value
}

// 删除范围
function removeRange(id: string) {
  ranges.value = ranges.value.filter(r => r.id !== id)
}

// 按范围拆分
async function splitPdfByRange() {
  if (!pdfFile.value || isProcessing.value) {
    return
  }

  isProcessing.value = true

  try {
    const { PDFDocument } = await usePdfLib()
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    const sourcePdf = await PDFDocument.load(arrayBuffer)

    const pdfResults: { name: string, bytes: Uint8Array }[] = []

    // 按范围拆分
    let count = 1
    for (const range of ranges.value) {
      const newPdf = await PDFDocument.create()
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i)
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach(page => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      pdfResults.push({
        name: `${pdfName.value}_${count}.pdf`,
        bytes: pdfBytes,
      })
      count++
    }

    // 下载结果
    await downloadResults(pdfResults)
  }
  finally {
    isProcessing.value = false
  }
}

/**
 ******************************** 按页面 ********************************
 */
// 切换页面选择
function togglePageSelection(pageNum: number) {
  const page = pages.value.find(p => p.pageNum === pageNum)
  if (page) {
    page.selected = !page.selected
  }
}

// 全选/取消全选
function toggleSelectAll() {
  const allSelected = pages.value.every(p => p.selected)
  pages.value.forEach(p => p.selected = !allSelected)
}

// 获取已选页面
const selectedPages = computed(() => pages.value.filter(p => p.selected).map(p => p.pageNum))

// 按页面拆分
async function splitPdfByPage() {
  if (!pdfFile.value || isProcessing.value) {
    return
  }

  const selectedPageNums = selectedPages.value
  if (selectedPageNums.length === 0) {
    isProcessing.value = false
    return
  }

  isProcessing.value = true

  try {
    const { PDFDocument } = await usePdfLib()
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    const sourcePdf = await PDFDocument.load(arrayBuffer)

    const pdfResults: { name: string, bytes: Uint8Array }[] = []

    if (mergeSelection.value) {
      const newPdf = await PDFDocument.create()
      const pageIndices = selectedPageNums.map(p => p - 1)
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach(page => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      pdfResults.push({
        name: `${pdfName.value}_selected.pdf`,
        bytes: pdfBytes,
      })
    }
    else {
      for (const pageNum of selectedPageNums) {
        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1])
        newPdf.addPage(copiedPage)
        const pdfBytes = await newPdf.save()
        pdfResults.push({
          name: `${pdfName.value}_page${pageNum}.pdf`,
          bytes: pdfBytes,
        })
      }
    }
    // 下载结果
    await downloadResults(pdfResults)
  }
  finally {
    isProcessing.value = false
  }
}

// 下载结果
async function downloadResults(results: { name: string, bytes: Uint8Array }[]) {
  if (results.length === 0) {
    return
  }

  if (results.length === 1) {
    // 单个文件直接下载
    const result = results[0]!
    const blob = new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.name
    a.click()
    URL.revokeObjectURL(url)
  }
  else {
    // 多个文件打包成 ZIP 下载
    const zip = new JSZip()
    for (const result of results) {
      zip.file(result.name, result.bytes)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pdfName.value}_split.zip`
    a.click()
    URL.revokeObjectURL(url)
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-start gap-4">
    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap gap-2 items-center">
      <UFileUpload v-slot="{ open }" :reset="true" accept=".pdf" @update:model-value="onUpload">
        <UButton @click="open()">
          选择PDF文件
        </UButton>
      </UFileUpload>
      <template v-if="pdfFile">
        <UBadge color="info" variant="soft">
          {{ pdfName }}.pdf - {{ pageCount }} 页
        </UBadge>
        <UButton color="error" variant="soft" @click="resetState">
          清除
        </UButton>
      </template>
    </div>
    <template v-if="pdfFile">
      <UTabs
        v-model="splitMode"
        class="w-full overflow-auto"
        :content="false"
        :items="items"
      />
      <div v-if="splitMode === 'range'" class="flex-1 w-full overflow-auto flex flex-col gap-4">
        <!-- 范围拆分操作 -->
        <div class="flex flex-col gap-4 w-full">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm">起始页:</span>
            <UInput v-model.number="newRangeStart" type="number" :min="1" :max="pageCount" class="w-20" />
            <span class="text-sm">结束页:</span>
            <UInput v-model.number="newRangeEnd" type="number" :min="1" :max="pageCount" class="w-20" />
            <UButton @click="addRange">
              添加范围
            </UButton>
          </div>
          <div v-if="ranges.length > 0" class="flex flex-wrap gap-2 items-center">
            <UBadge v-for="range in ranges" :key="range.id" color="primary" variant="soft" class="flex items-center gap-1">
              第 {{ range.start }} - {{ range.end }} 页
              <UIcon name="i-lucide-x" class="cursor-pointer size-4" @click="removeRange(range.id)" />
            </UBadge>
          </div>
          <div>
            <UButton :disabled="!ranges.length" :loading="isProcessing" @click="splitPdfByRange">
              {{ isProcessing ? '处理中...' : '拆分并下载' }}
            </UButton>
          </div>
        </div>
        <ContainerToolItem class="flex-1 w-full h-full" content-class="overflow-auto flex flex-wrap gap-4 justify-center w-full h-full">
          <div
            v-for="(range, index) in ranges"
            :key="range.id"
            class="flex flex-col items-center gap-2"
          >
            <span>范围{{ index + 1 }}</span>
            <div class="border border-dotted p-4">
              <div class="flex items-center gap-2">
                <div class="w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default relative">
                  <div class="w-full h-full flex justify-center items-center">
                    <pdf-viewer class="max-w-full max-h-full shadow" :file="pdfFile" :page="range.start" />
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 h-8 px-2 text-sm/8 overflow-hidden text-ellipsis whitespace-nowrap text-center">
                    <span>{{ range.start }}</span>
                  </div>
                </div>
                <template v-if="range.start !== range.end">
                  <span class="text-2xl">···</span>
                  <div class="flex items-center">
                    <div class="w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default relative">
                      <div class="w-full h-full flex justify-center items-center">
                        <pdf-viewer class="max-w-full max-h-full shadow" :file="pdfFile" :page="range.end" />
                      </div>
                      <div class="absolute bottom-0 left-0 right-0 h-8 px-2 text-sm/8 overflow-hidden text-ellipsis whitespace-nowrap text-center">
                        <span>{{ range.end }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </ContainerToolItem>
      </div>
      <div v-if="splitMode === 'page'" class="flex-1 w-full overflow-auto flex flex-col gap-4">
        <!-- 手动选择操作 -->
        <div class="flex flex-wrap gap-4 items-center">
          <UButton variant="soft" @click="toggleSelectAll">
            {{ pages.every(p => p.selected) ? '取消全选' : '全选' }}
          </UButton>
          <div class="flex items-center gap-2">
            <span class="text-sm">已选: {{ selectedPages.length }} 页</span>
          </div>

          <!-- 拆分按钮 -->
          <UButton :disabled="!selectedPages.length" :loading="isProcessing" @click="splitPdfByPage">
            {{ isProcessing ? '处理中...' : '拆分并下载' }}
          </UButton>
          <div class="flex items-center gap-2">
            <USwitch v-model="mergeSelection" />
            <span class="text-sm">{{ mergeSelection ? '合并为一个PDF' : '拆分为多个PDF' }}</span>
          </div>
        </div>

        <!-- 页面预览网格 -->
        <ContainerToolItem class="flex-1 w-full h-full" content-class="overflow-auto flex flex-wrap gap-4 justify-center w-full h-full">
          <div
            v-for="page in pages"
            :key="page.pageNum"
            class="w-48 h-60 px-2 py-8 shadow border border-muted rounded-lg bg-default relative cursor-pointer hover:border-primary"
            :class="[
              page.selected ? 'border-primary border-2 ring-2 ring-primary/30' : 'border-muted',
            ]"
            @click="togglePageSelection(page.pageNum)"
          >
            <!-- 选中标记 -->
            <div
              v-if="page.selected"
              class="absolute top-1 right-1 size-5 bg-primary rounded-full flex items-center justify-center"
            >
              <UIcon name="i-lucide-check" class="size-3 text-white" />
            </div>
            <!-- 页面预览 -->
            <div class="w-full h-full flex justify-center items-center">
              <pdf-viewer class="max-w-full max-h-full shadow" :file="pdfFile" :page="page.pageNum" :alt="`第 ${page.pageNum} 页预览`" />
            </div>
            <!-- 页码 -->
            <div class="absolute bottom-0 left-0 right-0 h-6 text-center text-sm">
              第 {{ page.pageNum }} 页
            </div>
          </div>
        </ContainerToolItem>
      </div>
    </template>
    <!-- 空状态 -->
    <ContainerToolItem v-else class="flex-1 w-full h-full" content-class="flex items-center justify-center h-full">
      <div class="text-center text-muted">
        <UIcon name="i-icon-park-outline-file-pdf-one" class="size-24 text-red-300 mb-4" />
        <p>请选择一个 PDF 文件开始拆分</p>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
