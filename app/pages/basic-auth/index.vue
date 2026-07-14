<script setup lang="ts">
import { createBasicAuthHeader, createBasicAuthToken } from './children/basicAuth.service'

const username = ref('admin')
const password = ref('secret')
const { copy } = useCopy()

const token = computed(() => createBasicAuthToken({
  username: username.value,
  password: password.value,
}))
const header = computed(() => createBasicAuthHeader({
  username: username.value,
  password: password.value,
}))
const curlExample = computed(() => `curl -H '${header.value}' https://api.example.com/resource`)

function clear() {
  username.value = ''
  password.value = ''
}

function fillExample() {
  username.value = 'admin'
  password.value = 'secret'
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="用户名">
          <UInput
            v-model="username"
            class="w-full"
            autofocus
            autocomplete="off"
            placeholder="username"
          />
        </UFormField>
        <UFormField label="密码">
          <UInput
            v-model="password"
            class="w-full"
            type="password"
            autocomplete="off"
            placeholder="password"
          />
        </UFormField>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
          示例
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
          清空
        </UButton>
      </div>
    </div>

    <UAlert
      color="neutral"
      variant="soft"
      icon="i-lucide:shield-alert"
      title="仅在浏览器本地生成，不会保存用户名和密码。"
    />

    <ContainerToolItem label="Authorization Header">
      <div class="grid gap-2">
        <UTextarea
          :model-value="header"
          class="w-full font-mono"
          :rows="2"
          readonly
        />
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(header)"
          >
            复制 Header
          </UButton>
        </div>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="Base64 Token">
      <div class="grid gap-2">
        <UInput :model-value="token" class="w-full font-mono" readonly />
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(token)"
          >
            复制 Token
          </UButton>
        </div>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="cURL 示例">
      <div class="grid gap-2">
        <UTextarea
          :model-value="curlExample"
          class="w-full font-mono"
          :rows="2"
          readonly
        />
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(curlExample)"
          >
            复制示例
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
