<script setup lang="ts">
import xml from '@/components/editor/lang-xml'

const value = ref('<hello><world>foo</world><world>bar</world></hello>')

const options = reactive({
  collapseContent: true,
  indent: 2,
})
</script>

<template>
  <div class="code-container">
    <div
      class="w-full flex flex-col items-center gap-4"
    >
      <div
        class="flex items-center gap-4"
      >
        <span>
          折叠内容
        </span>
        <USwitch
          v-model="options.collapseContent"
          size="lg"
        />
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
        class="w-full"
        :plugin="xml"
        :options="options"
        :input-default="value"
        input-label="你的XML内容"
        input-placeholder="在这里粘贴XML内容..."
        output-label="格式化后的XML内容"
        invalid-message="请输入正确的XML内容"
      />
    </div>
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

  & > :last-child {
    flex: 1;
    width: 100%;
  }
}
</style>
