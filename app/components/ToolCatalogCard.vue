<script setup lang="ts">
import type { ToolItem } from '#shared/types/tool'

defineProps<{
  tool: ToolItem
  favorite: boolean
  showFavorite: boolean
  openInNewTab: boolean
}>()
defineEmits<{ toggleFavorite: [tool: ToolItem] }>()
</script>

<template>
  <UTooltip
    :text="tool.description"
    :delay-duration="500"
    :ui="{
      content: 'h-auto min-h-6 max-w-72 items-start py-2',
      text: 'overflow-visible whitespace-normal text-clip break-words text-left leading-5',
    }"
  >
    <UPageCard
      class="group relative bg-elevated border border-inverted hover:border-primary text-base"
      :to="tool.name"
      :target="openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
      :description="tool.description || ' '"
      :ui="{
        description: 'mt-4 h-14 overflow-hidden line-clamp-2 leading-7',
      }"
    >
      <template #title>
        <span class="flex items-center gap-3 pr-8" :title="tool.label">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UIcon :name="tool.icon" class="size-5" />
          </span>
          <span class="flex min-w-0 items-center gap-1">
            <span class="block min-w-0 truncate leading-6">
              {{ tool.label }}
            </span>
            <UIcon
              v-if="isExternalLink(tool.name)"
              name="i-lucide:external-link"
              class="size-3.5 shrink-0 text-dimmed"
            />
          </span>
        </span>
      </template>
      <UTooltip v-if="showFavorite" :text="favorite ? '取消收藏' : '收藏'">
        <UButton
          :aria-label="favorite ? '取消收藏' : '收藏'"
          :color="favorite ? 'warning' : 'neutral'"
          :variant="favorite ? 'soft' : 'ghost'"
          :icon="favorite ? 'i-icon-park-solid:star' : 'i-icon-park-outline:star'"
          size="xs"
          square
          class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          @click.stop.prevent="$emit('toggleFavorite', tool)"
        />
      </UTooltip>
    </UPageCard>
  </UTooltip>
</template>
