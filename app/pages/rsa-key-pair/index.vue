<script setup lang="ts">
import type { RsaKeyPairOptions, RsaKeyPairResult } from './children/rsaKeyPair.service'
import { generateRsaKeyPair } from './children/rsaKeyPair.service'

const modulusLength = ref<RsaKeyPairOptions['modulusLength']>(2048)
const loading = ref(false)
const errorMessage = ref('')
const result = ref<RsaKeyPairResult | null>(null)
const { copy } = useCopy()

const modulusOptions = [
  { label: '1024 bit（仅测试）', value: 1024 },
  { label: '2048 bit', value: 2048 },
  { label: '3072 bit', value: 3072 },
  { label: '4096 bit', value: 4096 },
]

async function generate() {
  loading.value = true
  errorMessage.value = ''

  try {
    result.value = await generateRsaKeyPair({ modulusLength: modulusLength.value })
  }
  catch (error) {
    result.value = null
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  generate()
})
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <UAlert
      color="neutral"
      variant="soft"
      icon="i-lucide:shield-alert"
      title="密钥仅在浏览器本地生成，不会上传或保存。"
    />

    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <UFormField label="密钥长度">
        <USelect v-model="modulusLength" :items="modulusOptions" class="w-full" />
      </UFormField>
      <UButton color="primary" icon="i-lucide:key-round" :loading="loading" @click="generate">
        生成密钥
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <div class="grid gap-4 xl:grid-cols-2">
      <ContainerToolItem label="Public Key">
        <div class="flex flex-col gap-2">
          <UTextarea
            :model-value="result?.publicKey ?? ''"
            class="w-full font-mono"
            :rows="14"
            resize
            readonly
            placeholder="公钥将显示在这里..."
          />
          <div class="flex justify-end">
            <UButton
              :disabled="!result?.publicKey"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(result?.publicKey ?? '')"
            >
              复制公钥
            </UButton>
          </div>
        </div>
      </ContainerToolItem>

      <ContainerToolItem label="Private Key">
        <div class="flex flex-col gap-2">
          <UTextarea
            :model-value="result?.privateKey ?? ''"
            class="w-full font-mono"
            :rows="14"
            resize
            readonly
            placeholder="私钥将显示在这里..."
          />
          <div class="flex justify-end">
            <UButton
              :disabled="!result?.privateKey"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(result?.privateKey ?? '')"
            >
              复制私钥
            </UButton>
          </div>
        </div>
      </ContainerToolItem>
    </div>
  </div>
</template>
