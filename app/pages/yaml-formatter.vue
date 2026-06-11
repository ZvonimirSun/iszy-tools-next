<script setup lang="ts">
import yaml from '~/components/editor/lang-yaml'

const value = ref('a:\n - b: 1\n   c: true\n - b: 2\n   c: false\n')

const options = reactive({
  indent: 2,
})
</script>

<template>
  <div class="code-container">
    <div class="flex items-center gap-4">
      <span>
        缩进大小
      </span>
      <UInputNumber
        v-model="options.indent"
        class="w-32"
        :min="2"
        :max="10"
        :step="1"
        :step-strictly="true"
      />
    </div>
    <FormatTransformer
      class="w-full flex-1 overflow-auto"
      :plugin="yaml"
      :options="options"
      :input-default="value"
      input-label="你的YAML内容"
      input-placeholder="在这里粘贴YAML内容..."
      output-label="格式化后的YAML内容"
      invalid-message="请输入正确的YAML内容"
    />
  </div>
</template>

<style scoped lang="scss">
.code-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .8rem;
}
</style>
