<script setup lang="ts">
import js from '~/components/editor/lang-js'

const value = ref('function a(){const b=1;if(b){return c=>c+b}}')

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
      :plugin="js"
      :options="options"
      :input-default="value"
      target="JS"
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
