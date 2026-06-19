<script setup lang="ts">
import js from '~/components/editor/lang-js'

const value = ref('function a(){const b=1;if(b){return c=>c+b}}')
</script>

<template>
  <FormatTransformer
    class="h-full w-full overflow-auto"
    :plugin="js"
    :input-default="value"
    target="JS"
  />
</template>
