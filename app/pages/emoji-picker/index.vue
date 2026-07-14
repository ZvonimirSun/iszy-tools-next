<script setup lang="ts">
import { getEmojiCategories, searchEmojis } from './children/emojiPicker.service'

const query = ref('')
const category = ref('全部')
const { copy } = useCopy()

const categories = getEmojiCategories().map(value => ({ label: value, value }))
const results = computed(() => searchEmojis(query.value, category.value))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_12rem]">
      <UInput v-model="query" icon="i-lucide:search" autofocus placeholder="搜索 emoji、英文名或关键词..." />
      <USelect v-model="category" :items="categories" />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <button
        v-for="item in results"
        :key="`${item.emoji}-${item.name}`"
        class="rounded-lg border border-muted bg-muted/30 p-3 text-left transition hover:border-primary hover:bg-primary/5"
        type="button"
        @click="copy(item.emoji)"
      >
        <span class="block text-3xl">{{ item.emoji }}</span>
        <span class="mt-2 block truncate text-sm font-medium">{{ item.name }}</span>
        <span class="mt-1 block text-xs text-muted">{{ item.category }}</span>
      </button>
    </div>

    <UAlert
      v-if="results.length === 0"
      color="warning"
      variant="soft"
      icon="i-lucide:search-x"
      title="没有匹配的 Emoji"
    />
  </div>
</template>
