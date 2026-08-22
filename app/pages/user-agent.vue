<script setup lang="ts">
import UAParser from 'ua-parser-js'

const uaInput = ref('')
const parsedResult = computed(() => {
  const ua = uaInput.value.trim()
  if (!ua) {
    return null
  }
  return new UAParser(ua).getResult()
})

function formatNameVersion(name?: string, version?: string) {
  return `${name || '-'} ${version || ''}`.trim()
}

const requestHeaders = useRequestHeaders(['user-agent'])

function useCurrentUa() {
  if (!import.meta.client)
    return
  uaInput.value = navigator.userAgent
}

function clear() {
  uaInput.value = ''
}

if (requestHeaders['user-agent']) {
  uaInput.value = requestHeaders['user-agent']
}

onMounted(() => {
  useCurrentUa()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ContainerToolItem label="User-Agent 字符串">
      <UTextarea
        v-model="uaInput"
        class="w-full"
        :rows="5"
        resize
        placeholder="默认自动读取当前页面 UA，也可手动粘贴任意 UA 字符串..."
      />
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton
        color="primary"
        icon="i-lucide:monitor"
        @click="useCurrentUa"
      >
        使用当前页面 UA
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
    </div>

    <ContainerToolItem label="解析结果">
      <div class="grid gap-2 md:grid-cols-3">
        <UFormField label="浏览器">
          <UInput
            :model-value="parsedResult ? formatNameVersion(parsedResult.browser.name, parsedResult.browser.version) : ''"
            readonly
          />
        </UFormField>
        <UFormField label="渲染引擎">
          <UInput
            :model-value="parsedResult ? formatNameVersion(parsedResult.engine.name, parsedResult.engine.version) : ''"
            readonly
          />
        </UFormField>
        <UFormField label="操作系统">
          <UInput
            :model-value="parsedResult ? formatNameVersion(parsedResult.os.name, parsedResult.os.version) : ''"
            readonly
          />
        </UFormField>
        <UFormField label="CPU 架构">
          <UInput
            :model-value="parsedResult?.cpu.architecture || '-'"
            readonly
          />
        </UFormField>
        <UFormField label="设备类型">
          <UInput
            :model-value="parsedResult?.device.type || 'desktop / unknown'"
            readonly
          />
        </UFormField>
        <UFormField label="设备信息">
          <UInput
            :model-value="parsedResult ? formatNameVersion(parsedResult.device.vendor, parsedResult.device.model) : ''"
            readonly
          />
        </UFormField>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
