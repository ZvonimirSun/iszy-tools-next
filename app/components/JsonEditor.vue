<script setup lang="ts">
import 'vanilla-jsoneditor'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

const isDark = useIsDark()
</script>

<template>
  <JsonEditorVue
    v-bind="$attrs"
    :class="{
      'jse-theme-dark': isDark,
    }"
  />
</template>
