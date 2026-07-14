<script setup lang="ts">
import { searchMimeTypes } from './children/mimeTypes.service'

const query = ref('')
const { copy } = useCopy()

const results = computed(() => searchMimeTypes(query.value))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <label class="text-sm font-medium text-muted sm:text-right">查询：</label>
        <UInput
          v-model="query"
          icon="i-lucide:search"
          class="w-full"
          autofocus
          placeholder="输入 .json、image/png、document..."
        />
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-muted bg-muted/30">
      <div class="grid grid-cols-[7rem_minmax(0,1fr)_8rem_2rem] gap-3 border-b border-muted px-4 py-3 text-sm font-medium text-muted">
        <span>扩展名</span>
        <span>MIME Type</span>
        <span>分类</span>
        <span />
      </div>

      <div class="divide-y divide-muted">
        <div
          v-for="item in results"
          :key="`${item.extension}-${item.mime}`"
          class="grid grid-cols-[7rem_minmax(0,1fr)_8rem_2rem] items-center gap-3 px-4 py-3 text-sm"
        >
          <code>.{{ item.extension }}</code>
          <code class="break-all">{{ item.mime }}</code>
          <UBadge color="neutral" variant="soft" class="w-fit">
            {{ item.category }}
          </UBadge>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide:copy"
            size="sm"
            class="w-8"
            :aria-label="`复制 ${item.mime}`"
            @click="copy(item.mime)"
          />
        </div>

        <div v-if="results.length === 0" class="px-4 py-8 text-center text-sm text-muted">
          没有匹配的 MIME 类型。
        </div>
      </div>
    </div>
  </div>
</template>
