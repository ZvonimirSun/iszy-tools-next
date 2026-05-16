<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import type { EditorPlugin } from '#shared/types/editor'
import { redo, redoDepth, undo, undoDepth } from '@codemirror/commands'
import basic from './lang-basic'
import EditorMini from './Mini.vue'

const props = withDefaults(defineProps<{
  inputDefault?: string
  plugin?: EditorPlugin
  placeholder?: string
  readonly?: boolean
}>(), {
  inputDefault: '',
  plugin: undefined,
  placeholder: '',
  readonly: false,
})
const emits = defineEmits<{
  (e: 'change', v: string): void
}>()
defineExpose({
  getView,
  setInput,
})

interface Control {
  title: string
  event: () => void
  isDisabled?: () => boolean
  icon: string
}

const editor = useComponentRef(EditorMini)
let cm: EditorView | undefined
const hasUndo = ref(false)
const hasRedo = ref(false)

const newPlugin = computed<EditorPlugin>(() => ({
  ...props.plugin,
  miniExtensions: undefined,
  extensions: [
    basic.extensions,
    ...(props.plugin?.extensions || []),
  ],
}))

const controls = computed(() => {
  const tmp: Control[][] = reactive([
    [
      {
        title: '撤销',
        isDisabled: () => !hasUndo.value,
        event: function undoBtn() {
          const view = getView()
          if (!hasUndo.value || !view)
            return
          undo(view)
        },
        icon: 'i-fa6-solid:arrow-rotate-left',
      },
      {
        title: '重做',
        isDisabled: () => !hasRedo.value,
        event: function redoBtn() {
          const view = getView()
          if (!hasRedo.value || !view)
            return
          redo(view)
        },
        icon: 'i-fa6-solid:arrow-rotate-right',
      },
    ],
  ])
  const formatControls: Control[] = []
  if (props.plugin?.formatter) {
    formatControls.push({
      title: '格式化',
      event: function formatBtn() {
        if (!props.plugin?.formatter) {
          return
        }
        try {
          const view = getView()
          if (!view) {
            return
          }
          const currentValue = view.state.doc.toString()
          const val = props.plugin.formatter(currentValue)
          if (val && val !== currentValue) {
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: val },
            })
          }
        }
        catch (e) {
        }
      },
      icon: 'i-custom:format',
    })
  }
  if (props.plugin?.compactor) {
    formatControls.push({
      title: '压缩',
      event: function compactBtn() {
        if (!props.plugin?.compactor) {
          return
        }
        try {
          const view = getView()
          if (!view) {
            return
          }
          const currentValue = view.state.doc.toString()
          const val = props.plugin.compactor(currentValue)
          if (val && val !== currentValue) {
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: val },
            })
          }
        }
        catch (e) {
        }
      },
      icon: 'i-custom:compact',
    })
  }
  if (formatControls.length) {
    tmp.unshift(formatControls)
  }
  return tmp
})

onMounted(() => {
  if (!editor.value) {
    return
  }
  cm = editor.value.getView()
})

function onChange(val: string) {
  const view = getView()
  if (view) {
    hasUndo.value = undoDepth(view.state) > 0
    hasRedo.value = redoDepth(view.state) > 0
  }
  emits('change', val)
}

function getView() {
  cm = editor.value?.getView()
  return cm
}

function setInput(val: string) {
  editor.value?.setInput(val)
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex bg-primary w-full h-8 items-center">
      <template
        v-for="(group, i) in controls"
        :key="`divider${i}`"
      >
        <USeparator
          v-if="i !== 0"
          orientation="vertical"
          class="h-1/2"
          :ui="{
            border: 'border-white',
          }"
        />
        <UButton
          v-for="(btn, j) in group"
          :key="`btn${i}${j}`"
          :icon="btn.icon"
          :title="btn.title"
          variant="solid"
          class="cursor-pointer text-white"
          :disabled="btn.isDisabled?.()"
          @click="btn.event"
        />
      </template>
    </div>
    <EditorMini
      ref="editor"
      :input-default="inputDefault"
      :placeholder="placeholder"
      :plugin="newPlugin"
      :readonly="readonly"
      class="flex-1"
      @change="onChange"
    />
  </div>
</template>
