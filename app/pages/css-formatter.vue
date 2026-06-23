<script setup lang="ts">
import css from '~/components/editor/lang-css'
</script>

<template>
  <FormatTransformer
    class="h-full w-full overflow-auto"
    :plugin="css"
    target="CSS"
  />
</template>
