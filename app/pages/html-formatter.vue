<script setup lang="ts">
import html from '~/components/editor/lang-html'

definePageMeta({ layout: 'bounded' })

const value = ref('<div><h1>a</h1><p>b</p><ul><li>c</li></ul></div>')
</script>

<template>
  <FormatTransformer
    class="h-full w-full overflow-auto"
    :plugin="html"
    :input-default="value"
    target="HTML"
  />
</template>
