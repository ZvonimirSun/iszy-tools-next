<script setup lang="ts">
import type { ViewUpdate } from '@codemirror/view'
import type { EditorPlugin } from '#shared/types/editor'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, placeholder as PlaceHolder } from '@codemirror/view'
import mini from './lang-mini'

const props = withDefaults(defineProps<{
  inputDefault?: string
  plugin?: EditorPlugin | Promise<EditorPlugin>
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
  (e: 'ready'): void
}>()

const isDark = useIsDark()

defineExpose({
  getView,
  setInput,
})

const editor = ref<HTMLDivElement>()
let cm: EditorView
let pendingInput: string | undefined
const themeCompartment = new Compartment()
const highLightCompartment = new Compartment()

onMounted(async () => {
  const plugin = await props.plugin
  const extensions = [
    mini.extensions,
    plugin ? plugin.miniExtensions || plugin.extensions : [],
    EditorView.updateListener.of(onChange),
    themeCompartment.of(isDark.value ? oneDark : EditorView.theme({}, { dark: false })),
    highLightCompartment.of(isDark.value ? oneDark : syntaxHighlighting(defaultHighlightStyle)),
  ]
  if (props.placeholder) {
    extensions.push(PlaceHolder(props.placeholder))
  }
  if (props.readonly) {
    extensions.push(EditorState.readOnly.of(true))
  }
  cm = new EditorView({
    state: EditorState.create({
      extensions,
      doc: props.inputDefault,
    }),
    parent: editor.value,
  })
  if (pendingInput !== undefined) {
    setInput(pendingInput)
    pendingInput = undefined
  }
  emits('ready')
})

onUnmounted(() => {
  cm?.destroy()
})

watch(isDark, (val) => {
  cm.dispatch({
    effects: [
      themeCompartment.reconfigure(val ? oneDark : EditorView.theme({}, { dark: false })),
      highLightCompartment.reconfigure(val ? oneDark : syntaxHighlighting(defaultHighlightStyle)),
    ],
  })
})

function onChange(update: ViewUpdate) {
  if (update.docChanged) {
    emits('change', update.state.doc.toString())
  }
}

function setInput(val: string) {
  if (!cm) {
    pendingInput = val
    return
  }
  cm.dispatch({
    changes: {
      from: 0,
      to: cm.state.doc.length,
      insert: val,
    },
  })
}

function getView(): EditorView {
  return cm
}
</script>

<template>
  <div
    ref="editor"
    class="editor w-full"
  />
</template>

<style scoped lang="scss">
:deep(.cm-editor) {
  max-height: none;
  border: none;
  height: 100%;

  &.cm-focused {
    outline: none;
  }
}

.editor {
  border: 1px solid var(--ui-primary);
  overflow: auto;
  display: block;
  box-sizing: border-box;
}
</style>
