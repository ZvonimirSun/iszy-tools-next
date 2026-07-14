<script setup lang="ts">
import { searchExtensions, searchMimeTypes } from './children/mimeTypes.service'

const query = ref('')
const { copy } = useCopy()

const mimeResults = computed(() => searchMimeTypes(query.value))
const extensionResults = computed(() => searchExtensions(query.value))
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

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="overflow-hidden rounded-lg border border-muted bg-muted/30">
        <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] gap-3 border-b border-muted px-4 py-3 text-sm font-medium text-muted">
          <span>MIME Type</span>
          <span>扩展名</span>
          <span />
        </div>

        <div class="max-h-[42rem] divide-y divide-muted overflow-auto">
          <div
            v-for="item in mimeResults"
            :key="item.mime"
            class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] items-start gap-3 px-4 py-3 text-sm"
          >
            <code class="break-all">{{ item.mime }}</code>
            <div class="flex flex-wrap gap-1">
              <UBadge v-for="extension in item.extensions" :key="extension" color="neutral" variant="soft">
                .{{ extension }}
              </UBadge>
            </div>
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

          <div v-if="mimeResults.length === 0" class="px-4 py-8 text-center text-sm text-muted">
            没有匹配的 MIME 类型。
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border border-muted bg-muted/30">
        <div class="grid grid-cols-[7rem_minmax(0,1fr)_2rem] gap-3 border-b border-muted px-4 py-3 text-sm font-medium text-muted">
          <span>扩展名</span>
          <span>MIME Type</span>
          <span />
        </div>

        <div class="max-h-[42rem] divide-y divide-muted overflow-auto">
          <div
            v-for="item in extensionResults"
            :key="item.extension"
            class="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-3 px-4 py-3 text-sm"
          >
            <code>.{{ item.extension }}</code>
            <code class="break-all">{{ item.mime }}</code>
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

          <div v-if="extensionResults.length === 0" class="px-4 py-8 text-center text-sm text-muted">
            没有匹配的扩展名。
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
