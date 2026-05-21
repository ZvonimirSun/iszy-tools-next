<script setup lang="ts">
import type { AiChatProviderConfig, AiChatProviderType } from '#shared/types/aiChat'

const chatStore = useAiChatStore()
const toast = useToast()

const selectedConfigId = ref(chatStore.configs[0]?.id || '')
const showApiKeys = ref<Record<string, boolean>>({})

const selectedConfig = computed(() => {
  return chatStore.configs.find(config => config.id === selectedConfigId.value) || chatStore.configs[0] || null
})

watch(() => chatStore.configs.length, () => {
  if (!selectedConfig.value) {
    selectedConfigId.value = chatStore.configs[0]?.id || ''
  }
})

function openNewConfig() {
  const config = chatStore.addConfig(chatStore.createConfigDraft())
  selectedConfigId.value = config.id
}

function removeSelectedConfig() {
  const id = selectedConfig.value?.id
  if (!id) {
    return
  }
  if (!chatStore.removeConfig(id)) {
    toast.add({ title: '至少保留一个配置', color: 'warning' })
    return
  }
  selectedConfigId.value = chatStore.configs[0]?.id || ''
}

function updateConfigType(config: AiChatProviderConfig, type: AiChatProviderType) {
  chatStore.setConfigType(config, type)
}

function setConfigEnabled(config: AiChatProviderConfig, enabled: boolean) {
  chatStore.setConfigEnabled(config, enabled)
  if (enabled && !config.enabled) {
    toast.add({ title: '配置未完整', description: '请先填写 API Key，并至少启用一个有效模型。', color: 'warning' })
  }
}

function getConfigDisplayName(config: AiChatProviderConfig) {
  return config.type === 'deepseek' ? chatStore.getAiChatProviderTypeLabel(config.type) : config.name || chatStore.getAiChatProviderTypeLabel(config.type)
}

function removeModel(config: AiChatProviderConfig, id: string) {
  if (!chatStore.removeModel(config, id)) {
    toast.add({ title: '至少保留一个模型', color: 'warning' })
  }
}
</script>

<template>
  <div class="grid min-h-[32rem] grid-cols-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside class="rounded-lg border border-muted bg-default p-2">
      <div class="mb-2 flex items-center justify-between gap-2 px-2 py-1">
        <span class="text-sm font-medium text-muted">配置源</span>
        <UButton size="xs" color="primary" variant="soft" icon="i-lucide:plus" aria-label="新增配置" @click="openNewConfig" />
      </div>
      <div class="flex flex-col gap-1">
        <button
          v-for="config in chatStore.configs"
          :key="config.id"
          type="button"
          class="rounded-md px-3 py-2 text-left text-sm transition-colors"
          :class="config.id === selectedConfigId ? 'bg-primary/10 text-primary' : 'text-highlighted hover:bg-elevated'"
          @click="selectedConfigId = config.id"
        >
          <span class="block truncate">{{ getConfigDisplayName(config) }}</span>
          <span class="flex items-center gap-1 truncate text-xs text-muted">
            <span class="truncate">{{ chatStore.getAiChatProviderTypeLabel(config.type) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ config.enabled ? '已启用' : '未启用' }}</span>
          </span>
        </button>
      </div>
    </aside>

    <section v-if="selectedConfig" class="flex min-w-0 flex-col gap-4">
      <div class="rounded-lg border border-muted bg-elevated/50 p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h5 class="font-medium text-highlighted">
              {{ getConfigDisplayName(selectedConfig) }}
            </h5>
            <p class="text-sm text-muted">
              {{ chatStore.getAiChatProviderTypeLabel(selectedConfig.type) }}
            </p>
          </div>
          <UButton
            size="sm"
            color="error"
            variant="ghost"
            icon="i-lucide:trash-2"
            @click="removeSelectedConfig"
          >
            删除配置
          </UButton>
        </div>

        <UForm :state="selectedConfig" class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <UFormField label="启用配置">
            <USwitch
              :model-value="selectedConfig.enabled"
              @update:model-value="setConfigEnabled(selectedConfig, Boolean($event))"
            />
          </UFormField>
          <UFormField label="配置类型">
            <USelect
              :model-value="selectedConfig.type"
              :items="chatStore.providerTypeOptions"
              class="w-full"
              @update:model-value="updateConfigType(selectedConfig, $event as AiChatProviderType)"
            />
          </UFormField>
          <UFormField v-if="selectedConfig.type === 'openai-compatible'" label="配置名称">
            <UInput v-model="selectedConfig.name" class="w-full" />
          </UFormField>
          <UFormField v-if="selectedConfig.type === 'openai-compatible'" label="API 地址" class="md:col-span-2">
            <UInput v-model="selectedConfig.apiBaseUrl" class="w-full" placeholder="https://api.openai.com/v1" />
          </UFormField>
          <UFormField label="API Key" class="md:col-span-2">
            <UInput
              v-model="selectedConfig.apiKey"
              class="w-full"
              :type="showApiKeys[selectedConfig.id] ? 'text' : 'password'"
              placeholder="sk-..."
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showApiKeys[selectedConfig.id] ? 'i-lucide:eye-off' : 'i-lucide:eye'"
                  :aria-label="showApiKeys[selectedConfig.id] ? '隐藏 API Key' : '显示 API Key'"
                  @click="showApiKeys[selectedConfig.id] = !showApiKeys[selectedConfig.id]"
                />
              </template>
            </UInput>
          </UFormField>
        </UForm>
      </div>

      <div class="rounded-lg border border-muted bg-elevated/50 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h5 class="font-medium text-highlighted">
            模型
          </h5>
          <UButton size="sm" color="neutral" variant="outline" icon="i-lucide:plus" @click="chatStore.addModel(selectedConfig)">
            添加模型
          </UButton>
        </div>

        <div class="flex flex-col gap-3">
          <div
            v-for="model in selectedConfig.models"
            :key="model.id"
            class="grid grid-cols-1 gap-3 rounded-lg border border-muted bg-default p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
          >
            <UFormField label="展示名称">
              <UInput v-model="model.name" class="w-full" placeholder="DeepSeek Chat" />
            </UFormField>
            <UFormField label="模型 ID">
              <UInput v-model="model.model" class="w-full" placeholder="deepseek-chat" />
            </UFormField>
            <UFormField label="启用">
              <USwitch
                :model-value="model.enabled"
                @update:model-value="chatStore.setModelEnabled(model, Boolean($event))"
              />
            </UFormField>
            <div class="flex items-end">
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide:trash-2"
                aria-label="删除模型"
                @click="removeModel(selectedConfig, model.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
