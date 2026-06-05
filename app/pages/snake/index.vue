<script setup lang="ts">
interface Point {
  x: number
  y: number
}

type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = 'ready' | 'playing' | 'paused' | 'over'
type CellKind = 'empty' | 'snake' | 'head' | 'food'

const boardSize = 20
const initialSnake: Point[] = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
]
const initialFood: Point = { x: 14, y: 10 }
const directionOffset: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const oppositeDirection: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
const directionIcon: Record<Direction, string> = {
  up: 'i-lucide:arrow-up',
  down: 'i-lucide:arrow-down',
  left: 'i-lucide:arrow-left',
  right: 'i-lucide:arrow-right',
}
const cellClass: Record<CellKind, string> = {
  empty: 'snake-cell-empty',
  snake: 'snake-cell-body',
  head: 'snake-cell-head',
  food: 'snake-cell-food',
}

const settingsStore = useSettingsStore()
const mounted = useMounted()

const snake = ref<Point[]>(cloneSnake(initialSnake))
const food = ref<Point>({ ...initialFood })
const direction = ref<Direction>('right')
const pendingDirection = ref<Direction>('right')
const state = ref<GameState>('ready')
const score = ref(0)
const eaten = ref(0)
const bestScore = computed(() => mounted.value ? settingsStore.modules.snake.bestScore : 0)
const speedMs = computed(() => Math.max(100, 260 - Math.floor(eaten.value / 5) * 15))
const actionLabel = computed(() => {
  if (state.value === 'playing') {
    return '暂停'
  }
  if (state.value === 'paused') {
    return '继续'
  }
  return '开始'
})
const actionIcon = computed(() => state.value === 'playing' ? 'i-lucide:pause' : 'i-lucide:play')
const controlActionLabel = computed(() => state.value === 'paused' ? '继续' : '暂停')
const controlActionIcon = computed(() => state.value === 'paused' ? 'i-lucide:play' : 'i-lucide:pause')
const cells = computed<CellKind[]>(() => {
  const result = Array.from<CellKind>({ length: boardSize * boardSize }).fill('empty')
  result[toIndex(food.value)] = 'food'
  snake.value.forEach((point, index) => {
    result[toIndex(point)] = index === 0 ? 'head' : 'snake'
  })
  return result
})

let timer: ReturnType<typeof setInterval> | null = null

function cloneSnake(points: Point[]) {
  return points.map(point => ({ ...point }))
}

function toIndex(point: Point) {
  return point.y * boardSize + point.x
}

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y
}

function isInside(point: Point) {
  return point.x >= 0 && point.x < boardSize && point.y >= 0 && point.y < boardSize
}

function isSnakePoint(point: Point, body = snake.value) {
  return body.some(item => samePoint(item, point))
}

function randomFood(body = snake.value): Point {
  const emptyCells: Point[] = []
  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const point = { x, y }
      if (!isSnakePoint(point, body)) {
        emptyCells.push(point)
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)] ?? { ...initialFood }
}

function setDirection(nextDirection: Direction) {
  if (state.value !== 'playing') {
    return
  }
  if (oppositeDirection[direction.value] === nextDirection) {
    return
  }
  pendingDirection.value = nextDirection
}

function updateBestScore() {
  if (score.value > settingsStore.modules.snake.bestScore) {
    settingsStore.modules.snake.bestScore = score.value
  }
}

function resetGame() {
  snake.value = cloneSnake(initialSnake)
  food.value = randomFood(snake.value)
  direction.value = 'right'
  pendingDirection.value = 'right'
  score.value = 0
  eaten.value = 0
}

function startGame() {
  resetGame()
  state.value = 'playing'
  restartTimer()
}

function toggleGame() {
  if (state.value === 'ready' || state.value === 'over') {
    startGame()
    return
  }
  if (state.value === 'paused') {
    state.value = 'playing'
    restartTimer()
    return
  }
  state.value = 'paused'
  stopTimer()
}

function step() {
  direction.value = pendingDirection.value
  const offset = directionOffset[direction.value]
  const head = snake.value[0]
  const nextHead = { x: head.x + offset.x, y: head.y + offset.y }
  const willEat = samePoint(nextHead, food.value)
  const bodyForCollision = willEat ? snake.value : snake.value.slice(0, -1)

  if (!isInside(nextHead) || isSnakePoint(nextHead, bodyForCollision)) {
    state.value = 'over'
    stopTimer()
    updateBestScore()
    return
  }

  const nextSnake = [nextHead, ...snake.value]
  if (willEat) {
    score.value += 10
    eaten.value += 1
    food.value = randomFood(nextSnake)
    updateBestScore()
  }
  else {
    nextSnake.pop()
  }
  snake.value = nextSnake
}

function restartTimer() {
  stopTimer()
  timer = setInterval(step, speedMs.value)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function handleKeydown(event: KeyboardEvent) {
  const keyDirection: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  }
  const nextDirection = keyDirection[event.key]
  if (nextDirection) {
    event.preventDefault()
    setDirection(nextDirection)
    return
  }
  if (event.key === ' ' || event.key.toLowerCase() === 'p') {
    event.preventDefault()
    toggleGame()
  }
  else if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    startGame()
  }
}

watch(speedMs, () => {
  if (state.value === 'playing') {
    restartTimer()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('keydown', handleKeydown)
})

definePageMeta({
  layout: 'full',
})
</script>

<template>
  <div class="min-h-full w-full overflow-auto">
    <div class="snake-layout">
      <div class="snake-orientation-tip">
        <div class="snake-orientation-title">
          建议竖屏游玩
        </div>
        <div class="snake-orientation-text">
          当前横屏高度较小，竖屏可以获得更完整的棋盘和操作空间。
        </div>
      </div>

      <section class="snake-play-area">
        <div class="snake-board-wrap">
          <div class="snake-mobile-hud">
            <div class="snake-stat">
              <span>得分</span>
              <strong>{{ score }}</strong>
            </div>
            <div class="snake-stat">
              <span>最高</span>
              <strong>{{ bestScore }}</strong>
            </div>
            <div class="snake-stat">
              <span>长度</span>
              <strong>{{ snake.length }}</strong>
            </div>
          </div>

          <div class="snake-board">
            <div
              v-for="(cell, index) in cells"
              :key="index"
              class="snake-cell"
              :class="cellClass[cell]"
            />
            <div v-if="state === 'ready' || state === 'paused' || state === 'over'" class="snake-message">
              <div class="snake-message-title">
                {{ state === 'over' ? '游戏结束' : state === 'paused' ? '已暂停' : '贪吃蛇' }}
              </div>
              <div class="snake-message-text">
                {{ state === 'over' ? '撞到边界或自己了，重新开始再来一局。' : '使用方向键或按钮控制移动。' }}
              </div>
              <UButton class="mt-3" color="primary" :icon="actionIcon" @click="toggleGame">
                {{ actionLabel }}
              </UButton>
            </div>
          </div>

          <div class="snake-controls">
            <div />
            <UButton block color="neutral" variant="soft" :icon="directionIcon.up" @click="setDirection('up')">
              上
            </UButton>
            <div />
            <UButton block color="neutral" variant="soft" :icon="directionIcon.left" @click="setDirection('left')">
              左
            </UButton>
            <UButton block color="primary" variant="soft" :icon="controlActionIcon" @click="toggleGame">
              {{ controlActionLabel }}
            </UButton>
            <UButton block color="neutral" variant="soft" :icon="directionIcon.right" @click="setDirection('right')">
              右
            </UButton>
            <div />
            <UButton block color="neutral" variant="soft" :icon="directionIcon.down" @click="setDirection('down')">
              下
            </UButton>
            <div />
          </div>
        </div>
      </section>

      <aside class="snake-sidebar">
        <ContainerToolItem content-class="flex flex-col gap-4">
          <div class="snake-sidebar-stats grid grid-cols-2 gap-2">
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                得分
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ score }}
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                最高分
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ bestScore }}
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                长度
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ snake.length }}
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                已吃
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ eaten }}
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton class="flex-1" color="primary" :icon="state === 'playing' ? 'i-lucide:rotate-ccw' : actionIcon" @click="state === 'playing' ? startGame() : toggleGame()">
              {{ state === 'playing' ? '重开' : actionLabel }}
            </UButton>
            <UButton class="flex-1" color="neutral" variant="soft" icon="i-lucide:rotate-ccw" @click="startGame">
              重开
            </UButton>
          </div>

          <div class="rounded-lg bg-muted/40 p-3 text-sm text-muted">
            <div class="font-medium text-toned">
              键盘
            </div>
            <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <span>移动</span><span>方向键 / WASD</span>
              <span>暂停</span><span>空格 / P</span>
              <span>重开</span><span>R</span>
            </div>
          </div>
        </ContainerToolItem>
      </aside>
    </div>
  </div>
</template>

<style>
.snake-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: calc(var(--spacing) * 4);
  width: 100%;
}

.snake-orientation-tip {
  display: none;
}

.snake-play-area,
.snake-sidebar {
  min-width: 0;
}

.snake-board-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
  width: min(100%, calc(var(--spacing) * 96));
  margin-inline: auto;
}

.snake-mobile-hud {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--spacing) * 2);
}

.snake-stat {
  min-width: 0;
  padding: calc(var(--spacing) * 2);
  border-radius: calc(var(--ui-radius) * 2);
  background: color-mix(in oklab, var(--ui-bg-muted) 70%, transparent);
}

.snake-stat span {
  display: block;
  color: var(--ui-text-muted);
  font-size: .75rem;
  line-height: 1rem;
}

.snake-stat strong {
  display: block;
  margin-top: calc(var(--spacing) * 0.5);
  color: var(--ui-text-highlighted);
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.snake-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(20, minmax(0, 1fr));
  grid-template-rows: repeat(20, minmax(0, 1fr));
  gap: calc(var(--spacing) * 0.5);
  aspect-ratio: 1;
  padding: calc(var(--spacing) * 2);
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg-elevated);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

.snake-cell {
  min-width: 0;
  min-height: 0;
  border-radius: var(--ui-radius);
}

.snake-cell-empty {
  background: var(--ui-bg);
  box-shadow: inset 0 0 0 1px var(--ui-border-muted);
}

.snake-cell-body {
  background: #10b981;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, white 24%, transparent);
}

.snake-cell-head {
  background: #059669;
  box-shadow: inset 0 0 0 2px color-mix(in oklab, white 34%, transparent);
}

.snake-cell-food {
  border-radius: 9999px;
  background: #f43f5e;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, white 30%, transparent);
}

.snake-message {
  position: absolute;
  inset: calc(var(--spacing) * 2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing) * 4);
  border-radius: calc(var(--ui-radius) * 2);
  background: color-mix(in oklab, var(--ui-bg) 72%, transparent);
  text-align: center;
  backdrop-filter: blur(6px);
}

.snake-message-title {
  color: var(--ui-text-highlighted);
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
}

.snake-message-text {
  margin-top: calc(var(--spacing) * 1);
  color: var(--ui-text-muted);
  font-size: .875rem;
  line-height: 1.25rem;
}

.snake-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--spacing) * 2);
  width: 100%;
}

@media (min-width: 80rem) {
  .snake-layout {
    grid-template-columns: minmax(0, 1fr) minmax(calc(var(--spacing) * 72), calc(var(--spacing) * 88));
    align-items: start;
  }

  .snake-mobile-hud {
    display: none;
  }
}

@media (max-width: 79.999rem) {
  .snake-sidebar-stats {
    display: none;
  }
}

@media (max-width: 30rem) {
  .snake-board-wrap {
    width: min(100%, calc(var(--spacing) * 84));
    gap: calc(var(--spacing) * 3);
  }

  .snake-mobile-hud,
  .snake-controls {
    gap: calc(var(--spacing) * 1.5);
  }

  .snake-stat {
    padding: calc(var(--spacing) * 1.5);
  }

  .snake-stat strong {
    font-size: 1rem;
    line-height: 1.5rem;
  }
}

@media (orientation: landscape) and (max-height: 30rem) and (hover: none) and (pointer: coarse) {
  .snake-layout {
    display: block;
  }

  .snake-orientation-tip {
    display: block;
    margin: 0 auto;
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4);
    border-radius: calc(var(--ui-radius) * 2);
    background: color-mix(in oklab, var(--ui-bg-elevated) 75%, transparent);
    color: var(--ui-text);
    text-align: center;
  }

  .snake-orientation-title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .snake-orientation-text {
    margin-top: calc(var(--spacing) * 1);
    color: var(--ui-text-muted);
    font-size: .8125rem;
    line-height: 1.35;
  }

  .snake-play-area,
  .snake-sidebar {
    display: none;
  }
}
</style>
