<script setup lang="ts">
import css from '~/components/editor/lang-css'
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
