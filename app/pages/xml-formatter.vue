<script setup lang="ts">
import xml from '~/components/editor/lang-xml'

const value = ref('<hello><world>foo</world><world>bar</world></hello>')

const options = reactive({
  collapseContent: true,
})
</script>

<template>
  <div class="flex h-full w-full flex-col gap-3">
    <div class="flex items-center gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <span class="text-sm text-muted">折叠内容</span>
      <USwitch v-model="options.collapseContent" />
    </div>
    <FormatTransformer
      class="min-h-0 flex-1 overflow-auto"
      :plugin="xml"
      :options="options"
      :input-default="value"
      input-label="你的XML内容"
      input-placeholder="在这里粘贴XML内容..."
      output-label="格式化后的XML内容"
      invalid-message="请输入正确的XML内容"
    />
  </div>
</template>
