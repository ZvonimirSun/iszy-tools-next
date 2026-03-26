<script setup lang="ts">
const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const { copy } = useCopy()

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function encode() {
  errorMessage.value = ''
  try {
    outputText.value = encodeGeoHash(inputText.value)
  }
  catch (error) {
    outputText.value = ''
    errorMessage.value = `编码失败，${getErrorMessage(error)}`
  }
}

function decode() {
  errorMessage.value = ''
  try {
    const { latitude, longitude } = decodeGeoHash(inputText.value)
    outputText.value = `${latitude},${longitude}`
  }
  catch (error) {
    outputText.value = ''
    errorMessage.value = `解码失败，${getErrorMessage(error)}`
  }
}

function exchange() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  errorMessage.value = ''
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <ContainerToolItem label="输入内容">
      <UTextarea
        v-model="inputText"
        class="w-full"
        :rows="5"
        resize
        placeholder="请输入要进行 GeoHash 编码或解码的字符"
      />
    </ContainerToolItem>

    <div class="flex gap-2 flex-wrap">
      <UButton color="primary" @click="encode">
        编码 (Encode)
      </UButton>
      <UButton @click="decode">
        解码 (Decode)
      </UButton>
      <UButton color="neutral" variant="outline" @click="exchange">
        ↕交换
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <ContainerToolItem label="结果">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full"
          :rows="5"
          resize
          readonly
          placeholder="GeoHash 编码或解码的结果"
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制结果
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
