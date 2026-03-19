<script setup lang="ts">
import Css from '~/components/editor/lang-css'
</script>

<template>
  <FormatTransformer
    class="w-full h-full overflow-auto"
    :plugin="Css"
    target="CSS"
  />
</template>

<style scoped lang="scss">

</style>
