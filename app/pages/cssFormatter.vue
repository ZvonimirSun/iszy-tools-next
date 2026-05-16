<script setup lang="ts">
const css = import.meta.client
  ? import('~/components/editor/lang-css').then(m => m.default)
  : undefined
</script>

<template>
  <FormatTransformer
    class="w-full h-full overflow-auto"
    :plugin="css"
    target="CSS"
  />
</template>

<style scoped lang="scss">

</style>
