<script setup lang="ts">
import type { AlgoliaPackageDetail, FlatFileItem } from './cdnQuery.types'

defineProps<{
  pkgData: AlgoliaPackageDetail | null
  pkgID: string
  detailLoading: boolean
  versions: string[]
  version: string
  versionOptions: Array<{ label: string, value: string }>
  defaultFile: string
  flatFiles: FlatFileItem[]
  formatBytes: (value?: number) => string
  createCdnUrl: (path?: string) => string
}>()

const emit = defineEmits<{
  'back': []
  'refresh': [objectID: string]
  'update:version': [value: string]
  'versionChange': []
  'copyLink': [path: string]
  'openLink': [path: string]
}>()
</script>

<template>
  <ContainerToolItem label="包详情">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide:arrow-left"
          @click="emit('back')"
        >
          返回结果
        </UButton>

        <UButton
          v-if="pkgData?.name"
          color="neutral"
          variant="outline"
          icon="i-lucide:package"
          :loading="detailLoading"
          @click="emit('refresh', pkgID)"
        >
          刷新详情
        </UButton>
      </div>

      <div
        v-if="detailLoading"
        class="rounded-md border border-default p-4 text-sm text-muted"
      >
        正在加载包详情...
      </div>

      <div
        v-else-if="pkgData"
        class="flex flex-col gap-2 text-sm"
      >
        <div><b>名称:</b> {{ pkgData.name }}</div>
        <div v-if="pkgData.description">
          <b>简介:</b> {{ pkgData.description }}
        </div>
        <div v-if="pkgData.homepage" class="break-all">
          <b>主页:</b>
          <a :href="pkgData.homepage" target="_blank" rel="noopener noreferrer" class="link">{{ pkgData.homepage }}</a>
        </div>
        <div v-if="pkgData.repository?.url" class="break-all">
          <b>仓库:</b>
          <a :href="pkgData.repository.url" target="_blank" rel="noopener noreferrer" class="link">{{ pkgData.repository.url }}</a>
        </div>
        <div v-if="pkgData.license">
          <b>协议:</b> {{ pkgData.license }}
        </div>
        <div v-if="pkgData.owner?.name">
          <b>作者:</b> {{ pkgData.owner.name }}
        </div>

        <div v-if="versions.length" class="mt-2 flex items-center gap-2">
          <span class="shrink-0"><b>版本:</b></span>
          <USelect
            :model-value="version"
            class="w-56"
            :items="versionOptions"
            @update:model-value="emit('update:version', $event)"
            @change="emit('versionChange')"
          />
        </div>

        <div
          v-if="defaultFile"
          class="mt-2 rounded-md border border-default p-3"
        >
          <div class="mb-2 text-sm">
            <b>默认文件:</b>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <a
              class="link break-all"
              :href="createCdnUrl(defaultFile)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ createCdnUrl(defaultFile) }}
            </a>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="emit('copyLink', defaultFile)"
            >
              复制
            </UButton>
          </div>
        </div>
      </div>

      <div
        v-if="flatFiles.length"
        class="file-list"
      >
        <div class="mb-2 text-sm font-medium">
          文件列表（点击“打开”或“复制链接”）
        </div>
        <div
          v-for="item in flatFiles"
          :key="item.path"
          class="file-row"
          :style="{ paddingLeft: `${item.depth * 18 + 10}px` }"
        >
          <span class="mr-2 text-muted">{{ item.type === 'directory' ? '📁' : '📄' }}</span>
          <span class="flex-1 truncate" :title="item.path">{{ item.path }}</span>
          <span class="w-16 text-right text-xs text-muted">{{ item.type === 'file' ? formatBytes(item.size) : '-' }}</span>
          <div
            v-if="item.type === 'file'"
            class="ml-2 flex gap-1"
          >
            <UButton size="xs" color="neutral" variant="ghost" @click="emit('openLink', item.path)">
              打开
            </UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="emit('copyLink', item.path)">
              复制链接
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </ContainerToolItem>
</template>

<style scoped lang="scss">
.link {
  color: var(--ui-primary);

  &:hover {
    text-decoration: underline;
  }
}

.file-list {
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
  max-height: 26rem;
  overflow: auto;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
}
</style>
