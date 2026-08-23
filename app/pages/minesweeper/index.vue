<script setup lang="ts">
import type { DifficultyId, GameState } from './children/minesweeper.service'
import {
  chord,
  createDefaultMinesweeperSettings,
  createGame,
  CUSTOM_LIMITS,
  formatCounter,
  getElapsedSeconds,
  getRemainingMines,
  isPresetDifficulty,
  normalizeConfig,
  PRESET_DIFFICULTIES,
  reveal,
  toggleFlag,
} from './children/minesweeper.service'

const LONG_PRESS_MS = 450
const settingsStore = useSettingsStore()
const mounted = useMounted()

const difficulty = ref<DifficultyId>('beginner')
const customWidth = ref(PRESET_DIFFICULTIES.beginner.width)
const customHeight = ref(PRESET_DIFFICULTIES.beginner.height)
const customMines = ref(PRESET_DIFFICULTIES.beginner.mines)
const game = ref<GameState>(createGame('beginner'))
const now = ref(0)
const pressing = ref(false)

const difficultyItems = [
  { label: '初级 9×9 · 10 雷', value: 'beginner' },
  { label: '中级 16×16 · 40 雷', value: 'intermediate' },
  { label: '高级 30×16 · 99 雷', value: 'expert' },
  { label: '自定义', value: 'custom' },
] as const

const remainingMines = computed(() => getRemainingMines(game.value))
const elapsedSeconds = computed(() => getElapsedSeconds(game.value, now.value || game.value.startAt || 0))
const remainingText = computed(() => formatCounter(remainingMines.value))
const elapsedText = computed(() => formatCounter(elapsedSeconds.value))
const bestTimes = computed(() => mounted.value ? getSettings().bestTimes : createDefaultMinesweeperSettings().bestTimes)
const maxCustomMines = computed(() => Math.max(CUSTOM_LIMITS.minMines, customWidth.value * customHeight.value - 1))
const boardStyle = computed(() => ({
  '--cols': String(game.value.config.width),
  '--rows': String(game.value.config.height),
}))
const statusLabel = computed(() => {
  if (game.value.status === 'won') {
    return '已扫清全部地雷'
  }
  if (game.value.status === 'lost') {
    return '踩到地雷了，可以再开一局'
  }
  if (game.value.status === 'playing') {
    return '左键翻开，右键或长按插旗'
  }
  return '点击任意格子开始'
})
const faceEmoji = computed(() => {
  if (game.value.status === 'won') {
    return '😎'
  }
  if (game.value.status === 'lost') {
    return '😵'
  }
  if (pressing.value) {
    return '😮'
  }
  return '🙂'
})
const cellViews = computed(() => game.value.cells.map((cell, index) => {
  const lost = game.value.status === 'lost'
  if (lost && cell.mark === 'flag' && !cell.mine) {
    return {
      className: 'minesweeper-cell-revealed minesweeper-cell-wrong',
      icon: 'i-lucide:x',
      text: '',
      label: '标错的旗',
    }
  }
  if (!cell.revealed) {
    if (cell.mark === 'flag') {
      return {
        className: 'minesweeper-cell-hidden minesweeper-cell-flag',
        icon: 'i-lucide:flag',
        text: '',
        label: '旗',
      }
    }
    return {
      className: 'minesweeper-cell-hidden',
      icon: '',
      text: '',
      label: '未开',
    }
  }
  if (cell.mine) {
    const exploded = index === game.value.explodedIndex
    return {
      className: exploded ? 'minesweeper-cell-revealed minesweeper-cell-exploded' : 'minesweeper-cell-revealed minesweeper-cell-mine',
      icon: 'i-lucide:bomb',
      text: '',
      label: exploded ? '踩到的地雷' : '地雷',
    }
  }
  if (cell.adjacentMines > 0) {
    return {
      className: `minesweeper-cell-revealed minesweeper-cell-n${cell.adjacentMines}`,
      icon: '',
      text: String(cell.adjacentMines),
      label: `${cell.adjacentMines} 个相邻地雷`,
    }
  }
  return {
    className: 'minesweeper-cell-revealed',
    icon: '',
    text: '',
    label: '空',
  }
}))

let timer: ReturnType<typeof setInterval> | null = null
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let ignoreClick = false

function getSettings() {
  if (!settingsStore.modules.minesweeper) {
    settingsStore.modules.minesweeper = createDefaultMinesweeperSettings()
  }
  return settingsStore.modules.minesweeper
}

function restart() {
  stopTimer()
  now.value = 0
  pressing.value = false
  const settings = getSettings()
  settings.lastDifficulty = difficulty.value
  if (difficulty.value === 'custom') {
    const config = normalizeConfig({
      width: customWidth.value,
      height: customHeight.value,
      mines: customMines.value,
    })
    customWidth.value = config.width
    customHeight.value = config.height
    customMines.value = config.mines
    settings.custom = config
    game.value = createGame('custom', config)
    return
  }
  game.value = createGame(difficulty.value)
}

function applyReveal(index: number) {
  game.value = reveal(game.value, index, { now: Date.now() })
  now.value = Date.now()
  updateBestTime()
  syncTimer()
}

function applyFlag(index: number) {
  game.value = toggleFlag(game.value, index)
}

function applyChord(index: number) {
  game.value = chord(game.value, index, { now: Date.now() })
  now.value = Date.now()
  updateBestTime()
  syncTimer()
}

function applyPrimary(index: number) {
  const cell = game.value.cells[index]
  if (cell?.revealed) {
    applyChord(index)
    return
  }
  applyReveal(index)
}

function updateBestTime() {
  if (game.value.status !== 'won' || !isPresetDifficulty(game.value.difficulty)) {
    return
  }
  const elapsed = getElapsedSeconds(game.value, now.value)
  const settings = getSettings()
  const current = settings.bestTimes[game.value.difficulty]
  if (current == null || elapsed < current) {
    settings.bestTimes[game.value.difficulty] = elapsed
  }
}

function formatBestTime(value: number | null) {
  return value == null ? '--' : formatCounter(value)
}

function onDifficultyChange(value: DifficultyId) {
  difficulty.value = value
  restart()
}

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onCellPointerDown(index: number, event: PointerEvent) {
  if (event.button === 1) {
    event.preventDefault()
    applyChord(index)
    return
  }
  if (event.button !== 0) {
    return
  }

  pressing.value = true
  ignoreClick = false
  const cell = game.value.cells[index]
  if (cell?.revealed || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) {
    return
  }

  longPressTimer = setTimeout(() => {
    ignoreClick = true
    applyFlag(index)
    pressing.value = false
  }, LONG_PRESS_MS)
}

function onCellPointerUp() {
  pressing.value = false
  clearLongPress()
}

function onCellClick(index: number, event: MouseEvent) {
  if (ignoreClick) {
    ignoreClick = false
    event.preventDefault()
    return
  }
  applyPrimary(index)
}

function onCellContextMenu(index: number, event: MouseEvent) {
  event.preventDefault()
  applyFlag(index)
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]')) {
    return
  }
  if (event.key === 'r' || event.key === 'R' || event.key === 'F2') {
    event.preventDefault()
    restart()
  }
}

function syncTimer() {
  if (game.value.status === 'playing') {
    startTimer()
    return
  }
  stopTimer()
}

function startTimer() {
  if (timer) {
    return
  }
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 250)
}

function stopTimer() {
  if (!timer) {
    return
  }
  clearInterval(timer)
  timer = null
}

onMounted(() => {
  const settings = getSettings()
  difficulty.value = settings.lastDifficulty
  customWidth.value = settings.custom.width
  customHeight.value = settings.custom.height
  customMines.value = settings.custom.mines
  restart()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  stopTimer()
  clearLongPress()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-full w-full overflow-auto">
    <div class="minesweeper-layout">
      <section class="minesweeper-play-area">
        <div class="minesweeper-board-wrap">
          <div class="minesweeper-hud">
            <div class="minesweeper-counter" title="剩余地雷">
              {{ remainingText }}
            </div>
            <button
              type="button"
              class="minesweeper-face"
              title="新游戏"
              aria-label="新游戏"
              @click="restart"
            >
              {{ faceEmoji }}
            </button>
            <div class="minesweeper-counter" title="用时">
              {{ elapsedText }}
            </div>
          </div>

          <div class="minesweeper-board-scroller">
            <div
              class="minesweeper-board"
              :style="boardStyle"
              @pointerleave="onCellPointerUp"
              @pointercancel="onCellPointerUp"
            >
              <button
                v-for="(cell, index) in cellViews"
                :key="index"
                type="button"
                class="minesweeper-cell"
                :class="cell.className"
                :aria-label="cell.label"
                @pointerdown="onCellPointerDown(index, $event)"
                @pointerup="onCellPointerUp"
                @click="onCellClick(index, $event)"
                @contextmenu="onCellContextMenu(index, $event)"
              >
                <UIcon
                  v-if="cell.icon"
                  :name="cell.icon"
                  class="minesweeper-cell-icon"
                />
                <span v-else>{{ cell.text }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside class="minesweeper-sidebar">
        <ContainerToolItem content-class="flex flex-col gap-4">
          <UFormField label="难度">
            <USelect
              :model-value="difficulty"
              :items="[...difficultyItems]"
              class="w-full"
              @update:model-value="onDifficultyChange"
            />
          </UFormField>

          <div v-if="difficulty === 'custom'" class="grid grid-cols-3 gap-2">
            <UFormField label="宽">
              <UInputNumber
                v-model="customWidth"
                class="w-full"
                :min="CUSTOM_LIMITS.minSize"
                :max="CUSTOM_LIMITS.maxWidth"
              />
            </UFormField>
            <UFormField label="高">
              <UInputNumber
                v-model="customHeight"
                class="w-full"
                :min="CUSTOM_LIMITS.minSize"
                :max="CUSTOM_LIMITS.maxHeight"
              />
            </UFormField>
            <UFormField label="雷">
              <UInputNumber
                v-model="customMines"
                class="w-full"
                :min="CUSTOM_LIMITS.minMines"
                :max="maxCustomMines"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                剩余地雷
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ remainingMines }}
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                用时
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ elapsedSeconds }}
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-muted/40 p-3">
            <div class="text-xs text-muted">
              状态
            </div>
            <div class="mt-1 text-sm text-highlighted">
              {{ statusLabel }}
            </div>
          </div>

          <UButton color="primary" icon="i-lucide:rotate-ccw" block @click="restart">
            新游戏
          </UButton>

          <div class="rounded-lg bg-muted/40 p-3 text-sm text-muted">
            <div class="font-medium text-toned">
              最佳成绩
            </div>
            <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums">
              <span>初级</span><span>{{ formatBestTime(bestTimes.beginner) }}</span>
              <span>中级</span><span>{{ formatBestTime(bestTimes.intermediate) }}</span>
              <span>高级</span><span>{{ formatBestTime(bestTimes.expert) }}</span>
            </div>
          </div>

          <div class="rounded-lg bg-muted/40 p-3 text-sm text-muted">
            <div class="font-medium text-toned">
              操作
            </div>
            <div class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
              <span>翻开</span><span>左键 / 轻点</span>
              <span>插旗</span><span>右键 / 长按</span>
              <span>展开</span><span>数字格左键或中键</span>
              <span>重开</span><span>R / F2 / 点脸</span>
            </div>
          </div>
        </ContainerToolItem>
      </aside>
    </div>
  </div>
</template>

<style>
.minesweeper-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: calc(var(--spacing) * 4);
  width: 100%;
}

.minesweeper-play-area,
.minesweeper-sidebar {
  min-width: 0;
}

.minesweeper-board-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 3);
  width: fit-content;
  max-width: 100%;
  margin-inline: auto;
}

.minesweeper-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  min-height: calc(var(--spacing) * 12);
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg-elevated);
}

.minesweeper-counter {
  min-width: calc(var(--spacing) * 16);
  padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  color: var(--ui-error);
  font-family: var(--font-mono);
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.minesweeper-face {
  width: calc(var(--spacing) * 10);
  height: calc(var(--spacing) * 10);
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.minesweeper-face:hover {
  background: var(--ui-bg-muted);
}

.minesweeper-board-scroller {
  max-width: 100%;
  overflow: auto;
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg-elevated);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

.minesweeper-board {
  --cell-size: 2rem;
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  grid-template-rows: repeat(var(--rows), var(--cell-size));
  gap: 1px;
  width: max-content;
  padding: calc(var(--spacing) * 2);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.minesweeper-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 2px;
  font-size: .875rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.minesweeper-cell-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.minesweeper-cell-hidden {
  background: var(--ui-bg-accented);
  box-shadow:
    inset -1px -1px 0 color-mix(in oklab, var(--ui-text) 18%, transparent),
    inset 1px 1px 0 color-mix(in oklab, white 42%, transparent);
}

.minesweeper-cell-hidden:active:not(.minesweeper-cell-flag) {
  box-shadow: inset 0 0 0 1px var(--ui-border);
}

.minesweeper-cell-flag {
  color: var(--ui-error);
}

.minesweeper-cell-revealed {
  background: var(--ui-bg);
  box-shadow: inset 0 0 0 1px var(--ui-border-muted);
  cursor: default;
}

.minesweeper-cell-mine,
.minesweeper-cell-wrong {
  color: var(--ui-text-highlighted);
}

.minesweeper-cell-exploded {
  background: color-mix(in oklab, var(--ui-error) 28%, var(--ui-bg));
  color: var(--ui-text-highlighted);
}

.minesweeper-cell-n1 { color: #2563eb; }
.minesweeper-cell-n2 { color: #16a34a; }
.minesweeper-cell-n3 { color: #dc2626; }
.minesweeper-cell-n4 { color: #1d4ed8; }
.minesweeper-cell-n5 { color: #9a3412; }
.minesweeper-cell-n6 { color: #0f766e; }
.minesweeper-cell-n7 { color: var(--ui-text-highlighted); }
.minesweeper-cell-n8 { color: var(--ui-text-muted); }

.dark .minesweeper-cell-n1 { color: #60a5fa; }
.dark .minesweeper-cell-n2 { color: #4ade80; }
.dark .minesweeper-cell-n3 { color: #f87171; }
.dark .minesweeper-cell-n4 { color: #818cf8; }
.dark .minesweeper-cell-n5 { color: #fb923c; }
.dark .minesweeper-cell-n6 { color: #2dd4bf; }

@media (min-width: 80rem) {
  .minesweeper-layout {
    grid-template-columns: minmax(0, 1fr) minmax(calc(var(--spacing) * 72), calc(var(--spacing) * 88));
    align-items: start;
  }
}

@media (max-width: 40rem) {
  .minesweeper-board {
    --cell-size: 1.75rem;
    padding: calc(var(--spacing) * 1.5);
  }

  .minesweeper-cell {
    font-size: .75rem;
  }

  .minesweeper-counter {
    min-width: calc(var(--spacing) * 14);
    font-size: 1.125rem;
  }
}
</style>
