<script setup lang="ts">
import type { SettingObject } from './children/palServerSettings.types'
import { downloadBlob } from '~/utils/common'
import { getEmptySettings, iniToSettings, settingsToIni } from './children/palServerSettings.service'

const toast = useToast()
const { copy } = useCopy()

const settings = ref<SettingObject[]>(getEmptySettings())
const importedFileName = ref('')
const errorMessage = ref('')

const generatedIni = computed(() => settingsToIni(settings.value))

function getSingleFile(file: File | File[] | null | undefined) {
  return Array.isArray(file) ? file[0] : file
}

async function importIni(file: File | File[] | null | undefined) {
  const iniFile = getSingleFile(file)
  errorMessage.value = ''

  if (!iniFile)
    return

  if (!iniFile.name.toLowerCase().endsWith('.ini')) {
    errorMessage.value = '请选择 .ini 配置文件'
    return
  }

  try {
    const text = await iniFile.text()
    settings.value = iniToSettings(text)
    importedFileName.value = iniFile.name
    toast.add({ title: '解析成功', color: 'success' })
  }
  catch (error) {
    errorMessage.value = (error as Error).message || '解析失败，请确认文件格式是否正确'
  }
}

function resetSettings() {
  settings.value = getEmptySettings()
  importedFileName.value = ''
  errorMessage.value = ''
}

function downloadIni() {
  const blob = new Blob([generatedIni.value], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, 'PalWorldSettings.ini')
}

async function copyIni() {
  await copy(generatedIni.value)
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4">
    <ContainerToolItem label="配置操作" content-class="flex flex-col gap-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <UFileUpload
          v-slot="{ open }"
          :model-value="undefined"
          :reset="true"
          :multiple="false"
          accept=".ini"
          @update:model-value="importIni"
        >
          <button
            type="button"
            class="flex w-full min-w-0 items-center gap-3 rounded-lg border border-muted bg-default px-3 py-2 text-left transition-colors hover:bg-elevated/50 cursor-pointer lg:w-96"
            @click="open()"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-elevated text-toned">
              <UIcon name="i-lucide:file-up" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-highlighted">
                {{ importedFileName || '解析 PalWorldSettings.ini' }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-muted">
                可导入现有配置后继续编辑
              </span>
            </span>
          </button>
        </UFileUpload>

        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:rotate-ccw"
            @click="resetSettings"
          >
            恢复默认
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copyIni"
          >
            复制配置
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide:download"
            @click="downloadIni"
          >
            下载配置
          </UButton>
        </div>
      </div>
    </ContainerToolItem>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <div class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <ContainerToolItem label="服务器参数" class="min-h-0" content-class="min-h-0 overflow-auto">
        <div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <UFormField
            v-for="setting in settings"
            :key="setting.key"
            :label="setting.label"
            :help="setting.key"
          >
            <UInputNumber
              v-if="setting.type === 'number'"
              v-model="setting.default"
              class="w-full"
              orientation="vertical"
              :min="setting.min"
              :max="setting.max"
              :step="setting.default !== undefined && Math.abs(setting.default) < 10 ? 0.1 : 1"
            />

            <USwitch
              v-else-if="setting.type === 'switch'"
              v-model="setting.default"
            />

            <USelect
              v-else-if="setting.type === 'select'"
              v-model="setting.default"
              class="w-full"
              :items="setting.options"
            />

            <UInput
              v-else
              v-model="setting.default"
              class="w-full"
            />
          </UFormField>
        </div>
      </ContainerToolItem>

      <ContainerToolItem label="生成结果" class="min-h-0" content-class="flex h-full min-h-0 flex-col gap-3">
        <UTextarea
          :model-value="generatedIni"
          class="min-h-0 flex-1"
          textarea-class="h-full font-mono text-xs"
          readonly
          resize
        />
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copyIni"
          >
            复制
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide:download"
            @click="downloadIni"
          >
            下载
          </UButton>
        </div>
      </ContainerToolItem>
    </div>
  </div>
</template>
