<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {
  ShortUrlForm,
  ShortUrlItem,
  ShortUrlOrderDirection,
  ShortUrlOrderField,
  ShortUrlSearchForm,
} from './children/urls.types'
import dayjs from 'dayjs'
import { createShortUrl, deleteShortUrl, fetchShortUrls, updateShortUrl } from './children/urls.service'

const toast = useToast()
const { copy } = useCopy()
const { apiOrigin, shortUrlOrigin } = usePublicConfig()

const rows = ref<ShortUrlItem[]>([])
const pageIndex = ref(1)
const total = ref(0)
const loading = ref(false)
const submitting = ref(false)
const editingKeyword = ref('')
const editingUrl = ref('')

const form = reactive<ShortUrlForm>({
  keyword: '',
  url: '',
})

const searchForm = reactive<ShortUrlSearchForm>({
  search: '',
  searchField: 'all',
  orderBy: 'createdAt',
  orderDirection: 'desc',
  pageSize: 10,
  clicksOperator: 'more',
  clicks: undefined,
  createdOperator: 'before',
  createdAt: '',
})

const searchFieldItems = [
  { label: '所有字段', value: 'all' },
  { label: '短链接', value: 'keyword' },
  { label: '原网址', value: 'url' },
  { label: '标题', value: 'title' },
  { label: 'IP', value: 'ip' },
]

const orderFieldItems = [
  { label: '短链接', value: 'keyword' },
  { label: '原网址', value: 'url' },
  { label: '标题', value: 'title' },
  { label: '创建时间', value: 'createdAt' },
  { label: '更新时间', value: 'updatedAt' },
  { label: 'IP', value: 'ip' },
  { label: '点击数', value: 'clicks' },
]

const orderDirectionItems = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' },
]

const clicksOperatorItems = [
  { label: '大于', value: 'more' },
  { label: '小于', value: 'less' },
  { label: '等于', value: 'equal' },
]

const createdOperatorItems = [
  { label: '早于', value: 'before' },
  { label: '晚于', value: 'after' },
]

function fixedColumnClass(widthClass: string) {
  return {
    class: {
      th: `${widthClass} ${widthClass.replace('w-', 'min-w-')} ${widthClass.replace('w-', 'max-w-')} whitespace-nowrap`,
      td: `${widthClass} ${widthClass.replace('w-', 'min-w-')} ${widthClass.replace('w-', 'max-w-')}`,
    },
  }
}

const columns: TableColumn<ShortUrlItem>[] = [
  { accessorKey: 'keyword', header: '短链接', meta: fixedColumnClass('w-56') },
  { accessorKey: 'url', header: '原网址', meta: fixedColumnClass('w-128') },
  { accessorKey: 'createdAt', header: '创建时间', meta: fixedColumnClass('w-44') },
  { accessorKey: 'ip', header: 'IP', meta: fixedColumnClass('w-36') },
  { accessorKey: 'clicks', header: '点击', meta: fixedColumnClass('w-24') },
  { id: 'actions', header: '操作', meta: fixedColumnClass('w-72') },
]

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / searchForm.pageSize)))

function buildShortUrl(keyword: string) {
  const origin = shortUrlOrigin || `${apiOrigin}/urls`
  return `${origin}/${keyword}`
}

function formatDate(date: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function getSortIcon(field: ShortUrlOrderField) {
  if (searchForm.orderBy !== field) {
    return 'i-lucide:chevrons-up-down'
  }
  return searchForm.orderDirection === 'asc' ? 'i-lucide:chevron-up' : 'i-lucide:chevron-down'
}

function setSort(field: ShortUrlOrderField) {
  if (searchForm.orderBy === field) {
    searchForm.orderDirection = searchForm.orderDirection === 'asc' ? 'desc' : 'asc'
  }
  else {
    searchForm.orderBy = field
    searchForm.orderDirection = field === 'createdAt' || field === 'updatedAt' || field === 'clicks' ? 'desc' : 'asc'
  }
  pageIndex.value = 1
  refreshList()
}

function startEdit(item: ShortUrlItem) {
  editingKeyword.value = item.keyword
  editingUrl.value = item.url
}

function cancelEdit() {
  editingKeyword.value = ''
  editingUrl.value = ''
}

function getListQuery() {
  const clicks = searchForm.clicks
  return {
    pageIndex: pageIndex.value - 1,
    pageSize: searchForm.pageSize,
    search: searchForm.search.trim() || undefined,
    searchField: searchForm.searchField,
    orderBy: searchForm.orderBy,
    orderDirection: searchForm.orderDirection,
    clicksOperator: clicks == null ? undefined : searchForm.clicksOperator,
    clicks,
    createdOperator: searchForm.createdAt ? searchForm.createdOperator : undefined,
    createdAt: searchForm.createdAt || undefined,
  }
}

async function refreshList() {
  loading.value = true
  try {
    const data = await fetchShortUrls(getListQuery())
    rows.value = data.rows
    total.value = data.count
  }
  catch (e) {
    toast.add({
      title: '获取短链接失败',
      description: (e as Error).message,
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

async function handleCreate() {
  const url = form.url.trim()
  if (!url) {
    toast.add({ title: '请输入原网址', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    await createShortUrl({
      url,
      keyword: form.keyword.trim(),
    })
    toast.add({ title: '创建成功', color: 'success' })
    form.url = ''
    form.keyword = ''
    pageIndex.value = 1
    await refreshList()
  }
  catch (e) {
    toast.add({
      title: '创建失败',
      description: (e as Error).message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

async function handleUpdate(item: ShortUrlItem) {
  const url = editingUrl.value.trim()
  if (!url) {
    toast.add({ title: '请输入原网址', color: 'warning' })
    return
  }

  try {
    await updateShortUrl(item, url)
    toast.add({ title: '更新成功', color: 'success' })
    cancelEdit()
    await refreshList()
  }
  catch (e) {
    toast.add({
      title: '更新失败',
      description: (e as Error).message,
      color: 'error',
    })
  }
}

async function handleDelete(item: ShortUrlItem, close?: () => void) {
  try {
    await deleteShortUrl(item)
    toast.add({ title: '删除成功', color: 'success' })
    close?.()

    if (rows.value.length === 1 && pageIndex.value > 1) {
      pageIndex.value -= 1
    }
    await refreshList()
  }
  catch (e) {
    toast.add({
      title: '删除失败',
      description: (e as Error).message,
      color: 'error',
    })
  }
}

async function copyShortUrl(item: ShortUrlItem) {
  await copy(buildShortUrl(item.keyword), { notificationMessage: '短链接已复制' })
}

function handleSearch() {
  pageIndex.value = 1
  refreshList()
}

function clearSearch() {
  Object.assign(searchForm, {
    search: '',
    searchField: 'all',
    orderBy: 'createdAt' as ShortUrlOrderField,
    orderDirection: 'desc' as ShortUrlOrderDirection,
    pageSize: 10,
    clicksOperator: 'more',
    clicks: undefined,
    createdOperator: 'before',
    createdAt: '',
  })
  pageIndex.value = 1
  refreshList()
}

watch(pageIndex, () => {
  cancelEdit()
  refreshList()
})

onMounted(() => {
  refreshList()
})
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4 overflow-auto">
    <ContainerToolItem label="创建短链接">
      <form class="grid grid-cols-1 gap-3 xl:grid-cols-12" @submit.prevent="handleCreate">
        <UFormField label="原网址" required class="xl:col-span-7">
          <UInput
            v-model="form.url"
            class="w-full"
            icon="i-lucide:link"
            placeholder="https://example.com/path"
            autocomplete="url"
          />
        </UFormField>

        <UFormField label="自定义短码" class="xl:col-span-3">
          <UInput
            v-model="form.keyword"
            class="w-full"
            icon="i-lucide:case-sensitive"
            placeholder="留空自动生成"
          />
        </UFormField>

        <div class="flex items-end xl:col-span-2">
          <UButton
            type="submit"
            icon="i-lucide:wand-sparkles"
            :loading="submitting"
            class="w-full justify-center xl:w-auto"
          >
            缩短
          </UButton>
        </div>
      </form>
    </ContainerToolItem>

    <ContainerToolItem label="短链接列表" class="flex-1 min-h-0" content-class="flex flex-col gap-3 min-h-96 overflow-x-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UBadge color="neutral" variant="subtle">
          共 {{ total }} 条
        </UBadge>
        <UButton
          icon="i-lucide:refresh-cw"
          color="neutral"
          variant="soft"
          :loading="loading"
          @click="refreshList"
        >
          刷新
        </UButton>
      </div>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        sticky
        class="w-full flex-1 rounded-lg border border-muted"
        :ui="{ th: 'whitespace-nowrap', tr: 'align-top', td: 'max-w-0' }"
      >
        <template #empty>
          <div class="py-10 text-center text-muted">
            暂无短链接
          </div>
        </template>

        <template #keyword-header>
          <UButton class="whitespace-nowrap" color="neutral" variant="ghost" size="xs" :icon="getSortIcon('keyword')" trailing @click="setSort('keyword')">
            短链接
          </UButton>
        </template>

        <template #url-header>
          <UButton class="whitespace-nowrap" color="neutral" variant="ghost" size="xs" :icon="getSortIcon('url')" trailing @click="setSort('url')">
            原网址
          </UButton>
        </template>

        <template #createdAt-header>
          <UButton class="whitespace-nowrap" color="neutral" variant="ghost" size="xs" :icon="getSortIcon('createdAt')" trailing @click="setSort('createdAt')">
            创建时间
          </UButton>
        </template>

        <template #ip-header>
          <UButton class="whitespace-nowrap" color="neutral" variant="ghost" size="xs" :icon="getSortIcon('ip')" trailing @click="setSort('ip')">
            IP
          </UButton>
        </template>

        <template #clicks-header>
          <UButton class="whitespace-nowrap" color="neutral" variant="ghost" size="xs" :icon="getSortIcon('clicks')" trailing @click="setSort('clicks')">
            点击
          </UButton>
        </template>

        <template #actions-header>
          <div class="whitespace-nowrap">
            操作
          </div>
        </template>

        <template #keyword-cell="{ row }">
          <div class="flex w-full min-w-0 flex-col gap-1">
            <a
              class="truncate font-mono text-primary hover:underline"
              :href="buildShortUrl(row.original.keyword)"
              target="_blank"
              rel="noopener noreferrer"
              :title="row.original.keyword"
            >
              {{ row.original.keyword }}
            </a>
            <span class="truncate text-xs text-muted" :title="buildShortUrl(row.original.keyword)">{{ buildShortUrl(row.original.keyword) }}</span>
          </div>
        </template>

        <template #url-cell="{ row }">
          <UInput
            v-if="editingKeyword === row.original.keyword"
            v-model="editingUrl"
            class="w-full"
            autofocus
          />
          <div v-else class="flex w-full min-w-0 flex-col gap-1">
            <a
              v-if="row.original.title"
              class="truncate font-medium text-highlighted hover:underline"
              :href="row.original.url"
              target="_blank"
              rel="noopener noreferrer"
              :title="row.original.title"
            >
              {{ row.original.title }}
            </a>
            <a
              class="truncate text-sm text-toned hover:text-primary"
              :href="row.original.url"
              target="_blank"
              rel="noopener noreferrer"
              :title="row.original.url"
            >
              {{ row.original.url }}
            </a>
          </div>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="block w-full whitespace-nowrap text-sm text-toned">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #ip-cell="{ row }">
          <span class="block w-full truncate font-mono text-sm text-toned" :title="row.original.ip || '-'">{{ row.original.ip || '-' }}</span>
        </template>

        <template #clicks-cell="{ row }">
          <UBadge color="neutral" variant="outline">
            {{ row.original.clicks ?? 0 }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div v-if="editingKeyword === row.original.keyword" class="flex w-full items-center gap-0.5 whitespace-nowrap">
            <UButton
              icon="i-lucide:check"
              size="sm"
              color="primary"
              variant="soft"
              @click="handleUpdate(row.original)"
            />
            <UButton
              icon="i-lucide:x"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="cancelEdit"
            />
          </div>
          <div v-else class="flex w-full items-center gap-0.5 whitespace-nowrap">
            <UButton
              icon="i-lucide:copy"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="copyShortUrl(row.original)"
            />
            <UButton
              icon="i-lucide:external-link"
              size="sm"
              color="neutral"
              variant="ghost"
              :to="buildShortUrl(row.original.keyword)"
              target="_blank"
            />
            <UButton
              icon="i-lucide:pencil"
              size="sm"
              color="primary"
              variant="ghost"
              @click="startEdit(row.original)"
            />
            <UPopover>
              <UButton
                icon="i-lucide:trash-2"
                size="sm"
                color="error"
                variant="ghost"
              />
              <template #content="{ close }">
                <div class="flex items-center gap-2 p-2">
                  <span class="text-sm whitespace-nowrap">确认删除</span>
                  <UButton size="xs" color="error" @click="handleDelete(row.original, close)">
                    删除
                  </UButton>
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </UTable>

      <form class="rounded-lg border border-muted bg-muted/30 p-3" @submit.prevent="handleSearch">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">搜索</span>
          <UInput v-model="searchForm.search" class="w-44" size="xs" />
          <span>于</span>
          <USelect v-model="searchForm.searchField" class="w-28" size="xs" :items="searchFieldItems" />
          <span>排序</span>
          <USelect v-model="searchForm.orderBy" class="w-28" size="xs" :items="orderFieldItems" />
          <USelect v-model="searchForm.orderDirection" class="w-24" size="xs" :items="orderDirectionItems" />
          <span>显示</span>
          <UInputNumber v-model="searchForm.pageSize" class="w-20" size="xs" :min="1" :max="100" />
          <span>行</span>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">点击数</span>
          <USelect v-model="searchForm.clicksOperator" class="w-24" size="xs" :items="clicksOperatorItems" />
          <span>比</span>
          <UInputNumber v-model="searchForm.clicks" class="w-24" size="xs" :min="0" />
          <span>次</span>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">创建时间</span>
          <USelect v-model="searchForm.createdOperator" class="w-24" size="xs" :items="createdOperatorItems" />
          <UInput v-model="searchForm.createdAt" class="w-40" size="xs" type="date" />
          <UButton type="submit" size="xs" icon="i-lucide:search">
            搜索
          </UButton>
          <UButton size="xs" color="neutral" variant="soft" icon="i-lucide:eraser" @click="clearSearch">
            清空
          </UButton>
        </div>
      </form>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-muted">第 {{ pageIndex }} / {{ pageCount }} 页</span>
        <UPagination
          v-model:page="pageIndex"
          :total="total"
          :items-per-page="searchForm.pageSize"
          :sibling-count="1"
          show-edges
        />
      </div>
    </ContainerToolItem>
  </div>
</template>
