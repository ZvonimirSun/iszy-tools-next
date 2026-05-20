<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

type EditorMode = 'source' | 'split' | 'rich'
type ActiveEditor = 'source' | 'rich'
type SourceAction = 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic' | 'strike' | 'inlineCode' | 'bulletList' | 'orderedList' | 'blockquote' | 'codeBlock' | 'horizontalRule'
interface SourceHistoryState {
  value: string
  selectionStart: number
  selectionEnd: number
}

const SAMPLE_MARKDOWN = `# Markdown 编辑器

在左上角打开本地 .md 文件，编辑后可以保存为 Markdown 文件。

- 源码编辑模式直接修改 Markdown 原始文本
- 双栏编辑模式左侧修改源码，右侧直接编辑富文本
- 富文本编辑模式直接编辑渲染后的内容并回写 Markdown
`

const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const sourceEditor = ref<HTMLElement>()
const content = ref(SAMPLE_MARKDOWN)
const fileName = ref('untitled.md')
const mode = ref<EditorMode>('split')
const activeEditor = ref<ActiveEditor>('source')
const sourceUndoStack: SourceHistoryState[] = []
const sourceRedoStack: SourceHistoryState[] = []
const sourceToolbarUndoPending = ref(false)
const activeSourceActions = ref<SourceAction[]>([])

const modeOptions: Array<{ label: string, value: EditorMode, icon: string }> = [
  { label: '源码编辑', value: 'source', icon: 'i-lucide-file-code-2' },
  { label: '双栏编辑', value: 'split', icon: 'i-lucide-columns-2' },
  { label: '富文本编辑', value: 'rich', icon: 'i-lucide-pencil-line' },
]

const sourceToolbarGroups: Array<Array<{ label: string, icon: string, action: SourceAction }>> = [
  [
    { label: '标题 1', icon: 'i-lucide-heading-1', action: 'heading1' },
    { label: '标题 2', icon: 'i-lucide-heading-2', action: 'heading2' },
    { label: '标题 3', icon: 'i-lucide-heading-3', action: 'heading3' },
  ],
  [
    { label: '加粗', icon: 'i-lucide-bold', action: 'bold' },
    { label: '斜体', icon: 'i-lucide-italic', action: 'italic' },
    { label: '删除线', icon: 'i-lucide-strikethrough', action: 'strike' },
    { label: '行内代码', icon: 'i-lucide-code', action: 'inlineCode' },
  ],
  [
    { label: '无序列表', icon: 'i-lucide-list', action: 'bulletList' },
    { label: '有序列表', icon: 'i-lucide-list-ordered', action: 'orderedList' },
    { label: '引用', icon: 'i-lucide-quote', action: 'blockquote' },
    { label: '代码块', icon: 'i-lucide-square-code', action: 'codeBlock' },
    { label: '分割线', icon: 'i-lucide-minus', action: 'horizontalRule' },
  ],
]

const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      label: '段落',
      icon: 'i-lucide-pilcrow',
      items: [
        { label: '正文', kind: 'paragraph', icon: 'i-lucide-pilcrow' },
        { label: '标题 1', kind: 'heading', level: 1, icon: 'i-lucide-heading-1' },
        { label: '标题 2', kind: 'heading', level: 2, icon: 'i-lucide-heading-2' },
        { label: '标题 3', kind: 'heading', level: 3, icon: 'i-lucide-heading-3' },
      ],
    },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: '加粗' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: '斜体' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: '删除线' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: '行内代码' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: '无序列表' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: '有序列表' } },
    { kind: 'blockquote', icon: 'i-lucide-quote', tooltip: { text: '引用' } },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: '代码块' } },
    { kind: 'horizontalRule', icon: 'i-lucide-minus', tooltip: { text: '分割线' } },
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo-2', tooltip: { text: '撤销' } },
    { kind: 'redo', icon: 'i-lucide-redo-2', tooltip: { text: '重做' } },
    { kind: 'clearFormatting', icon: 'i-lucide-eraser', tooltip: { text: '清除格式' } },
  ],
]

const currentFileLabel = computed(() => fileName.value || 'untitled.md')

onMounted(() => {
  document.addEventListener('selectionchange', updateSourceToolbarState)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', updateSourceToolbarState)
})

function chooseFile() {
  fileInput.value?.click()
}

async function openFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  try {
    content.value = await file.text()
    fileName.value = file.name || 'untitled.md'
    mode.value = 'split'
    activeEditor.value = 'source'
    toast.add({
      title: 'Markdown 文件已打开',
      description: fileName.value,
      color: 'success',
    })
  }
  catch {
    toast.add({
      title: '读取文件失败',
      color: 'error',
    })
  }
}

function normalizeFileName(name: string) {
  const trimmed = name.trim() || 'untitled.md'
  return /\.(?:md|markdown)$/i.test(trimmed) ? trimmed : `${trimmed}.md`
}

function saveFile() {
  const targetName = normalizeFileName(fileName.value)
  const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = targetName
  link.click()
  URL.revokeObjectURL(url)
  fileName.value = targetName
}

function updateSource(value: string) {
  activeEditor.value = 'source'
  sourceToolbarUndoPending.value = false
  sourceRedoStack.length = 0
  content.value = value
  nextTick(updateSourceToolbarState)
}

function activateRichEditor() {
  activeEditor.value = 'rich'
}

function updateFromRichEditor(value: string) {
  if (mode.value === 'rich' || activeEditor.value === 'rich') {
    content.value = value
  }
}

function getSourceTextarea() {
  return sourceEditor.value?.querySelector('textarea')
}

function getSourceHistoryState(): SourceHistoryState {
  const textarea = getSourceTextarea()
  if (!textarea) {
    return {
      value: content.value,
      selectionStart: content.value.length,
      selectionEnd: content.value.length,
    }
  }

  return {
    value: textarea.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
  }
}

function restoreSourceState(state: SourceHistoryState) {
  activeEditor.value = 'source'
  content.value = state.value

  nextTick(() => {
    const nextTextarea = getSourceTextarea()
    nextTextarea?.focus()
    nextTextarea?.setSelectionRange(
      state.selectionStart,
      state.selectionEnd,
    )
    updateSourceToolbarState()
  })
}

function onSourceKeydown(event: KeyboardEvent) {
  const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z'
  const isRedo = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))

  if (isUndo && sourceToolbarUndoPending.value && sourceUndoStack.length > 0) {
    event.preventDefault()
    sourceRedoStack.push(getSourceHistoryState())
    restoreSourceState(sourceUndoStack.pop()!)
    sourceToolbarUndoPending.value = false
    return
  }

  if (isRedo && sourceRedoStack.length > 0) {
    event.preventDefault()
    sourceUndoStack.push(getSourceHistoryState())
    restoreSourceState(sourceRedoStack.pop()!)
    sourceToolbarUndoPending.value = true
  }
}

function replaceSourceSelection(insert: string, selectionStart?: number, selectionEnd?: number) {
  activeEditor.value = 'source'
  const before = getSourceHistoryState()
  const start = before.selectionStart
  const end = before.selectionEnd
  const nextValue = `${before.value.slice(0, start)}${insert}${before.value.slice(end)}`

  commitSourceChange(
    before,
    nextValue,
    start + (selectionStart ?? insert.length),
    start + (selectionEnd ?? selectionStart ?? insert.length),
  )
}

function commitSourceChange(before: SourceHistoryState, nextValue: string, selectionStart: number, selectionEnd = selectionStart) {
  activeEditor.value = 'source'

  sourceUndoStack.push(before)
  sourceRedoStack.length = 0
  sourceToolbarUndoPending.value = true
  content.value = nextValue

  nextTick(() => {
    const nextTextarea = getSourceTextarea()
    nextTextarea?.focus()
    nextTextarea?.setSelectionRange(selectionStart, selectionEnd)
    updateSourceToolbarState()
  })
}

function getCurrentSourceLine(value: string, position: number) {
  const lineStart = value.lastIndexOf('\n', Math.max(0, position - 1)) + 1
  const nextLineBreak = value.indexOf('\n', position)
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak

  return {
    line: value.slice(lineStart, lineEnd),
    lineStart,
    lineEnd,
  }
}

function isWrappedSource(value: string, start: number, end: number, prefix: string, suffix = prefix) {
  if (start !== end) {
    return value.slice(start - prefix.length, start) === prefix && value.slice(end, end + suffix.length) === suffix
  }

  const line = getCurrentSourceLine(value, start)
  const relativePosition = start - line.lineStart
  const before = line.line.slice(0, relativePosition)
  const after = line.line.slice(relativePosition)

  return before.lastIndexOf(prefix) > before.lastIndexOf(suffix) && after.includes(suffix)
}

function updateSourceToolbarState() {
  const textarea = getSourceTextarea()
  if (!textarea) {
    activeSourceActions.value = []
    return
  }

  const value = textarea.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const { line, lineStart } = getCurrentSourceLine(value, start)
  const lineBeforeCursor = value.slice(0, lineStart)
  const fenceCountBeforeLine = (lineBeforeCursor.match(/^```/gm) || []).length
  const active: SourceAction[] = []

  if (/^#\s/.test(line)) {
    active.push('heading1')
  }
  else if (/^##\s/.test(line)) {
    active.push('heading2')
  }
  else if (/^###\s/.test(line)) {
    active.push('heading3')
  }

  if (/^\s*[-*+]\s+/.test(line)) {
    active.push('bulletList')
  }
  if (/^\s*\d+\.\s+/.test(line)) {
    active.push('orderedList')
  }
  if (/^\s*>\s?/.test(line)) {
    active.push('blockquote')
  }
  if (/^---\s*$/.test(line)) {
    active.push('horizontalRule')
  }
  if (line.startsWith('```') || fenceCountBeforeLine % 2 === 1) {
    active.push('codeBlock')
  }
  if (isWrappedSource(value, start, end, '**')) {
    active.push('bold')
  }
  if (isWrappedSource(value, start, end, '*') && !isWrappedSource(value, start, end, '**')) {
    active.push('italic')
  }
  if (isWrappedSource(value, start, end, '~~')) {
    active.push('strike')
  }
  if (isWrappedSource(value, start, end, '`')) {
    active.push('inlineCode')
  }

  activeSourceActions.value = active
}

function isSourceActionActive(action: SourceAction) {
  return activeSourceActions.value.includes(action)
}

function getSelectedSource() {
  const textarea = getSourceTextarea()
  const start = textarea?.selectionStart ?? content.value.length
  const end = textarea?.selectionEnd ?? start
  const selected = content.value.slice(start, end)

  return {
    hasSelection: start !== end,
    selected,
  }
}

function wrapSource(prefix: string, suffix = prefix) {
  const before = getSourceHistoryState()
  const markerRange = before.selectionStart !== before.selectionEnd
    ? findSourceMarkerRange(before.value, before.selectionStart, before.selectionEnd, prefix, suffix)
    : findEmptySourceMarkerRange(before.value, before.selectionStart, prefix, suffix)

  if (markerRange) {
    const nextValue = `${before.value.slice(0, markerRange.openStart)}${before.value.slice(markerRange.openEnd, markerRange.closeStart)}${before.value.slice(markerRange.closeEnd)}`
    commitSourceChange(before, nextValue, markerRange.openStart, markerRange.closeStart - prefix.length)
    return
  }

  const { selected, hasSelection } = getSelectedSource()
  const insert = `${prefix}${selected}${suffix}`
  const selectionStart = prefix.length
  const selectionEnd = hasSelection ? prefix.length + selected.length : prefix.length
  replaceSourceSelection(insert, selectionStart, selectionEnd)
}

function findEmptySourceMarkerRange(value: string, position: number, prefix: string, suffix = prefix) {
  const openStart = position - prefix.length
  const closeEnd = position + suffix.length

  if (value.slice(openStart, position) !== prefix || value.slice(position, closeEnd) !== suffix) {
    return undefined
  }

  return {
    openStart,
    openEnd: position,
    closeStart: position,
    closeEnd,
  }
}

function findSourceMarkerRange(value: string, start: number, end: number, prefix: string, suffix = prefix) {
  if (start !== end) {
    const selected = value.slice(start, end)
    if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
      return {
        openStart: start,
        openEnd: start + prefix.length,
        closeStart: end - suffix.length,
        closeEnd: end,
      }
    }

    const openStart = start - prefix.length
    const closeEnd = end + suffix.length

    if (value.slice(openStart, start) === prefix && value.slice(end, closeEnd) === suffix) {
      return {
        openStart,
        openEnd: start,
        closeStart: end,
        closeEnd,
      }
    }
    return undefined
  }

  const line = getCurrentSourceLine(value, start)
  const relativePosition = start - line.lineStart
  const beforeCursor = line.line.slice(0, relativePosition)
  const afterCursor = line.line.slice(relativePosition)
  const openRelativeStart = beforeCursor.lastIndexOf(prefix)
  const closeRelativeOffset = afterCursor.indexOf(suffix)

  if (openRelativeStart === -1 || closeRelativeOffset === -1) {
    return undefined
  }

  const openStart = line.lineStart + openRelativeStart
  const openEnd = openStart + prefix.length
  const closeStart = start + closeRelativeOffset

  if (openEnd > start || closeStart < start) {
    return undefined
  }

  return {
    openStart,
    openEnd,
    closeStart,
    closeEnd: closeStart + suffix.length,
  }
}

function getSelectedSourceLineRange() {
  const before = getSourceHistoryState()
  const startLine = getCurrentSourceLine(before.value, before.selectionStart)
  const endPosition = before.selectionEnd > before.selectionStart && before.value[before.selectionEnd - 1] === '\n'
    ? before.selectionEnd - 1
    : before.selectionEnd
  const endLine = getCurrentSourceLine(before.value, endPosition)

  return {
    before,
    rangeStart: startLine.lineStart,
    rangeEnd: endLine.lineEnd,
    selectedText: before.value.slice(startLine.lineStart, endLine.lineEnd),
  }
}

function toggleSourceLines(
  addPrefix: (line: string, index: number) => string,
  removePattern: RegExp,
  placeholder: string,
) {
  const { before, rangeStart, rangeEnd, selectedText } = getSelectedSourceLineRange()
  const rawLines = selectedText ? selectedText.split('\n') : [placeholder]
  const lines = rawLines.length > 0 ? rawLines : [placeholder]
  const shouldRemove = lines.every(line => line === '' || removePattern.test(line))
  const nextLines = lines.map((line, index) => {
    if (shouldRemove) {
      return line.replace(removePattern, '')
    }

    return addPrefix(line || placeholder, index)
  })
  const nextText = nextLines.join('\n')
  const nextValue = `${before.value.slice(0, rangeStart)}${nextText}${before.value.slice(rangeEnd)}`

  commitSourceChange(before, nextValue, rangeStart, rangeStart + nextText.length)
}

function insertHeading(level: 1 | 2 | 3) {
  const { before, rangeStart, rangeEnd, selectedText } = getSelectedSourceLineRange()
  const prefix = `${'#'.repeat(level)} `
  const lines = (selectedText || '标题').split('\n')
  const sameHeadingPattern = new RegExp(`^#{${level}}\\s+`)
  const nextLines = lines.map((line) => {
    if (sameHeadingPattern.test(line)) {
      return line.replace(/^#{1,6}\s+/, '')
    }
    return `${prefix}${line.replace(/^#{1,6}\s+/, '') || '标题'}`
  })
  const nextText = nextLines.join('\n')
  const nextValue = `${before.value.slice(0, rangeStart)}${nextText}${before.value.slice(rangeEnd)}`

  commitSourceChange(before, nextValue, rangeStart, rangeStart + nextText.length)
}

function insertSourceBlock(before: SourceHistoryState, block: string, selectionStart: number, selectionEnd = selectionStart) {
  const start = before.selectionStart
  const end = before.selectionEnd
  const needsLeadingNewline = start > 0 && before.value[start - 1] !== '\n'
  const needsTrailingNewline = end < before.value.length && before.value[end] !== '\n'
  const leading = needsLeadingNewline ? '\n' : ''
  const trailing = needsTrailingNewline ? '\n' : ''
  const insert = `${leading}${block}${trailing}`
  const nextValue = `${before.value.slice(0, start)}${insert}${before.value.slice(end)}`
  const offset = start + leading.length

  commitSourceChange(before, nextValue, offset + selectionStart, offset + selectionEnd)
}

function toggleCodeBlock() {
  const before = getSourceHistoryState()
  const beforeCursor = before.value.slice(0, before.selectionStart)
  const afterCursor = before.value.slice(before.selectionEnd)
  const openStart = beforeCursor.lastIndexOf('```')
  const closeOffset = afterCursor.indexOf('```')

  if (openStart !== -1 && closeOffset !== -1 && (beforeCursor.match(/^```/gm) || []).length % 2 === 1) {
    const openEnd = before.value.indexOf('\n', openStart) + 1
    const closeStart = before.selectionEnd + closeOffset
    const closeEndLine = before.value.indexOf('\n', closeStart)
    const closeEnd = closeEndLine === -1 ? closeStart + 3 : closeEndLine + 1
    const inner = before.value.slice(openEnd, closeStart).replace(/\n$/, '')
    const nextValue = `${before.value.slice(0, openStart)}${inner}${before.value.slice(closeEnd)}`
    commitSourceChange(before, nextValue, openStart, openStart + inner.length)
    return
  }

  const selected = before.value.slice(before.selectionStart, before.selectionEnd)
  insertSourceBlock(before, `\`\`\`\n${selected}\n\`\`\``, 4, 4 + selected.length)
}

function applySourceAction(action: SourceAction) {
  activeEditor.value = 'source'
  switch (action) {
    case 'heading1':
      insertHeading(1)
      break
    case 'heading2':
      insertHeading(2)
      break
    case 'heading3':
      insertHeading(3)
      break
    case 'bold':
      wrapSource('**')
      break
    case 'italic':
      wrapSource('*')
      break
    case 'strike':
      wrapSource('~~')
      break
    case 'inlineCode':
      wrapSource('`', '`')
      break
    case 'bulletList':
      toggleSourceLines(line => `- ${line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, '')}`, /^\s*[-*+]\s+/, '列表项')
      break
    case 'orderedList':
      toggleSourceLines((line, index) => `${index + 1}. ${line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, '')}`, /^\s*\d+\.\s+/, '列表项')
      break
    case 'blockquote':
      toggleSourceLines(line => `> ${line.replace(/^\s*>\s?/, '')}`, /^\s*>\s?/, '引用')
      break
    case 'codeBlock':
      toggleCodeBlock()
      break
    case 'horizontalRule':
      if (isSourceActionActive('horizontalRule')) {
        toggleSourceLines(line => line, /^---\s*$/, '')
      }
      else {
        insertSourceBlock(getSourceHistoryState(), '---', 3)
      }
      break
  }
}
</script>

<template>
  <div class="flex h-full min-h-[32rem] w-full flex-col gap-4">
    <input
      ref="fileInput"
      type="file"
      accept=".md,.markdown,text/markdown,text/plain"
      class="hidden"
      @change="openFile"
    >

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1">
        <UTooltip text="打开 Markdown 文件">
          <UButton
            icon="i-lucide-folder-open"
            color="neutral"
            variant="outline"
            aria-label="打开 Markdown 文件"
            @click="chooseFile"
          />
        </UTooltip>
        <UTooltip text="保存为 Markdown 文件">
          <UButton
            icon="i-lucide-save"
            color="neutral"
            variant="outline"
            aria-label="保存为 Markdown 文件"
            @click="saveFile"
          />
        </UTooltip>
      </div>

      <UInput
        v-model="fileName"
        class="min-w-52 flex-1 sm:max-w-sm"
        placeholder="untitled.md"
        :aria-label="`当前文件：${currentFileLabel}`"
      />

      <div class="ml-auto flex items-center gap-1">
        <UTooltip
          v-for="item in modeOptions"
          :key="item.value"
          :text="item.label"
        >
          <UButton
            :icon="item.icon"
            color="neutral"
            :variant="mode === item.value ? 'solid' : 'outline'"
            :aria-label="item.label"
            @click="mode = item.value"
          />
        </UTooltip>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden rounded-md border border-default bg-default">
      <div
        v-if="mode === 'source'"
        ref="sourceEditor"
        class="flex h-full min-h-0 flex-col"
        @click="updateSourceToolbarState"
        @keyup.capture="updateSourceToolbarState"
        @mouseup="updateSourceToolbarState"
        @select.capture="updateSourceToolbarState"
      >
        <div class="flex flex-wrap items-center gap-1 border-b border-default bg-default/95 px-3 py-2">
          <template v-for="(group, groupIndex) in sourceToolbarGroups" :key="groupIndex">
            <div class="flex items-center gap-1">
              <UTooltip
                v-for="item in group"
                :key="item.action"
                :text="item.label"
              >
                <UButton
                  :icon="item.icon"
                  :color="isSourceActionActive(item.action) ? 'primary' : 'neutral'"
                  :variant="isSourceActionActive(item.action) ? 'soft' : 'ghost'"
                  size="sm"
                  :aria-label="item.label"
                  @mousedown.prevent
                  @click="applySourceAction(item.action)"
                />
              </UTooltip>
            </div>
            <USeparator
              v-if="groupIndex < sourceToolbarGroups.length - 1"
              orientation="vertical"
              class="mx-1 h-5"
            />
          </template>
        </div>

        <UTextarea
          :model-value="content"
          :rows="24"
          placeholder="输入 Markdown 内容..."
          class="min-h-0 flex-1 font-mono"
          :ui="{
            root: 'flex min-h-0 flex-1',
            base: 'h-full min-h-0 flex-1 resize-none border-0 rounded-none focus-visible:ring-0',
          }"
          @focus="activeEditor = 'source'; nextTick(updateSourceToolbarState)"
          @keydown="onSourceKeydown"
          @update:model-value="updateSource"
        />
      </div>

      <div v-else-if="mode === 'split'" class="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-1">
        <div
          ref="sourceEditor"
          class="flex min-h-0 flex-col border-b border-default md:border-r md:border-b-0"
          @click="updateSourceToolbarState"
          @keyup.capture="updateSourceToolbarState"
          @mouseup="updateSourceToolbarState"
          @select.capture="updateSourceToolbarState"
        >
          <div class="flex flex-wrap items-center gap-1 border-b border-default bg-default/95 px-3 py-2">
            <template v-for="(group, groupIndex) in sourceToolbarGroups" :key="groupIndex">
              <div class="flex items-center gap-1">
                <UTooltip
                  v-for="item in group"
                  :key="item.action"
                  :text="item.label"
                >
                  <UButton
                    :icon="item.icon"
                    :color="isSourceActionActive(item.action) ? 'primary' : 'neutral'"
                    :variant="isSourceActionActive(item.action) ? 'soft' : 'ghost'"
                    size="sm"
                    :aria-label="item.label"
                    @mousedown.prevent
                    @click="applySourceAction(item.action)"
                  />
                </UTooltip>
              </div>
              <USeparator
                v-if="groupIndex < sourceToolbarGroups.length - 1"
                orientation="vertical"
                class="mx-1 h-5"
              />
            </template>
          </div>

          <UTextarea
            :model-value="content"
            :rows="24"
            placeholder="输入 Markdown 内容..."
            class="min-h-0 flex-1 font-mono"
            :ui="{
              root: 'flex min-h-0 flex-1',
              base: 'h-full min-h-0 flex-1 resize-none border-0 rounded-none focus-visible:ring-0',
            }"
            @focus="activeEditor = 'source'; nextTick(updateSourceToolbarState)"
            @keydown="onSourceKeydown"
            @update:model-value="updateSource"
          />
        </div>

        <UEditor
          :model-value="content"
          content-type="markdown"
          placeholder="输入 Markdown 内容..."
          class="flex h-full min-h-0 flex-col overflow-hidden"
          :ui="{
            content: 'h-auto min-h-0 max-w-none flex-1 overflow-auto p-6',
          }"
          :on-focus="activateRichEditor"
          @update:model-value="updateFromRichEditor"
        >
          <template #default="{ editor }">
            <UEditorToolbar
              :editor="editor"
              :items="toolbarItems"
              class="sticky top-0 z-10 shrink-0 border-b border-default bg-default/95 px-3 py-2 backdrop-blur"
            />
          </template>
        </UEditor>
      </div>

      <UEditor
        v-else
        :model-value="content"
        content-type="markdown"
        placeholder="输入 Markdown 内容..."
        class="flex h-full min-h-0 flex-col overflow-hidden"
        :ui="{
          content: 'h-auto min-h-0 max-w-none flex-1 overflow-auto p-6',
        }"
        :on-focus="activateRichEditor"
        @update:model-value="updateFromRichEditor"
      >
        <template #default="{ editor }">
          <UEditorToolbar
            :editor="editor"
            :items="toolbarItems"
            class="sticky top-0 z-10 shrink-0 border-b border-default bg-default/95 px-3 py-2 backdrop-blur"
          />
        </template>
      </UEditor>
    </div>
  </div>
</template>
