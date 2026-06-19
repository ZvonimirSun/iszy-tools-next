<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { EditorPlugin } from '#shared/types/editor'
import { EditorMini } from '#components'

type MaybePromise<T> = T | Promise<T>

const props = withDefaults(
  defineProps<{
    plugin?: MaybePromise<EditorPlugin>
    target?: string
    inputLabel?: string
    inputDefault?: string
    inputPlaceholder?: string
    invalidMessage?: string
    outputLabel?: string
    options?: Record<string, any>
  }>(),
  {
    target: '',
    inputLabel: '输入',
    inputDefault: '',
    inputPlaceholder: '输入...',
    invalidMessage: '请输入正确的内容',
    outputLabel: '输出',
    options: () => ({}),
  },
)

const emits = defineEmits<{
  (e: 'format', data: string): void
}>()

const { plugin, inputDefault } = toRefs(props)
const resolvedPlugin = shallowRef<EditorPlugin>()

const { _inputLabel, _inputPlaceholder, _invalidMessage, _outputLabel } = props.target
  ? {
      _inputLabel: `你的${props.target}内容`,
      _inputPlaceholder: `在这里粘贴${props.target}内容...`,
      _invalidMessage: `请输入正确的${props.target}内容`,
      _outputLabel: `格式化后的${props.target}内容`,
    }
  : {
      _inputLabel: props.inputLabel,
      _inputPlaceholder: props.inputPlaceholder,
      _invalidMessage: props.invalidMessage,
      _outputLabel: props.outputLabel,
    }
const editor = useComponentRef(EditorMini)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const { copy } = useCopy()
const state = reactive({
  input: inputDefault.value,
  indent: Number(props.options.indent ?? 2),
})
const formatter = computed(() => resolvedPlugin.value?.formatter || identity<string>)
const compactor = computed(() => resolvedPlugin.value?.compactor)
const hasCompactor = computed(() => typeof compactor.value === 'function')
const isValid = computed(() => resolvedPlugin.value?.isValid || (() => true))

const valid = computed(() => isValid.value(state.input))
const toolbarOptions = computed(() => ({
  ...props.options,
  indent: state.indent,
}))
const output = ref('')

function updateOutput(value: string) {
  output.value = value
  editor.value?.setInput(value)
}

function formatInput() {
  if (valid.value) {
    const result = formatter.value(state.input, toolbarOptions.value)
    updateOutput(result)
    emits('format', result)
  }
  else {
    updateOutput('')
  }
}

function compactInput() {
  if (!compactor.value) {
    return
  }

  if (valid.value) {
    const result = compactor.value(state.input, toolbarOptions.value)
    updateOutput(result)
    emits('format', result)
  }
  else {
    updateOutput('')
  }
}

function copyOutput() {
  if (output.value) {
    copy(output.value)
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

async function readFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  state.input = await file.text()
  updateOutput('')
}

watch(inputDefault, (val) => {
  state.input = val
  updateOutput('')
})
watch(plugin, async (val) => {
  if (import.meta.server && val instanceof Promise) {
    return
  }
  resolvedPlugin.value = await val
}, {
  immediate: true,
})
watch(() => props.options.indent, (val) => {
  const nextIndent = Number(val)
  if (Number.isFinite(nextIndent)) {
    state.indent = nextIndent
  }
})

function validate(): FormError[] {
  const errors = []
  if (!valid.value) {
    errors.push({
      name: 'input',
      message: _invalidMessage,
    })
  }
  return errors
}
</script>

<template>
  <UForm
    class="flex w-full flex-col gap-3"
    :state="state"
    :validate="validate"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide:file-up" color="neutral" variant="soft" @click="openFilePicker">
          选择文件
        </UButton>
        <UButton icon="i-lucide:wand-sparkles" color="primary" @click="formatInput">
          格式化
        </UButton>
        <UButton v-if="hasCompactor" icon="i-lucide:minimize-2" color="neutral" variant="outline" @click="compactInput">
          压缩
        </UButton>
        <UButton icon="i-lucide:copy" color="neutral" variant="outline" :disabled="!output" @click="copyOutput">
          复制
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <UInputNumber
          v-model="state.indent"
          class="w-24"
          :min="0"
          :max="10"
          :step="1"
        />
        <span class="text-sm text-muted">空格</span>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="readFile"
      >
    </div>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
      <UFormField :label="_inputLabel" name="input" class="flex min-w-0 flex-col">
        <UTextarea
          v-model="state.input"
          class="w-full flex-1 font-mono"
          :placeholder="_inputPlaceholder"
          :rows="20"
        />
      </UFormField>
      <UFormField
        :label="_outputLabel"
        class="flex min-w-0 flex-col"
        :ui="{
          container: 'flex-1 overflow-auto',
        }"
      >
        <EditorMini
          ref="editor"
          :plugin="resolvedPlugin"
          :readonly="true"
        />
      </UFormField>
    </div>
  </UForm>
</template>
