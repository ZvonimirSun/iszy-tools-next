<script setup lang="ts">
const clearText = ref('')
const encoding = ref('Hex')
const encodingOptions = [
  {
    label: 'Binary (base 2)',
    value: 'Bin',
  },
  {
    label: 'Hexadecimal (base 16)',
    value: 'Hex',
  },
  {
    label: 'Base64 (base 64)',
    value: 'Base64',
  },
  {
    label: 'Base64url (base 64 with url safe chars)',
    value: 'Base64url',
  },
]
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <span>待计算的内容</span>
    <UTextarea
      v-model="clearText"
      class="w-full h-full"
      resize
      textarea-class="h-full"
      placeholder="请输入要计算的文本..."
    />
    <span>Digest 编码</span>
    <USelect v-model="encoding" :items="encodingOptions" />
    <ContainerToolItem label="结果">
      <ClientOnly>
        <HashTextResult :value="clearText" :encoding="encoding" />
      </ClientOnly>
    </ContainerToolItem>
  </div>
</template>
