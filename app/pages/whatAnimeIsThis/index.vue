<script setup lang="ts">
import type { TraceMoeQuota, TraceMoeRateLimit, TraceMoeResult } from './children/traceMoe.types'
import { fetchTraceMoeQuota, searchTraceMoeByFile } from './children/traceMoe.service'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const toast = useToast()

const selectedFile = ref<File>()
const previewUrl = ref('')
const quota = ref<TraceMoeQuota>()
const rateLimit = ref<TraceMoeRateLimit>()
const results = ref<TraceMoeResult[]>([])
const errorMessage = ref('')
const isCheckingQuota = ref(false)
const isSearching = ref(false)

const quotaTotal = computed(() => toFiniteNumber(quota.value?.quota))
const quotaUsed = computed(() => toFiniteNumber(quota.value?.quotaUsed))
const quotaRemainingCount = computed(() => {
  if (quotaTotal.value <= 0)
    return undefined
  return Math.max(0, quotaTotal.value - quotaUsed.value)
})
const isQuotaExhausted = computed(() => quotaRemainingCount.value !== undefined && quotaRemainingCount.value <= 0)
const canSearch = computed(() => !!selectedFile.value && !isSearching.value && !isQuotaExhausted.value)

const quotaRemaining = computed(() => {
  if (!quota.value)
    return ''
  if (quotaRemainingCount.value === undefined)
    return '按公开接口限流'
  return String(quotaRemainingCount.value)
})

const rateLimitText = computed(() => {
  if (!rateLimit.value?.remaining)
    return ''
  const reset = rateLimit.value.reset ? `，约 ${rateLimit.value.reset}s 后刷新` : ''
  return `本分钟剩余 ${rateLimit.value.remaining}/${rateLimit.value.limit || '?'}${reset}`
})

function getSingleFile(file: File | File[] | null | undefined) {
  return Array.isArray(file) ? file[0] : file
}

function toFiniteNumber(value: number | string | null | undefined) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function revokePreviewUrl() {
  if (!previewUrl.value)
    return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function formatFileSize(size: number) {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 ** 2)
    return `${(size / 1024).toFixed(2)} KB`
  return `${(size / 1024 ** 2).toFixed(2)} MB`
}

function formatSecond(seconds?: number) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds))
    return '-'

  const hour = Math.floor(seconds / 3600)
  const minute = Math.floor((seconds % 3600) / 60)
  const second = seconds % 60
  const secondText = second.toFixed(2).padStart(5, '0')

  return `${hour}:${String(minute).padStart(2, '0')}:${secondText}`
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

function getTitle(item: TraceMoeResult) {
  const title = item.anilist?.title
  return title?.chinese || title?.native || title?.romaji || title?.english || '未知作品'
}

function getSubtitle(item: TraceMoeResult) {
  const title = item.anilist?.title
  const names = [title?.romaji, title?.english].filter(Boolean)
  return names.join(' / ')
}

function getEpisodeText(episode?: number | string) {
  if (episode === undefined || episode === null || episode === '')
    return '-'
  return `EP ${episode}`
}

async function refreshQuota(showError = false) {
  isCheckingQuota.value = true
  try {
    quota.value = await fetchTraceMoeQuota()
  }
  catch (error) {
    if (showError)
      toast.add({ title: (error as Error).message || '配额查询失败', color: 'error' })
  }
  finally {
    isCheckingQuota.value = false
  }
}

function selectImage(file: File | File[] | null | undefined) {
  const imageFile = getSingleFile(file)
  errorMessage.value = ''
  results.value = []
  rateLimit.value = undefined
  revokePreviewUrl()

  if (!imageFile) {
    selectedFile.value = undefined
    return
  }

  if (!imageFile.type.startsWith('image/')) {
    selectedFile.value = undefined
    errorMessage.value = '请选择图片文件'
    return
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    selectedFile.value = undefined
    errorMessage.value = '图片大小不能超过 10MB'
    return
  }

  selectedFile.value = imageFile
  previewUrl.value = URL.createObjectURL(imageFile)
}

async function searchAnime() {
  if (!selectedFile.value)
    return

  isSearching.value = true
  errorMessage.value = ''
  results.value = []

  try {
    const response = await searchTraceMoeByFile(selectedFile.value)
    results.value = response.data.result || []
    rateLimit.value = response.rateLimit
    await refreshQuota()

    if (results.value.length === 0)
      errorMessage.value = '没有找到匹配结果'
  }
  catch (error) {
    errorMessage.value = (error as Error).message || '识别失败，请稍后重试'
  }
  finally {
    isSearching.value = false
  }
}

function clearAll() {
  selectedFile.value = undefined
  results.value = []
  rateLimit.value = undefined
  errorMessage.value = ''
  revokePreviewUrl()
}

onMounted(() => {
  refreshQuota()
})

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="截图识别" content-class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="neutral" variant="subtle">
          trace.moe
        </UBadge>
        <UBadge color="neutral" variant="subtle">
          用户ID：{{ quota?.id || '-' }}
        </UBadge>
        <UBadge :color="quotaRemaining === '0' ? 'warning' : 'neutral'" variant="subtle">
          剩余：{{ isCheckingQuota ? '查询中' : quotaRemaining || '-' }}
        </UBadge>
        <UBadge v-if="rateLimitText" color="neutral" variant="subtle">
          {{ rateLimitText }}
        </UBadge>
      </div>

      <UAlert
        v-if="isQuotaExhausted"
        color="warning"
        variant="soft"
        title="当前 trace.moe 配额已用完，请稍后再试。"
        icon="i-lucide:triangle-alert"
      />

      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <UFileUpload
          v-slot="{ open }"
          :model-value="undefined"
          :reset="true"
          :multiple="false"
          accept="image/*"
          @update:model-value="selectImage"
        >
          <button
            type="button"
            class="flex w-full min-w-0 items-center gap-3 rounded-lg border border-muted bg-default px-3 py-2 text-left transition-colors hover:bg-elevated/50 cursor-pointer md:w-96"
            @click="open()"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-elevated text-toned">
              <UIcon name="i-lucide:image-up" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-highlighted">
                {{ selectedFile ? selectedFile.name : '选择动漫截图' }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-muted">
                {{ selectedFile ? formatFileSize(selectedFile.size) : '单张图片，最大 10MB' }}
              </span>
            </span>
          </button>
        </UFileUpload>

        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:rotate-cw"
            :loading="isCheckingQuota"
            @click="refreshQuota(true)"
          >
            刷新配额
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:trash-2"
            :disabled="!selectedFile && results.length === 0"
            @click="clearAll"
          >
            清空
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide:search"
            :disabled="!canSearch"
            :loading="isSearching"
            @click="searchAnime"
          >
            开始识别
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

    <div
      v-if="previewUrl"
      class="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]"
    >
      <ContainerToolItem label="图片预览" content-class="flex justify-center bg-default rounded-lg p-3">
        <img
          :src="previewUrl"
          :alt="selectedFile?.name || 'preview'"
          class="max-h-[22rem] max-w-full rounded-md object-contain"
        >
      </ContainerToolItem>

      <ContainerToolItem label="识别结果" content-class="flex flex-col gap-3">
        <div
          v-if="isSearching"
          class="flex min-h-48 items-center justify-center rounded-lg bg-default text-muted"
        >
          正在识别...
        </div>

        <div
          v-else-if="results.length === 0"
          class="flex min-h-48 items-center justify-center rounded-lg bg-default text-muted"
        >
          {{ selectedFile ? '等待识别' : '暂无图片' }}
        </div>

        <article
          v-for="(item, index) in results"
          v-else
          :key="`${item.filename}-${item.from}-${index}`"
          class="rounded-lg border border-muted bg-elevated/30 overflow-hidden"
        >
          <div class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div class="p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-lg font-semibold text-highlighted break-words">
                    {{ getTitle(item) }}
                  </h2>
                  <p v-if="getSubtitle(item)" class="mt-1 text-sm text-muted break-words">
                    {{ getSubtitle(item) }}
                  </p>
                </div>
                <UBadge :color="item.similarity >= 0.9 ? 'success' : item.similarity >= 0.75 ? 'warning' : 'neutral'" variant="subtle">
                  {{ formatPercent(item.similarity) }}
                </UBadge>
              </div>

              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-muted">
                    集数
                  </dt>
                  <dd class="mt-1 text-highlighted">
                    {{ getEpisodeText(item.episode) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted">
                    匹配位置
                  </dt>
                  <dd class="mt-1 font-mono text-highlighted">
                    {{ formatSecond(item.from) }} - {{ formatSecond(item.to) }}
                  </dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-muted">
                    文件名
                  </dt>
                  <dd class="mt-1 break-all text-highlighted">
                    {{ item.filename }}
                  </dd>
                </div>
              </dl>

              <div class="mt-4 flex flex-wrap gap-2">
                <UButton
                  v-if="item.anilist?.siteUrl"
                  :to="item.anilist.siteUrl"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide:external-link"
                >
                  AniList
                </UButton>
              </div>
            </div>

            <div class="bg-default p-3">
              <video
                controls
                preload="metadata"
                class="aspect-video w-full rounded-md bg-black"
                :src="item.video"
                :poster="item.image"
              />
            </div>
          </div>
        </article>
      </ContainerToolItem>
    </div>

    <ContainerToolItem
      v-else
      label="识别结果"
      content-class="flex min-h-48 items-center justify-center rounded-lg bg-default text-muted"
    >
      选择一张动漫截图后开始识别。
    </ContainerToolItem>
  </div>
</template>
