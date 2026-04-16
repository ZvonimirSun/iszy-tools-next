<script setup lang="ts">
import type { RunjsDependency } from '~/stores/runjs'
import js from '~/components/editor/lang-js'
import {
  buildRunjsImportMap,
  buildRunjsSrcdoc,
  findDuplicateRunjsAliases,
  instrumentExpressionStatements,
  normalizeRunjsDependencies,
  runjsDepsSignature,
} from './children/runjs.service'

type LogType = 'log' | 'result' | 'error' | 'runtime-error' | 'unhandledrejection' | 'system'

interface RunjsLog {
  id: number
  type: LogType
  time: number
  text: string
  stack?: string
}

const FRAME_SOURCE = 'runjs-frame'

const store = useRunjsStore()
const toast = useToast()

const iframeRef = ref<HTMLIFrameElement>()
const iframeSrcdoc = ref('')
const logs = ref<RunjsLog[]>([])

const depModalOpen = ref(false)
const depDrafts = ref<RunjsDependency[]>([])
const depEditError = ref('')

const stackOpen = reactive<Record<number, boolean>>({})

let logSeed = 0
let runTimer: ReturnType<typeof setTimeout> | undefined

const importMap = computed(() => {
  return buildRunjsImportMap(store.deps)
})

const duplicateAliases = computed(() => {
  return findDuplicateRunjsAliases(store.deps)
})

function openDepModal() {
  depEditError.value = ''
  depDrafts.value = store.deps.map(dep => ({
    name: dep.name,
    url: dep.url,
  }))
  if (!depDrafts.value.length) {
    addDepDraft()
  }
  depModalOpen.value = true
}

function addDepDraft() {
  depDrafts.value.push({
    name: '',
    url: '',
  })
}

function removeDepDraft(index: number) {
  depDrafts.value.splice(index, 1)
  if (!depDrafts.value.length) {
    addDepDraft()
  }
}

function validateDepDrafts() {
  const result = normalizeRunjsDependencies(depDrafts.value)
  depEditError.value = result.error
  return result.normalized
}

function depsSignature(deps: RunjsDependency[]) {
  return runjsDepsSignature(deps)
}

function saveDependencies(close: () => void) {
  const normalized = validateDepDrafts()
  if (!normalized) {
    return
  }

  const previous = depsSignature(store.deps)
  const current = depsSignature(normalized)

  if (previous === current) {
    close()
    return
  }

  store.deps = normalized
  close()
  scheduleRun()
}

function clearLogs() {
  logs.value = []
  for (const key of Object.keys(stackOpen)) {
    delete stackOpen[Number(key)]
  }
}

function pushLog(type: LogType, text: string, stack?: string) {
  const id = ++logSeed
  logs.value.push({
    id,
    type,
    time: Date.now(),
    text,
    stack,
  })
  stackOpen[id] = false
}

function run() {
  clearLogs()

  if (duplicateAliases.value.length) {
    pushLog('system', `依赖别名重复：${duplicateAliases.value.join(', ')}`)
    iframeSrcdoc.value = '<!doctype html><html><body><p style="font-family: sans-serif; color: #ef4444;">依赖别名重复，请修复后重试。</p></body></html>'
    return
  }

  let executableCode = store.code
  try {
    executableCode = instrumentExpressionStatements(store.code)
  }
  catch (error) {
    pushLog('system', '自动结果输出增强失败，已回退执行原始代码', error instanceof Error ? (error.stack || error.message) : String(error))
  }

  iframeSrcdoc.value = buildRunjsSrcdoc(executableCode, importMap.value, FRAME_SOURCE)
}

function scheduleRun(immediate = false) {
  if (runTimer) {
    clearTimeout(runTimer)
  }

  if (immediate) {
    run()
    return
  }

  runTimer = setTimeout(() => {
    run()
  }, 500)
}

function formatTime(time: number) {
  const date = new Date(time)
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${date.toLocaleTimeString('zh-CN', { hour12: false })}.${ms}`
}

function typeLabel(type: LogType) {
  switch (type) {
    case 'log':
      return 'LOG'
    case 'result':
      return 'RESULT'
    case 'error':
      return 'ERROR'
    case 'runtime-error':
      return 'RUNTIME'
    case 'unhandledrejection':
      return 'REJECTION'
    default:
      return 'SYSTEM'
  }
}

function typeColor(type: LogType) {
  if (type === 'log') {
    return 'neutral'
  }
  if (type === 'result') {
    return 'success'
  }
  if (type === 'system') {
    return 'warning'
  }
  return 'error'
}

function handleMessage(event: MessageEvent) {
  const data = event.data as {
    source?: string
    type?: LogType
    text?: string
    stack?: string
    time?: number
  }

  if (!data || data.source !== FRAME_SOURCE || !data.type) {
    return
  }

  logs.value.push({
    id: ++logSeed,
    type: data.type,
    time: data.time || Date.now(),
    text: data.text || '',
    stack: data.stack,
  })
  stackOpen[logSeed] = false
}

watch(() => store.code, () => {
  scheduleRun()
})

watch(() => store.deps.map(dep => `${dep.name}|${dep.url}`).join('\n'), () => {
  scheduleRun()
})

onMounted(() => {
  window.addEventListener('message', handleMessage)

  if (duplicateAliases.value.length) {
    toast.add({
      title: '检测到重复依赖别名，请先修复',
      color: 'warning',
    })
  }

  scheduleRun(true)
})

onUnmounted(() => {
  if (runTimer) {
    clearTimeout(runTimer)
  }
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <ClientOnly>
    <div class="w-full h-full flex flex-col sm:flex-row gap-4 overflow-auto">
      <ContainerToolItem label="JavaScript 代码" class="flex-1 overflow-auto" content-class="flex flex-col gap-4 flex-1">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">依赖数量：{{ store.deps.length }}</span>

          <UModal v-model:open="depModalOpen" title="编辑 ESM 依赖" :ui="{ content: 'max-w-3xl' }">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide:package"
              @click="openDepModal"
            >
              编辑依赖
            </UButton>

            <template #body>
              <div class="flex flex-col gap-3">
                <UAlert
                  v-if="depEditError"
                  color="error"
                  variant="soft"
                  :title="depEditError"
                />

                <UAlert
                  color="info"
                  variant="soft"
                  title="URL 留空将自动使用 https://esm.sh/别名，也可直接填写库名（如 dayjs）"
                />

                <div
                  v-for="(dep, index) in depDrafts"
                  :key="index"
                  class="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-center"
                >
                  <UInput
                    v-model="dep.name"
                    placeholder="别名，例如：dayjs"
                  />
                  <UInput
                    v-model="dep.url"
                    placeholder="ESM URL（可留空）或直接填库名，例如：dayjs"
                  />
                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-lucide:trash-2"
                    @click="removeDepDraft(index)"
                  />
                </div>

                <div class="flex justify-start">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide:plus"
                    @click="addDepDraft"
                  >
                    新增一项
                  </UButton>
                </div>
              </div>
            </template>

            <template #footer="{ close }">
              <div class="flex justify-end gap-2 w-full">
                <UButton
                  color="neutral"
                  variant="outline"
                  @click="close"
                >
                  取消
                </UButton>
                <UButton
                  color="primary"
                  @click="saveDependencies(close)"
                >
                  保存
                </UButton>
              </div>
            </template>
          </UModal>
        </div>

        <EditorMini
          class="flex-1"
          placeholder="输入 JavaScript（ES Module）代码..."
          :plugin="js"
          :input-default="store.code"
          @change="store.code = $event"
        />
      </ContainerToolItem>

      <ContainerToolItem label="控制台输出" class="flex-1 overflow-auto" content-class="flex flex-col gap-4 flex-1">
        <iframe
          ref="iframeRef"
          :srcdoc="iframeSrcdoc"
          class="hidden"
          title="RunJS Sandbox"
          sandbox="allow-scripts"
        />
        <div v-if="logs.length" class="flex flex-col gap-2">
          <div
            v-for="log in logs"
            :key="log.id"
            class="border border-default rounded-md p-3 flex flex-col gap-2"
          >
            <div class="flex items-center gap-2 text-xs">
              <UBadge :color="typeColor(log.type)" variant="soft">
                {{ typeLabel(log.type) }}
              </UBadge>
              <span class="text-toned">{{ formatTime(log.time) }}</span>
            </div>
            <pre class="m-0 whitespace-pre-wrap break-all text-sm">{{ log.text }}</pre>

            <UCollapsible
              v-if="log.stack"
              v-model:open="stackOpen[log.id]"
              :unmount-on-hide="false"
              class="border border-default rounded"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                class="w-full justify-start"
              >
                {{ stackOpen[log.id] ? '收起堆栈' : '展开堆栈' }}
              </UButton>
              <template #content>
                <pre class="m-0 p-3 whitespace-pre-wrap break-all text-xs text-toned border-t border-default">{{ log.stack }}</pre>
              </template>
            </UCollapsible>
          </div>
        </div>

        <p v-else class="text-sm text-toned">
          暂无输出。
        </p>
      </ContainerToolItem>
    </div>

    <template #fallback>
      <div class="w-full h-full flex flex-col sm:flex-row gap-4 overflow-auto">
        <ContainerToolItem label="JavaScript 代码" class="flex-1 overflow-auto" content-class="flex flex-col gap-4 flex-1">
          <div class="flex items-center justify-between gap-4">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-8 w-24 rounded-md" />
          </div>
          <USkeleton class="flex-1 min-h-72 rounded-md" />
        </ContainerToolItem>

        <ContainerToolItem label="控制台输出" class="flex-1 overflow-auto" content-class="flex flex-col gap-4 flex-1">
          <div class="flex flex-col gap-2">
            <div class="border border-default rounded-md p-3 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <USkeleton class="h-5 w-16 rounded-full" />
                <USkeleton class="h-3 w-28" />
              </div>
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-4/5" />
            </div>
            <div class="border border-default rounded-md p-3 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <USkeleton class="h-5 w-20 rounded-full" />
                <USkeleton class="h-3 w-24" />
              </div>
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-3/4" />
            </div>
          </div>
        </ContainerToolItem>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">

</style>
