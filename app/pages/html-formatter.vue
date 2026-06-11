<script setup lang="ts">
import html from '~/components/editor/lang-html'

const value = ref('<div><h1>a</h1><p>b</p><ul><li>c</li></ul></div>')

const options = reactive({
  indent: 2,
})
</script>

<template>
  <div class="code-container">
    <div class="flex items-center gap-4">
      <span>
        缩进大小
      </span>
      <UInputNumber
        v-model="options.indent"
        class="w-32"
        :min="0"
        :max="10"
        :step="1"
        :step-strictly="true"
      />
    </div>
    <FormatTransformer
      class="w-full flex-1 overflow-auto"
      :plugin="html"
      :options="options"
      :input-default="value"
      target="HTML"
    />
  </div>
</template>

<style scoped lang="scss">
.code-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .8rem;
}
</style>
