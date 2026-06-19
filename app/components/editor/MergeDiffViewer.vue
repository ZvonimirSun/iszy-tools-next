<script setup lang="ts">
import type { DiffOptions } from '~/pages/text-diff/children/textDiff.service'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { MergeView } from '@codemirror/merge'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { createCodeMirrorChanges } from '~/pages/text-diff/children/textDiff.service'
import mini from './lang-mini'

const props = withDefaults(defineProps<{
  leftText: string
  rightText: string
  diffOptions?: DiffOptions
  showEqualLines?: boolean
}>(), {
  diffOptions: () => ({}),
  showEqualLines: true,
})

const container = ref<HTMLDivElement>()
const isDark = useIsDark()
let mergeView: MergeView | undefined

function createExtensions() {
  return [
    mini.extensions,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
    EditorView.lineWrapping,
    isDark.value ? oneDark : EditorView.theme({}, { dark: false }),
    isDark.value ? oneDark : syntaxHighlighting(defaultHighlightStyle),
  ]
}

function destroyMergeView() {
  mergeView?.destroy()
  mergeView = undefined
}

async function renderMergeView() {
  await nextTick()
  if (!container.value) {
    return
  }

  destroyMergeView()
  container.value.replaceChildren()

  mergeView = new MergeView({
    a: {
      doc: props.leftText,
      extensions: createExtensions(),
    },
    b: {
      doc: props.rightText,
      extensions: createExtensions(),
    },
    parent: container.value,
    highlightChanges: true,
    gutter: true,
    collapseUnchanged: props.showEqualLines
      ? undefined
      : {
          margin: 3,
          minSize: 4,
        },
    diffConfig: {
      scanLimit: 3000,
      timeout: 1000,
      override: (leftValue, rightValue) => createCodeMirrorChanges(leftValue, rightValue, props.diffOptions),
    },
  })
}

onMounted(renderMergeView)
onUnmounted(destroyMergeView)

watch(() => [
  props.leftText,
  props.rightText,
  props.diffOptions.ignoreWhitespace,
  props.diffOptions.ignoreCase,
  props.showEqualLines,
  isDark.value,
], renderMergeView)
</script>

<template>
  <div
    ref="container"
    class="merge-diff-viewer min-h-96 overflow-auto rounded-lg border border-muted"
  />
</template>

<style scoped lang="scss">
.merge-diff-viewer {
  :deep(.cm-mergeView) {
    min-height: 24rem;
    overflow: auto;
  }

  :deep(.cm-mergeViewEditors) {
    min-width: 48rem;
  }

  :deep(.cm-editor) {
    min-height: 24rem;
  }

  :deep(.cm-focused) {
    outline: none;
  }
}
</style>
