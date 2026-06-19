<script setup lang="ts">
import yaml from '~/components/editor/lang-yaml'

definePageMeta({ layout: 'bounded' })

const value = ref('a:\n - b: 1\n   c: true\n - b: 2\n   c: false\n')
</script>

<template>
  <FormatTransformer
    class="h-full w-full overflow-auto"
    :plugin="yaml"
    :input-default="value"
    input-label="你的YAML内容"
    input-placeholder="在这里粘贴YAML内容..."
    output-label="格式化后的YAML内容"
    invalid-message="请输入正确的YAML内容"
  />
</template>
