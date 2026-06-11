<script setup lang="ts">
import type { ImgHostingConfig } from './imgHosting.d'
import { createDefaultConfig, getUploader, getUploaderOptions, validateConfig } from './imgHosting.service'

const store = useImgHostingStore()
const toast = useToast()

// 通用设置
const commonConfig = store.commonConfig

const copyFormatType = ref<'standard' | 'markdown' | 'custom'>('standard')
const customContent = ref('$url')

function initCopyFormat() {
  switch (commonConfig.customCopyContent) {
    case '$url':
      copyFormatType.value = 'standard'
      break
    case '![]($url)':
      copyFormatType.value = 'markdown'
      break
    default:
      copyFormatType.value = 'custom'
      customContent.value = commonConfig.customCopyContent
      break
  }
}

function updateCopyFormat(val: string | number | boolean) {
  switch (val) {
    case 'standard':
      commonConfig.customCopyContent = '$url'
      break
    case 'markdown':
      commonConfig.customCopyContent = '![]($url)'
      break
    case 'custom':
      commonConfig.customCopyContent = customContent.value
      break
  }
}

watch(customContent, (val) => {
  if (copyFormatType.value === 'custom') {
    commonConfig.customCopyContent = val
  }
})

// 存储配置管理
const editingId = ref<string | null>(null)
const isNew = ref(false)
const draft = reactive<ImgHostingConfig>(createDefaultConfig('aliyun'))
const showPassword: Record<string, boolean> = reactive({})

function togglePassword(field: string) {
  showPassword[field] = !showPassword[field]
}

function startAdd() {
  Object.assign(draft, createDefaultConfig('aliyun'))
  editingId.value = draft.id
  isNew.value = true
}

function startEdit(config: ImgHostingConfig) {
  editingId.value = config.id
  isNew.value = false
  Object.assign(draft, {
    id: config.id,
    type: config.type,
    name: config.name,
    config: { ...config.config },
  })
}

function cancelEdit() {
  editingId.value = null
}

function saveConfig() {
  if (!draft.name.trim()) {
    draft.name = getUploader(draft.type)?.name ?? draft.type
  }
  const { valid, errors } = validateConfig(draft)
  if (!valid) {
    toast.add({ title: errors[0], color: 'error' })
    return
  }
  if (isNew.value) {
    store.addConfig({ ...draft, id: draft.id, config: { ...draft.config } })
  }
  else {
    store.updateConfig(draft.id, { ...draft, config: { ...draft.config } })
  }
  toast.add({ title: '配置已保存' })
  cancelEdit()
}

function deleteConfig(id: string) {
  store.removeConfig(id)
  if (editingId.value === id) {
    cancelEdit()
  }
  toast.add({ title: '配置已删除' })
}

function onTypeChange() {
  draft.config = {}
  const newUploader = getUploader(draft.type)
  const newDefaultName = newUploader?.name ?? draft.type
  // 如果名称为空或仍是某个 uploader 的默认名称，则自动更新为新类型名称
  const isDefaultName = !draft.name || getUploaderOptions().some(opt => opt.label === draft.name)
  if (isDefaultName) {
    draft.name = newDefaultName
  }
}

/** 当前编辑类型对应的 uploader */
const activeUploader = computed(() => getUploader(draft.type))
/** 字段列表（含 required / optional） */
const activeFields = computed(() => activeUploader.value?.fields ?? [])
/** required 字段 key 集合（用于模板判断） */
const requiredFieldKeys = computed(() =>
  new Set(activeUploader.value?.fields.filter(f => f.required).map(f => f.key) ?? []),
)

/** 根据 type 获取显示名称 */
function getUploaderName(type: string): string {
  return getUploader(type)?.name ?? type
}

const isEditing = computed(() => editingId.value !== null)

onMounted(() => {
  initCopyFormat()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 通用配置 -->
    <ContainerToolItem label="通用配置">
      <div class="grid gap-4">
        <div class="flex items-center justify-between">
          <span class="text-sm">时间戳重命名</span>
          <USwitch v-model="commonConfig.renameTimeStamp" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm">上传后自动复制 URL</span>
          <USwitch v-model="commonConfig.copyUrlAfterUpload" />
        </div>

        <USeparator />

        <div>
          <span class="text-sm font-medium">链接复制格式</span>
          <div class="mt-2 flex flex-col gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="copyFormatType"
                type="radio"
                value="standard"
                class="sr-only"
                @change="updateCopyFormat('standard')"
              >
              <span
                class="size-4 rounded-full border-2 flex items-center justify-center"
                :class="copyFormatType === 'standard' ? 'border-primary' : 'border-muted'"
              >
                <span v-if="copyFormatType === 'standard'" class="size-2 rounded-full bg-primary" />
              </span>
              <span class="text-sm">标准</span>
              <code class="text-xs bg-muted/50 px-1 rounded">$url</code>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="copyFormatType"
                type="radio"
                value="markdown"
                class="sr-only"
                @change="updateCopyFormat('markdown')"
              >
              <span
                class="size-4 rounded-full border-2 flex items-center justify-center"
                :class="copyFormatType === 'markdown' ? 'border-primary' : 'border-muted'"
              >
                <span v-if="copyFormatType === 'markdown'" class="size-2 rounded-full bg-primary" />
              </span>
              <span class="text-sm">Markdown</span>
              <code class="text-xs bg-muted/50 px-1 rounded">![]($url)</code>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="copyFormatType"
                type="radio"
                value="custom"
                class="sr-only"
                @change="updateCopyFormat('custom')"
              >
              <span
                class="size-4 rounded-full border-2 flex items-center justify-center"
                :class="copyFormatType === 'custom' ? 'border-primary' : 'border-muted'"
              >
                <span v-if="copyFormatType === 'custom'" class="size-2 rounded-full bg-primary" />
              </span>
              <span class="text-sm">自定义</span>
              <UInput
                v-model="customContent"
                size="xs"
                class="w-36"
              />
            </label>
          </div>
        </div>
      </div>
    </ContainerToolItem>

    <USeparator />

    <!-- 存储配置管理 -->
    <ContainerToolItem label="存储配置">
      <div class="flex flex-col gap-4">
        <!-- 当前激活配置选择 -->
        <div v-if="store.hasConfigs" class="flex items-center gap-3">
          <span class="text-sm text-toned shrink-0">当前使用：</span>
          <USelect
            :model-value="store.activeConfigId ?? undefined"
            :items="store.configOptions"
            class="w-full max-w-72"
            @update:model-value="(v: string) => store.setActiveConfig(v)"
          />
        </div>
        <div v-else class="text-sm text-toned">
          暂无存储配置，请点击下方按钮添加。
        </div>

        <!-- 配置列表 -->
        <div class="border border-muted rounded-lg">
          <div
            v-for="config in store.configs"
            :key="config.id"
            class="flex items-center justify-between py-2.5 px-4 border-b border-muted last:border-b-0 hover:bg-muted/30 transition-colors"
            :class="{ 'bg-primary/5': editingId === config.id }"
          >
            <div class="min-w-0 flex-1 cursor-pointer" @click="startEdit(config)">
              <div class="text-sm font-medium truncate">
                {{ config.name || '未命名' }}
              </div>
              <div class="text-xs text-toned">
                {{ getUploaderName(config.type) }}
                <span v-if="config.id === store.activeConfigId" class="ml-1 text-primary">● 使用中</span>
              </div>
            </div>
            <div class="flex items-center gap-1 ml-2">
              <UButton
                icon="i-lucide:pencil"
                size="xs"
                color="neutral"
                variant="link"
                @click="startEdit(config)"
              />
              <UButton
                icon="i-lucide:trash-2"
                size="xs"
                color="error"
                variant="link"
                @click="deleteConfig(config.id)"
              />
            </div>
          </div>
          <div v-if="!store.hasConfigs" class="py-6 text-center text-sm text-toned">
            暂无配置
          </div>
        </div>

        <UButton
          v-if="!isEditing"
          icon="i-lucide:plus"
          size="sm"
          color="primary"
          variant="soft"
          @click="startAdd"
        >
          添加配置
        </UButton>
      </div>
    </ContainerToolItem>

    <!-- 编辑表单 -->
    <div v-if="isEditing" class="border border-muted rounded-lg">
      <div class="py-2.5 px-4 border-b border-muted bg-muted/30">
        <span class="text-sm font-semibold">{{ isNew ? '添加新配置' : '编辑配置' }}</span>
      </div>
      <div class="p-4">
        <UForm class="grid gap-3">
          <UFormField label="配置名称">
            <UInput v-model="draft.name" placeholder="例如：我的阿里云OSS" class="w-full" />
          </UFormField>

          <UFormField label="存储类型" required>
            <USelect
              v-model="draft.type"
              :items="getUploaderOptions()"
              class="w-full"
              @update:model-value="onTypeChange()"
            />
          </UFormField>

          <USeparator />

          <UFormField
            v-for="field in activeFields"
            :key="field.key"
            :label="field.label"
            :required="requiredFieldKeys.has(field.key)"
          >
            <UInput
              v-model="draft.config[field.key]"
              :type="field.secret ? (showPassword[field.key] ? 'text' : 'password') : 'text'"
              :placeholder="field.hint || ''"
              class="w-full"
            >
              <template v-if="field.secret" #trailing>
                <UButton
                  :icon="showPassword[field.key] ? 'i-lucide:eye-off' : 'i-lucide:eye'"
                  size="xs"
                  color="neutral"
                  variant="link"
                  @click="togglePassword(field.key)"
                />
              </template>
            </UInput>
          </UFormField>
        </UForm>

        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" variant="outline" @click="cancelEdit">
            取消
          </UButton>
          <UButton color="primary" @click="saveConfig">
            保存
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
