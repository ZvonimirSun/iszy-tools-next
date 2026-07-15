<script setup lang="ts">
import type { Ipv6UlaResult } from './children/ipv6Ula.service'
import { generateIpv6Ula, generateIpv6UlaFromMac } from './children/ipv6Ula.service'

const subnetCount = ref(8)
const useMacMethod = ref(true)
const macAddress = ref('20:37:06:12:34:56')
const result = ref<Ipv6UlaResult | null>(null)
const errorMessage = ref('')
const { copy } = useCopy()

const subnetText = computed(() => result.value?.subnets.join('\n') ?? '')

function refresh() {
  try {
    errorMessage.value = ''
    result.value = useMacMethod.value
      ? generateIpv6UlaFromMac(macAddress.value, Date.now(), subnetCount.value)
      : generateIpv6Ula(subnetCount.value)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    result.value = null
  }
}

watch(subnetCount, refresh)
watch([useMacMethod, macAddress], refresh)

onMounted(refresh)
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
      <UFormField label="生成方式">
        <USwitch v-model="useMacMethod" label="MAC + 时间戳 SHA-1" class="pt-2" />
      </UFormField>
      <UFormField label="MAC 地址">
        <UInput v-model="macAddress" class="w-full font-mono" :disabled="!useMacMethod" />
      </UFormField>
      <UFormField label="子网示例数量">
        <UInputNumber v-model="subnetCount" class="w-full" :min="1" :max="256" />
      </UFormField>
      <div class="md:col-span-3">
        <UButton color="primary" icon="i-lucide:refresh-cw" @click="refresh">
          重新生成
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <div v-if="result" class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_2rem] sm:items-center">
        <span class="text-sm font-medium text-muted sm:text-right">Global ID</span>
        <UInput :model-value="result.globalId" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(result.globalId)" />

        <span class="text-sm font-medium text-muted sm:text-right">ULA /48</span>
        <UInput :model-value="result.prefix" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(result.prefix)" />

        <span class="text-sm font-medium text-muted sm:text-right">First /64</span>
        <UInput :model-value="result.firstRoutableBlock" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(result.firstRoutableBlock)" />

        <span class="text-sm font-medium text-muted sm:text-right">Last /64</span>
        <UInput :model-value="result.lastRoutableBlock" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(result.lastRoutableBlock)" />
      </div>
    </div>

    <ContainerToolItem label="/64 子网示例">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="subnetText"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="子网示例将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton :disabled="!subnetText" color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(subnetText)">
            复制子网
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
