<script setup lang="ts">
import type { AlgoliaHit } from './cdnQuery.types'

defineProps<{
  result: AlgoliaHit[]
  count: number
  pageIndex: number
  maxPage: number
  pageSize: number
  loading: boolean
  hasPrevPage: boolean
  hasNextPage: boolean
}>()

const emit = defineEmits<{
  showDetail: [objectID: string]
  searchOwner: [owner: string]
  changePage: [pageIndex: number]
}>()
</script>

<template>
  <ContainerToolItem :label="`搜索结果（共 ${count} 条，最多展示前 1000 条）`">
    <div class="flex flex-col gap-3">
      <div
        v-if="!result.length"
        class="rounded-md border border-default p-4 text-sm text-muted"
      >
        未找到匹配的包。
      </div>

      <div
        v-for="item in result"
        :key="item.objectID"
        class="result-item"
      >
        <div class="flex items-start justify-between gap-3">
          <button
            class="pkg-name"
            type="button"
            @click="emit('showDetail', item.objectID)"
          >
            {{ item.name }}
          </button>
          <div class="flex items-center gap-2">
            <UBadge
              v-if="item.version"
              color="primary"
              variant="subtle"
            >
              {{ item.version }}
            </UBadge>
            <UBadge
              v-if="item.license"
              color="neutral"
              variant="subtle"
            >
              {{ item.license }}
            </UBadge>
          </div>
        </div>

        <p
          v-if="item.description"
          class="mt-2 text-sm text-muted"
        >
          {{ item.description }}
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            v-if="item.owner?.name"
            class="owner-btn"
            type="button"
            @click="emit('searchOwner', item.owner.name)"
          >
            作者: {{ item.owner.name }}
          </button>
          <UBadge
            v-for="key in item.keywords || []"
            :key="key"
            color="neutral"
            variant="soft"
          >
            {{ key }}
          </UBadge>
        </div>
      </div>

      <div
        v-if="count > pageSize"
        class="mt-2 flex items-center justify-between"
      >
        <span class="text-sm text-muted">
          第 {{ pageIndex + 1 }} / {{ maxPage }} 页
        </span>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:chevron-left"
            :disabled="!hasPrevPage || loading"
            @click="emit('changePage', pageIndex - 1)"
          >
            上一页
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide:chevron-right"
            :disabled="!hasNextPage || loading"
            @click="emit('changePage', pageIndex + 1)"
          >
            下一页
          </UButton>
        </div>
      </div>
    </div>
  </ContainerToolItem>
</template>

<style scoped lang="scss">
.result-item {
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.pkg-name {
  text-align: left;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.owner-btn {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ui-primary);

  &:hover {
    text-decoration: underline;
  }
}
</style>
