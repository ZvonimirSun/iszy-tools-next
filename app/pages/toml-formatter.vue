<script setup lang="ts">
import toml from '~/components/editor/lang-toml'

definePageMeta({ layout: 'bounded' })

const value = ref('a={b=1,c=true}\n[[d]]\nb=2\nc=false\n')
</script>

<template>
  <FormatTransformer
    class="w-full h-full overflow-auto"
    :plugin="toml"
    :input-default="value"
    input-label="你的TOML内容"
    input-placeholder="在这里粘贴TOML内容..."
    output-label="格式化后的TOML内容"
    invalid-message="请输入正确的TOML内容"
  />
</template>
