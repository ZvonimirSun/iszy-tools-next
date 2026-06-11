<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { JsonEditorMode } from '~/stores/jsonEditor'
import { downloadBlob } from '~/utils/common'
import {
  createDownloadName,
  estimateTextSize,
  formatBytes,
  recordContentToEditorValue,
  valueToStoreValue,
  valueToText,
} from './jsonEditor.utils'

const props = defineProps<{
  side: 'left' | 'right'
}>()

const toast = useToast()
const store = useJsonEditorStore()
const fileInput = useTemplateRef('fileInput')
const editorValue = shallowRef<unknown>('')
const indentation = ref(2)
const indentationDraft = ref(2)
const recentOpen = ref(false)
const propertyOpen = ref(false)
const indentationOpen = ref(false)
const deleteConfirmOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)
const nameInput = useTemplateRef('nameInput')
const keyword = ref('')
const draftName = ref('')
const editingName = ref(false)
let applyingRecord = false

const sideFlag = computed(() => {
  return props.side === 'left' ? { left: true } : { right: true }
})
const activeId = computed({
  get() {
    return props.side === 'left' ? store.leftId : store.rightId
  },
  set(id: string | null) {
    if (props.side === 'left') {
      store.leftId = id
    }
    else {
      store.rightId = id
    }
  },
})
const activeRecord = computed(() => {
  return activeId.value ? store.data(activeId.value) : null
})
const activeMode = computed<JsonEditorMode>({
  get() {
    return props.side === 'left' ? store.leftMode : store.rightMode
  },
  set(mode) {
    if (props.side === 'left') {
      store.leftMode = mode
    }
    else {
      store.rightMode = mode
    }
  },
})
const recordList = computed(() => store.dataList(keyword.value))
const contentKind = computed(() => {
  if (!activeRecord.value) {
    return '未保存'
  }

  return typeof activeRecord.value.content.text === 'string' ? '字符串' : 'JSON'
})
const estimatedSize = computed(() => {
  return formatBytes(estimateTextSize(valueToText(editorValue.value, indentation.value)))
})
const openMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: '打开最近记录',
      icon: 'i-lucide:clock',
      onSelect() {
        recentOpen.value = true
      },
    },
    {
      label: '打开本地文件',
      icon: 'i-lucide:file-up',
      onSelect() {
        fileInput.value?.click()
      },
    },
  ],
])
const optionMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: '调整缩进',
      icon: 'i-lucide:indent-increase',
      onSelect() {
        indentationDraft.value = indentation.value
        indentationOpen.value = true
      },
    },
    {
      label: '文档属性',
      icon: 'i-lucide:info',
      onSelect() {
        propertyOpen.value = true
      },
    },
    {
      label: '删除文档',
      icon: 'i-lucide:trash-2',
      color: 'error',
      disabled: !activeId.value,
      onSelect() {
        openDeleteConfirm()
      },
    },
  ],
])

watch(activeId, () => {
  applyActiveRecord()
})

onMounted(() => {
  applyActiveRecord()
})

function applyActiveRecord() {
  applyingRecord = true
  editorValue.value = recordContentToEditorValue(activeRecord.value?.content)
  indentation.value = activeRecord.value?.indentation ?? 2
  indentationDraft.value = indentation.value
  nextTick(() => {
    applyingRecord = false
  })
}

function handleEditorUpdate(value: unknown) {
  editorValue.value = value
  if (!applyingRecord) {
    saveCurrentContentToStore(value)
  }
}

function saveCurrentContentToStore(value = editorValue.value) {
  const id = store.saveData({
    ...sideFlag.value,
    id: activeId.value || undefined,
    content: valueToStoreValue(value),
    indentation: indentation.value,
  })
  if (id) {
    activeId.value = id
  }
}

function createNewRecord() {
  activeId.value = null
  editorValue.value = ''
  indentation.value = 2
  indentationDraft.value = 2
}

function startRename() {
  if (!activeRecord.value) {
    return
  }

  draftName.value = activeRecord.value.name
  editingName.value = true
  nextTick(() => {
    nameInput.value?.inputRef?.focus()
    nameInput.value?.inputRef?.select()
  })
}

function renameRecord() {
  const name = draftName.value.trim()
  if (!activeId.value) {
    editingName.value = false
    return
  }

  if (!name) {
    draftName.value = activeRecord.value?.name || ''
    editingName.value = false
    return
  }

  store.saveData({
    ...sideFlag.value,
    id: activeId.value,
    name,
  })
  editingName.value = false
}

function cancelRename() {
  draftName.value = activeRecord.value?.name || ''
  editingName.value = false
}

function openRecord(id: string) {
  store.saveData({
    ...sideFlag.value,
    id,
  })
  recentOpen.value = false
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  const text = await file.text()
  const id = store.saveData({
    ...sideFlag.value,
    content: text,
    name: file.name,
    indentation: indentation.value,
  })
  if (id) {
    activeId.value = id
  }
  toast.add({
    color: 'success',
    title: '已打开本地文件',
  })
}

function downloadCurrentContent() {
  const text = valueToText(editorValue.value, indentation.value)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, createDownloadName(activeRecord.value?.name))
}

function updateIndentation() {
  indentation.value = indentationDraft.value
  if (activeId.value) {
    store.saveData({
      ...sideFlag.value,
      id: activeId.value,
      indentation: indentation.value,
    })
  }
  indentationOpen.value = false
}

function openDeleteConfirm(id = activeId.value) {
  if (!id) {
    return
  }

  pendingDeleteId.value = id
  deleteConfirmOpen.value = true
}

async function deletePendingRecord() {
  if (!pendingDeleteId.value) {
    return
  }

  const deletedActiveRecord = pendingDeleteId.value === activeId.value
  await store.deleteData({ id: pendingDeleteId.value })
  if (deletedActiveRecord) {
    editorValue.value = ''
  }
  pendingDeleteId.value = null
  deleteConfirmOpen.value = false
  toast.add({
    color: 'success',
    title: '文档已删除',
  })
}
</script>

<template>
  <section class="json-editor-pane flex min-h-0 flex-col overflow-hidden rounded-lg border border-muted bg-default">
    <header class="flex shrink-0 items-center gap-2 bg-primary px-2 py-2 text-inverted">
      <UTooltip text="新建文档">
        <UButton
          icon="i-lucide:file-plus-2"
          color="primary"
          variant="ghost"
          class="cursor-pointer text-inverted hover:bg-white/15 active:bg-white/20"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}新建`"
          @click="createNewRecord"
        />
      </UTooltip>

      <div class="min-w-0 flex-1">
        <UInput
          v-if="editingName"
          ref="nameInput"
          v-model="draftName"
          size="sm"
          class="w-full max-w-60"
          :ui="{ base: 'bg-white/15 text-inverted placeholder:text-inverted/60 ring-white/30 focus-visible:ring-white/70' }"
          @blur="renameRecord"
          @keydown.enter.prevent="renameRecord"
          @keydown.esc.prevent="cancelRename"
        />
        <UTooltip v-else :text="activeRecord ? '修改文档名称' : '编辑内容后会自动创建文档'">
          <button
            type="button"
            class="flex max-w-full items-center gap-1 rounded-md px-1 text-left text-sm font-medium text-inverted outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-inverted/70 disabled:cursor-default"
            :class="{ 'cursor-pointer': activeRecord }"
            :disabled="!activeRecord"
            :title="activeRecord ? '修改文档名称' : '编辑内容后会自动创建文档'"
            @click="startRename"
          >
            <span class="truncate">{{ activeRecord?.name || '未命名文档' }}</span>
            <UIcon v-if="activeRecord" name="i-lucide:pencil" class="size-3.5 shrink-0 text-inverted/75" />
          </button>
        </UTooltip>
      </div>

      <UTooltip text="打开文档">
        <UDropdownMenu :items="openMenuItems">
          <UButton
            icon="i-lucide:folder-open"
            color="primary"
            variant="ghost"
            class="cursor-pointer text-inverted hover:bg-white/15 active:bg-white/20"
            aria-label="打开"
          />
        </UDropdownMenu>
      </UTooltip>

      <UTooltip text="保存为文本文件">
        <UButton
          icon="i-lucide:save"
          color="primary"
          variant="ghost"
          class="cursor-pointer text-inverted hover:bg-white/15 active:bg-white/20"
          aria-label="保存为文本文件"
          @click="downloadCurrentContent"
        />
      </UTooltip>

      <UTooltip text="文档选项">
        <UDropdownMenu :items="optionMenuItems">
          <UButton
            icon="i-lucide:settings-2"
            color="primary"
            variant="ghost"
            class="cursor-pointer text-inverted hover:bg-white/15 active:bg-white/20"
            aria-label="选项"
          />
        </UDropdownMenu>
      </UTooltip>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleFileChange"
      >
    </header>

    <JsonEditor
      :model-value="editorValue"
      :mode="activeMode"
      class="min-h-0 flex-1"
      :indentation="indentation"
      @update:model-value="handleEditorUpdate"
      @update:mode="activeMode = $event"
    />

    <UModal v-model:open="recentOpen" title="打开最近记录" :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <div class="flex max-h-[70vh] flex-col gap-3">
          <UInput
            v-model="keyword"
            icon="i-lucide:search"
            placeholder="搜索记录"
          />
          <div class="min-h-0 overflow-auto rounded-md border border-muted">
            <div
              v-for="item in recordList"
              :key="item._id"
              class="flex w-full items-center justify-between gap-3 border-b border-muted px-3 py-2 text-left last:border-b-0 hover:bg-elevated"
            >
              <button
                type="button"
                class="min-w-0 flex flex-1 cursor-pointer items-center justify-between gap-3 text-left"
                @click="openRecord(item._id)"
              >
                <span class="min-w-0 flex-1 truncate text-sm text-highlighted">{{ item.name }}</span>
                <span class="shrink-0 text-xs text-dimmed">{{ item.updated }}</span>
              </button>
              <UTooltip text="删除文档">
                <UButton
                  icon="i-lucide:trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer"
                  aria-label="删除文档"
                  @click.stop="openDeleteConfirm(item._id)"
                />
              </UTooltip>
            </div>
            <div v-if="recordList.length === 0" class="px-3 py-8 text-center text-sm text-dimmed">
              暂无记录
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="indentationOpen" title="调整缩进">
      <template #body>
        <UFormField label="空格数">
          <UInputNumber
            v-model="indentationDraft"
            class="w-full"
            :min="0"
            :max="10"
            :step="1"
            :step-strictly="true"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="indentationOpen = false">
            取消
          </UButton>
          <UButton color="primary" @click="updateIndentation">
            确认
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="propertyOpen" title="文档属性">
      <template #body>
        <dl class="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
          <dt class="text-dimmed">
            名称
          </dt>
          <dd class="truncate text-highlighted">
            {{ activeRecord?.name || '未命名文档' }}
          </dd>
          <dt class="text-dimmed">
            更新时间
          </dt>
          <dd class="text-highlighted">
            {{ activeRecord?.updated || '-' }}
          </dd>
          <dt class="text-dimmed">
            内容类型
          </dt>
          <dd class="text-highlighted">
            {{ contentKind }}
          </dd>
          <dt class="text-dimmed">
            估算大小
          </dt>
          <dd class="text-highlighted">
            {{ estimatedSize }}
          </dd>
        </dl>
      </template>
    </UModal>

    <UModal v-model:open="deleteConfirmOpen" title="删除文档">
      <template #body>
        <p class="text-sm text-muted">
          确认删除「{{ pendingDeleteId ? store.data(pendingDeleteId)?.name : activeRecord?.name || '未命名文档' }}」？
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="deleteConfirmOpen = false">
            取消
          </UButton>
          <UButton color="error" @click="deletePendingRecord">
            删除
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
