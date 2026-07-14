<script setup lang="ts">
import { calculateIpv4Range } from './children/ipv4Range.service'

const startIp = ref('192.168.1.1')
const endIp = ref('192.168.1.128')
const previewLimit = ref(128)
const { copy } = useCopy()

const result = computed(() => {
  try {
    return {
      error: '',
      value: calculateIpv4Range(startIp.value, endIp.value, previewLimit.value),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      value: null,
    }
  }
})

const cidrText = computed(() => result.value.value?.cidrs.join('\n') ?? '')
const previewText = computed(() => result.value.value?.preview.join('\n') ?? '')

function fillExample() {
  startIp.value = '192.168.1.1'
  endIp.value = '192.168.1.128'
  previewLimit.value = 128
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-3">
      <UFormField label="起始 IPv4">
        <UInput v-model="startIp" class="w-full font-mono" autofocus placeholder="192.168.1.1" />
      </UFormField>
      <UFormField label="结束 IPv4">
        <UInput v-model="endIp" class="w-full font-mono" placeholder="192.168.1.128" />
      </UFormField>
      <UFormField label="预览上限">
        <UInputNumber v-model="previewLimit" class="w-full" :min="0" :max="4096" />
      </UFormField>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
        示例
      </UButton>
    </div>

    <UAlert
      v-if="result.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="result.error"
    />

    <template v-else-if="result.value">
      <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted">
            规范起始
          </p>
          <p class="font-mono text-lg font-semibold">
            {{ result.value.start }}
          </p>
        </div>
        <div>
          <p class="text-xs text-muted">
            规范结束
          </p>
          <p class="font-mono text-lg font-semibold">
            {{ result.value.end }}
          </p>
        </div>
        <div>
          <p class="text-xs text-muted">
            地址数量
          </p>
          <p class="font-mono text-lg font-semibold">
            {{ result.value.total.toLocaleString('zh-CN') }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <ContainerToolItem label="CIDR 覆盖">
          <div class="flex flex-col gap-2">
            <UTextarea
              :model-value="cidrText"
              class="w-full font-mono"
              :rows="10"
              resize
              readonly
            />
            <div class="flex justify-end">
              <UButton :disabled="!cidrText" color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(cidrText)">
                复制 CIDR
              </UButton>
            </div>
          </div>
        </ContainerToolItem>

        <ContainerToolItem label="地址预览">
          <div class="flex flex-col gap-2">
            <UTextarea
              :model-value="previewText"
              class="w-full font-mono"
              :rows="10"
              resize
              readonly
            />
            <UAlert
              v-if="result.value.truncated"
              color="warning"
              variant="soft"
              icon="i-lucide:triangle-alert"
              title="地址列表已按预览上限截断。"
            />
            <div class="flex justify-end">
              <UButton :disabled="!previewText" color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(previewText)">
                复制预览
              </UButton>
            </div>
          </div>
        </ContainerToolItem>
      </div>
    </template>
  </div>
</template>
