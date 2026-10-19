<script setup lang="ts">
import type { OriginToolItem, OriginToolMenu } from '#shared/types/tool'
import draggable from 'vuedraggable'
import { getPublicToolMenus } from '#shared/utils/toolCatalog'

interface UserToolMenu extends OriginToolMenu {
  kind: 'favorite' | 'most' | 'recent' | 'member'
}

definePageMeta({
  layout: 'full',
})

const input = useTemplateRef('input')

const searchStr = ref('')
const settingsStore = useSettingsStore()
const toolsStore = useToolsStore()
const originToolsStore = useOriginToolsStore()
const auth = useAuthInitStore()
const mounted = useMounted()

const toolMenus = computed(() => {
  return mounted.value ? toolsStore.toolMenusFilter(searchStr.value) : getPublicToolMenus()
})
const settings = computed(() => mounted.value
  ? settingsStore.general
  : {
      showSearch: true,
      showMost: true,
      showRecent: false,
      openInNewTab: false,
    })
const isFav = toolsStore.isFav
function toggleFav(tool: OriginToolItem) {
  toolsStore.updateFav({
    label: tool.label,
    name: tool.name,
    add: !isFav(tool.label),
  })
}

const showUserToolMenus = mounted
const userToolMenus = computed<UserToolMenu[]>(() => {
  if (!showUserToolMenus.value) {
    return []
  }
  const tmp: UserToolMenu[] = []
  if (toolsStore.favorite.length) {
    tmp.push({
      kind: 'favorite',
      label: '收藏',
      children: toolsStore.favorite,
    })
  }
  if (toolsStore.statistics.length) {
    if (settings.value.showMost) {
      tmp.push({
        kind: 'most',
        label: '最常访问',
        children: toolsStore.most(6),
      })
    }
    if (settings.value.showRecent) {
      tmp.push({
        kind: 'recent',
        label: '最近访问',
        children: toolsStore.recent(6),
      })
    }
  }
  if (originToolsStore.memberTools.length) {
    tmp.push({ kind: 'member', label: '会员应用', children: originToolsStore.memberTools })
  }
  return tmp.map((item) => {
    return {
      ...item,
      children: toolsStore.toolsFilter(item.children, searchStr.value),
    }
  }).filter((item) => {
    return item.children.length
  })
})

const favoriteSortableItems = computed({
  get: () => toolsStore.toolsFilter(toolsStore.favorite, ''),
  set: (tools: OriginToolItem[]) => {
    toolsStore.sortFavorite(tools)
  },
})

const isSearching = computed(() => Boolean(searchStr.value.trim()))

const toolCardGridClass = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'

function getMenuHash(label: string) {
  return `menu-${label}`
}

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})

onMounted(() => {
  toolsStore.fixFavorite()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UInput
      v-if="settings.showSearch"
      ref="input"
      v-model="searchStr"
      size="xl"
      icon="i-icon-park-outline:search"
      placeholder="搜索工具..."
      class="w-full"
      :ui="{
        base: 'bg-default/75 backdrop-blur',
      }"
    >
      <template #trailing>
        <UKbd value="/" />
      </template>
    </UInput>
    <div class="w-full flex flex-col gap-4">
      <ClientOnly>
        <TransitionGroup name="list">
          <div
            v-for="(item, index) in userToolMenus"
            :key="`user${index}`"
            class="flex flex-col gap-4"
          >
            <NuxtLink
              :id="getMenuHash(item.label)"
              :to="`#${getMenuHash(item.label)}`"
              class="group col-span-full scroll-mt-20 text-muted transition-colors hover:text-highlighted"
            >
              {{ item.label }}
              <UIcon
                name="i-lucide:hash"
                class="ml-1 inline-block size-3.5 align-[-2px] opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
              />
            </NuxtLink>
            <draggable
              v-if="item.kind === 'favorite' && !isSearching"
              v-model="favoriteSortableItems"
              item-key="label"
              tag="div"
              :class="toolCardGridClass"
              :force-fallback="true"
              :fallback-on-body="true"
              ghost-class="opacity-50"
              chosen-class="cursor-grabbing"
              drag-class="cursor-grabbing"
            >
              <template #item="{ element: tool }">
                <div>
                  <UPageCard
                    class="group relative h-full bg-elevated border border-inverted hover:border-primary text-base cursor-move"
                    :to="tool.name"
                    :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
                  >
                    <template #title>
                      <span class="flex min-w-0 items-center gap-1 pr-16">
                        <span class="min-w-0 truncate">
                          {{ tool.label }}
                        </span>
                        <UIcon
                          v-if="isExternalLink(tool.name)"
                          name="i-lucide:external-link"
                          class="size-3.5 shrink-0 text-dimmed"
                        />
                      </span>
                    </template>
                    <UTooltip v-if="mounted" text="拖拽排序">
                      <UButton
                        aria-label="拖拽排序"
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide:grip-vertical"
                        size="xs"
                        square
                        class="favorite-drag-handle absolute right-9 top-2 z-10 cursor-move opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        @click.stop.prevent
                      />
                    </UTooltip>
                    <UTooltip v-if="mounted" text="取消收藏">
                      <UButton
                        aria-label="取消收藏"
                        color="warning"
                        variant="soft"
                        icon="i-icon-park-solid:star"
                        size="xs"
                        square
                        class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        @click.stop.prevent="toggleFav(tool)"
                      />
                    </UTooltip>
                  </UPageCard>
                </div>
              </template>
            </draggable>
            <div
              v-else-if="item.kind === 'favorite'"
              :class="toolCardGridClass"
            >
              <UPageCard
                v-for="tool in item.children"
                :key="tool.name"
                class="group relative bg-elevated border border-inverted hover:border-primary text-base"
                :to="tool.name"
                :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
              >
                <template #title>
                  <span class="flex min-w-0 items-center gap-1 pr-8">
                    <span class="min-w-0 truncate">
                      {{ tool.label }}
                    </span>
                    <UIcon
                      v-if="isExternalLink(tool.name)"
                      name="i-lucide:external-link"
                      class="size-3.5 shrink-0 text-dimmed"
                    />
                  </span>
                </template>
                <UTooltip v-if="mounted" text="取消收藏">
                  <UButton
                    aria-label="取消收藏"
                    color="warning"
                    variant="soft"
                    icon="i-icon-park-solid:star"
                    size="xs"
                    square
                    class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    @click.stop.prevent="toggleFav(tool)"
                  />
                </UTooltip>
              </UPageCard>
            </div>
            <div v-else-if="item.kind === 'member'" :class="toolCardGridClass">
              <ToolCatalogCard
                v-for="tool in item.children"
                :key="tool.name"
                :tool="tool"
                :favorite="isFav(tool.label)"
                :show-favorite="mounted"
                :open-in-new-tab="settings.openInNewTab"
                @toggle-favorite="toggleFav"
              />
            </div>
            <div v-else :class="toolCardGridClass">
              <UPageCard
                v-for="(tool) in item.children"
                :key="tool.name"
                class="group relative bg-elevated border border-inverted hover:border-primary text-base"
                :to="tool.name"
                :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
              >
                <template #title>
                  <span class="flex min-w-0 items-center gap-1 pr-8">
                    <span class="min-w-0 truncate">
                      {{ tool.label }}
                    </span>
                    <UIcon
                      v-if="isExternalLink(tool.name)"
                      name="i-lucide:external-link"
                      class="size-3.5 shrink-0 text-dimmed"
                    />
                  </span>
                </template>
                <UTooltip v-if="mounted" :text="isFav(tool.label) ? '取消收藏' : '收藏'">
                  <UButton
                    :aria-label="isFav(tool.label) ? '取消收藏' : '收藏'"
                    :color="isFav(tool.label) ? 'warning' : 'neutral'"
                    :variant="isFav(tool.label) ? 'soft' : 'ghost'"
                    :icon="isFav(tool.label) ? 'i-icon-park-solid:star' : 'i-icon-park-outline:star'"
                    size="xs"
                    square
                    class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    @click.stop.prevent="toggleFav(tool)"
                  />
                </UTooltip>
              </UPageCard>
            </div>
          </div>
        </TransitionGroup>
        <UAlert
          v-if="auth.status === 'error'"
          title="会员应用加载失败，普通工具仍可使用"
          color="warning"
          variant="soft"
          :actions="[{ label: '重试', onClick: () => auth.ensureAuth(true).catch(() => {}) }]"
        />
      </ClientOnly>
      <TransitionGroup name="list">
        <div
          v-for="(item, index) in toolMenus"
          :key="index"
          :class="toolCardGridClass"
        >
          <NuxtLink
            :id="getMenuHash(item.label)"
            :to="`#${getMenuHash(item.label)}`"
            class="group col-span-full scroll-mt-20 text-muted transition-colors hover:text-highlighted"
          >
            {{ item.label }}
            <UIcon
              name="i-lucide:hash"
              class="ml-1 inline-block size-3.5 align-[-2px] opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
            />
          </NuxtLink>
          <ToolCatalogCard
            v-for="(tool) in item.children"
            :key="tool.name"
            :tool="tool"
            :favorite="mounted && isFav(tool.label)"
            :show-favorite="mounted"
            :open-in-new-tab="settings.openInNewTab"
            @toggle-favorite="toggleFav"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
