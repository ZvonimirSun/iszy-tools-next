<script setup lang="ts">
import { searchHttpStatusCodes } from './children/httpStatusCodes.service'

const query = ref('')
const { copy } = useCopy()

const filteredGroups = computed(() => searchHttpStatusCodes(query.value))
const totalCount = computed(() => filteredGroups.value.reduce((sum, group) => sum + group.codes.length, 0))

function copyStatus(code: number, phrase: string) {
  copy(`${code} ${phrase}`)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <label class="text-sm font-medium text-muted sm:text-right">搜索状态码：</label>
        <UInput
          v-model="query"
          icon="i-lucide:search"
          class="w-full"
          autofocus
          placeholder="输入 404、gateway、限流..."
        />
      </div>
    </div>

    <UAlert
      v-if="totalCount === 0"
      color="warning"
      variant="soft"
      icon="i-lucide:search-x"
      title="没有匹配的 HTTP 状态码"
    />

    <div class="grid gap-4">
      <section
        v-for="group in filteredGroups"
        :key="group.label"
        class="rounded-lg border border-muted bg-muted/30"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-muted px-4 py-3">
          <div>
            <h2 class="text-base font-semibold">
              {{ group.label }}
            </h2>
            <p class="text-sm text-muted">
              {{ group.range }}
            </p>
          </div>
          <UBadge color="neutral" variant="soft">
            {{ group.codes.length }} 项
          </UBadge>
        </div>

        <div class="divide-y divide-muted">
          <article
            v-for="status in group.codes"
            :key="status.code"
            class="grid gap-3 px-4 py-3 sm:grid-cols-[5rem_minmax(0,12rem)_5rem_minmax(0,1fr)_2rem] sm:items-center"
          >
            <span class="font-mono text-xl font-semibold tabular-nums">
              {{ status.code }}
            </span>
            <span class="min-w-0 font-mono text-sm">
              {{ status.phrase }}
            </span>
            <UBadge color="neutral" variant="soft" class="w-fit">
              {{ status.type }}
            </UBadge>
            <p class="min-w-0 text-sm text-muted">
              {{ status.description }}
            </p>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide:copy"
              size="sm"
              class="w-8 shrink-0"
              :aria-label="`复制 ${status.code} ${status.phrase}`"
              @click="copyStatus(status.code, status.phrase)"
            />
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
