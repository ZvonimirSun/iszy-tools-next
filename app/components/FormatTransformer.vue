<script setup lang="ts">
import type { EditorPlugin } from '#shared/types/editor'
import type { FormError } from '#ui/types'
import { EditorMini } from '#components'
import { identity } from 'lodash-es'

const props = withDefaults(
  defineProps<{
    plugin: EditorPlugin
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

defineEmits<{
  (e: 'format', data: string): void
}>()

const { plugin, inputDefault } = toRefs(props)

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
const state = reactive({
  input: inputDefault.value,
})
const formatter = props.plugin.formatter || identity<string>
const isValid = props.plugin.isValid || (() => true)

const valid = computed(() => isValid(state.input))

watch(inputDefault, (val) => {
  state.input = val
})
watch([valid, () => props.options, editor, state], () => {
  if (valid.value) {
    editor.value?.setInput(formatter(state.input, props.options))
  }
  else {
    editor.value?.setInput('')
  }
}, {
  deep: true,
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
    class="w-full flex gap-4"
    :state="state"
    :validate="validate"
  >
    <UFormField :label="_inputLabel" name="input" class="flex-1">
      <UTextarea
        v-model="state.input"
        class="w-full"
        :placeholder="_inputPlaceholder"
        :rows="20"
      />
    </UFormField>
    <UFormField :label="_outputLabel" class="flex-1">
      <EditorMini
        ref="editor"
        :plugin="plugin"
        :readonly="true"
      />
    </uformfield>
  </UForm>
</template>
