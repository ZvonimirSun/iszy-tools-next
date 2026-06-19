<script setup lang="ts">
type Cell = '' | TetrominoName
type DisplayCell = Cell | 'ghost'
type TetrominoName = 'i' | 'j' | 'l' | 'o' | 's' | 't' | 'z'
interface Point {
  x: number
  y: number
}
interface Piece {
  name: TetrominoName
  matrix: number[][]
  x: number
  y: number
}
type GameState = 'ready' | 'playing' | 'paused' | 'over'

const boardWidth = 10
const boardHeight = 20
const startX = 3

const settingsStore = useSettingsStore()
const mounted = useMounted()

const tetrominoes: Record<TetrominoName, number[][]> = {
  i: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  j: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  l: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  o: [
    [1, 1],
    [1, 1],
  ],
  s: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  t: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
}

const colorClass: Record<DisplayCell, string> = {
  '': 'tetris-cell-empty',
  'ghost': 'tetris-cell-ghost',
  'i': 'tetris-cell-i',
  'j': 'tetris-cell-j',
  'l': 'tetris-cell-l',
  'o': 'tetris-cell-o',
  's': 'tetris-cell-s',
  't': 'tetris-cell-t',
  'z': 'tetris-cell-z',
}

const board = ref<Cell[][]>(createBoard())
const currentPiece = ref<Piece | null>(null)
const nextPieceName = ref<TetrominoName>('t')
const state = ref<GameState>('ready')
const score = ref(0)
const clearedLines = ref(0)
const level = computed(() => Math.floor(clearedLines.value / 10) + 1)
const bestScore = computed(() => mounted.value ? settingsStore.modules.tetris.bestScore : 0)
const tickMs = computed(() => Math.max(120, 820 - (level.value - 1) * 70))
const pauseActionLabel = computed(() => {
  if (state.value === 'paused') {
    return '继续'
  }
  return state.value === 'playing' ? '暂停' : '开始'
})
const pauseActionIcon = computed(() => {
  if (state.value === 'paused' || state.value === 'ready' || state.value === 'over') {
    return 'i-lucide:play'
  }
  return 'i-lucide:pause'
})
const cells = computed(() => {
  const merged = board.value.map(row => [...row] as DisplayCell[])
  const ghost = currentPiece.value ? getGhostPiece(currentPiece.value) : null

  if (ghost) {
    applyPieceToDisplay(merged, ghost, 'ghost')
  }
  if (currentPiece.value) {
    applyPieceToDisplay(merged, currentPiece.value, currentPiece.value.name)
  }

  return merged.flat()
})
const nextCells = computed(() => {
  const preview = Array.from({ length: 4 }, () => Array.from<DisplayCell>({ length: 4 }).fill(''))
  applyPieceToDisplay(preview, { name: nextPieceName.value, matrix: cloneMatrix(tetrominoes[nextPieceName.value]), x: 0, y: 0 }, nextPieceName.value)
  return preview.flat()
})

let timer: ReturnType<typeof setInterval> | null = null

function createBoard() {
  return Array.from({ length: boardHeight }, () => Array.from<Cell>({ length: boardWidth }).fill(''))
}

function cloneMatrix(matrix: number[][]) {
  return matrix.map(row => [...row])
}

function randomPieceName(): TetrominoName {
  const names = Object.keys(tetrominoes) as TetrominoName[]
  return names[Math.floor(Math.random() * names.length)] ?? 't'
}

function createPiece(name: TetrominoName): Piece {
  return {
    name,
    matrix: cloneMatrix(tetrominoes[name]),
    x: startX,
    y: -1,
  }
}

function eachBlock(piece: Piece, callback: (point: Point) => void) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        callback({ x: piece.x + x, y: piece.y + y })
      }
    })
  })
}

function isValid(piece: Piece) {
  let valid = true
  eachBlock(piece, ({ x, y }) => {
    if (x < 0 || x >= boardWidth || y >= boardHeight) {
      valid = false
      return
    }
    if (y >= 0 && board.value[y]?.[x]) {
      valid = false
    }
  })
  return valid
}

function applyPieceToDisplay(target: DisplayCell[][], piece: Piece, value: DisplayCell) {
  eachBlock(piece, ({ x, y }) => {
    const row = target[y]
    if (!row || x < 0 || x >= row.length) {
      return
    }
    if (value === 'ghost' && row[x]) {
      return
    }
    row[x] = value
  })
}

function rotateMatrix(matrix: number[][]) {
  const firstRow = matrix[0]
  if (!firstRow) {
    return []
  }

  return firstRow.map((_, index) => matrix.map(row => row[index] ?? 0).reverse())
}

function rotatePiece() {
  if (state.value !== 'playing' || !currentPiece.value) {
    return
  }
  const rotated = { ...currentPiece.value, matrix: rotateMatrix(currentPiece.value.matrix) }
  const kicks = [0, -1, 1, -2, 2]
  const kicked = kicks.map(offset => ({ ...rotated, x: rotated.x + offset })).find(isValid)
  if (kicked) {
    currentPiece.value = kicked
  }
}

function movePiece(offsetX: number, offsetY: number) {
  if (state.value !== 'playing' || !currentPiece.value) {
    return false
  }
  const moved = { ...currentPiece.value, x: currentPiece.value.x + offsetX, y: currentPiece.value.y + offsetY }
  if (!isValid(moved)) {
    return false
  }
  currentPiece.value = moved
  return true
}

function softDrop() {
  if (movePiece(0, 1)) {
    score.value += 1
    updateBestScore()
    return
  }
  lockPiece()
}

function hardDrop() {
  if (state.value !== 'playing' || !currentPiece.value) {
    return
  }
  let distance = 0
  while (movePiece(0, 1)) {
    distance += 1
  }
  score.value += distance * 2
  lockPiece()
}

function getGhostPiece(piece: Piece) {
  const ghost = { ...piece, matrix: cloneMatrix(piece.matrix) }
  while (isValid({ ...ghost, y: ghost.y + 1 })) {
    ghost.y += 1
  }
  return ghost
}

function lockPiece() {
  if (!currentPiece.value) {
    return
  }
  const pieceName = currentPiece.value.name
  const nextBoard = board.value.map(row => [...row])
  eachBlock(currentPiece.value, ({ x, y }) => {
    const row = nextBoard[y]
    if (row && x >= 0 && x < row.length) {
      row[x] = pieceName
    }
  })
  board.value = nextBoard
  clearLines()
  spawnPiece()
}

function clearLines() {
  const remaining = board.value.filter(row => row.some(cell => !cell))
  const cleared = boardHeight - remaining.length

  if (!cleared) {
    return
  }

  const additions = Array.from({ length: cleared }, () => Array.from<Cell>({ length: boardWidth }).fill(''))
  board.value = [...additions, ...remaining]
  clearedLines.value += cleared
  score.value += ([0, 100, 300, 500, 800][cleared] ?? 0) * level.value
  updateBestScore()
}

function spawnPiece() {
  const piece = createPiece(nextPieceName.value)
  nextPieceName.value = randomPieceName()
  currentPiece.value = piece

  if (!isValid(piece)) {
    state.value = 'over'
    stopTimer()
    updateBestScore()
  }
}

function updateBestScore() {
  if (score.value > settingsStore.modules.tetris.bestScore) {
    settingsStore.modules.tetris.bestScore = score.value
  }
}

function startGame() {
  board.value = createBoard()
  score.value = 0
  clearedLines.value = 0
  nextPieceName.value = randomPieceName()
  state.value = 'playing'
  spawnPiece()
  restartTimer()
}

function togglePause() {
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

function tick() {
  if (!movePiece(0, 1)) {
    lockPiece()
  }
}

function restartTimer() {
  stopTimer()
  timer = setInterval(tick, tickMs.value)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function handleKeydown(event: KeyboardEvent) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P', 'r', 'R']
  if (!keys.includes(event.key)) {
    return
  }
  event.preventDefault()

  if (event.key === 'ArrowLeft') {
    movePiece(-1, 0)
  }
  else if (event.key === 'ArrowRight') {
    movePiece(1, 0)
  }
  else if (event.key === 'ArrowDown') {
    softDrop()
  }
  else if (event.key === 'ArrowUp') {
    rotatePiece()
  }
  else if (event.key === ' ') {
    hardDrop()
  }
  else if (event.key.toLowerCase() === 'p') {
    togglePause()
  }
  else if (event.key.toLowerCase() === 'r') {
    startGame()
  }
}

watch(tickMs, () => {
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
</script>

<template>
  <div class="min-h-full w-full overflow-auto">
    <div class="tetris-layout">
      <div class="tetris-orientation-tip">
        <div class="tetris-orientation-title">
          建议竖屏游玩
        </div>
        <div class="tetris-orientation-text">
          当前横屏高度较小，竖屏可以获得更完整的棋盘、预览和操作空间。
        </div>
      </div>

      <section class="tetris-play-area">
        <div class="tetris-board-wrap">
          <div class="tetris-mobile-hud">
            <div class="tetris-mobile-stats">
              <div class="tetris-stat">
                <span>得分</span>
                <strong>{{ score }}</strong>
              </div>
              <div class="tetris-stat">
                <span>最高</span>
                <strong>{{ bestScore }}</strong>
              </div>
              <div class="tetris-stat">
                <span>等级</span>
                <strong>{{ level }}</strong>
              </div>
            </div>

            <div class="tetris-next-compact">
              <span>下一个</span>
              <div class="tetris-preview tetris-preview-compact">
                <div
                  v-for="(cell, index) in nextCells"
                  :key="index"
                  class="tetris-cell"
                  :class="colorClass[cell]"
                />
              </div>
            </div>
          </div>

          <div class="tetris-board">
            <div
              v-for="(cell, index) in cells"
              :key="index"
              class="tetris-cell"
              :class="colorClass[cell]"
            />
          </div>

          <div class="tetris-controls">
            <UButton block color="neutral" variant="soft" icon="i-lucide:arrow-left" @click="movePiece(-1, 0)">
              左
            </UButton>
            <UButton block color="neutral" variant="soft" icon="i-lucide:rotate-cw" @click="rotatePiece">
              旋转
            </UButton>
            <UButton block color="neutral" variant="soft" icon="i-lucide:arrow-right" @click="movePiece(1, 0)">
              右
            </UButton>
            <UButton block color="neutral" variant="soft" icon="i-lucide:arrow-down" @click="softDrop">
              下落
            </UButton>
            <UButton block color="primary" variant="soft" icon="i-lucide:chevrons-down" @click="hardDrop">
              直落
            </UButton>
            <UButton block color="neutral" variant="soft" :icon="pauseActionIcon" @click="togglePause">
              {{ pauseActionLabel }}
            </UButton>
          </div>
        </div>
      </section>

      <aside class="tetris-sidebar">
        <ContainerToolItem content-class="flex flex-col gap-4">
          <div class="tetris-sidebar-stats grid grid-cols-2 gap-2">
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
                等级
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ level }}
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3">
              <div class="text-xs text-muted">
                消除行
              </div>
              <div class="mt-1 text-2xl font-semibold text-highlighted tabular-nums">
                {{ clearedLines }}
              </div>
            </div>
          </div>

          <div class="tetris-sidebar-next">
            <div class="mb-2 text-sm text-muted">
              下一个
            </div>
            <div class="tetris-preview">
              <div
                v-for="(cell, index) in nextCells"
                :key="index"
                class="tetris-cell"
                :class="colorClass[cell]"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              class="flex-1"
              color="primary"
              :icon="state === 'playing' ? 'i-lucide:rotate-ccw' : 'i-lucide:play'"
              @click="startGame"
            >
              {{ state === 'playing' ? '重开' : '开始' }}
            </UButton>
            <UButton
              class="flex-1"
              color="neutral"
              variant="soft"
              :icon="pauseActionIcon"
              @click="togglePause"
            >
              {{ pauseActionLabel }}
            </UButton>
          </div>

          <div class="rounded-lg bg-muted/40 p-3 text-sm text-muted">
            <div class="font-medium text-toned">
              键盘
            </div>
            <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <span>移动</span><span>← →</span>
              <span>旋转</span><span>↑</span>
              <span>软降</span><span>↓</span>
              <span>直落</span><span>空格</span>
              <span>暂停</span><span>P</span>
              <span>重开</span><span>R</span>
            </div>
          </div>
        </ContainerToolItem>
      </aside>
    </div>
  </div>
</template>

<style>
.tetris-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: calc(var(--spacing) * 4);
  width: 100%;
}

.tetris-orientation-tip {
  display: none;
}

.tetris-play-area,
.tetris-sidebar {
  min-width: 0;
}

.tetris-board-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
  width: min(100%, calc(var(--spacing) * 80));
  margin-inline: auto;
}

.tetris-mobile-hud {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: calc(var(--spacing) * 3);
  align-items: stretch;
}

.tetris-mobile-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--spacing) * 2);
}

.tetris-stat {
  min-width: 0;
  padding: calc(var(--spacing) * 2);
  border-radius: calc(var(--ui-radius) * 2);
  background: color-mix(in oklab, var(--ui-bg-muted) 70%, transparent);
}

.tetris-stat span,
.tetris-next-compact span {
  display: block;
  color: var(--ui-text-muted);
  font-size: .75rem;
  line-height: 1rem;
}

.tetris-stat strong {
  display: block;
  margin-top: calc(var(--spacing) * 0.5);
  color: var(--ui-text-highlighted);
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.tetris-next-compact {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1);
  align-items: flex-start;
}

.tetris-board {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  grid-template-rows: repeat(20, minmax(0, 1fr));
  gap: calc(var(--spacing) * 0.5);
  aspect-ratio: 1 / 2;
  padding: calc(var(--spacing) * 2);
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg-elevated);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

.tetris-preview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: calc(var(--spacing) * 0.5);
  width: calc(var(--spacing) * 28);
  height: calc(var(--spacing) * 28);
  padding: calc(var(--spacing) * 2);
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-bg-elevated);
}

.tetris-preview-compact {
  width: calc(var(--spacing) * 18);
  height: calc(var(--spacing) * 18);
  padding: calc(var(--spacing) * 1.5);
}

.tetris-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--spacing) * 2);
  width: 100%;
}

.tetris-cell {
  min-width: 0;
  min-height: 0;
  border-radius: var(--ui-radius);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, white 28%, transparent);
}

.tetris-cell-empty {
  background: var(--ui-bg);
  box-shadow: inset 0 0 0 1px var(--ui-border-muted);
}

.tetris-cell-ghost {
  background: color-mix(in oklab, var(--ui-bg-muted) 38%, transparent);
  box-shadow: inset 0 0 0 2px var(--ui-border-accented);
}

.dark .tetris-cell-ghost {
  background: color-mix(in oklab, var(--ui-bg-accented) 45%, transparent);
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ui-border-inverted) 28%, var(--ui-border-accented));
}

.tetris-cell-i {
  background: #22d3ee;
}

.tetris-cell-j {
  background: #3b82f6;
}

.tetris-cell-l {
  background: #f59e0b;
}

.tetris-cell-o {
  background: #facc15;
}

.tetris-cell-s {
  background: #10b981;
}

.tetris-cell-t {
  background: #8b5cf6;
}

.tetris-cell-z {
  background: #f43f5e;
}

@media (min-width: 80rem) {
  .tetris-layout {
    grid-template-columns: minmax(0, 1fr) minmax(calc(var(--spacing) * 72), calc(var(--spacing) * 88));
    align-items: start;
  }

  .tetris-mobile-hud {
    display: none;
  }
}

@media (max-width: 79.999rem) {
  .tetris-sidebar-stats,
  .tetris-sidebar-next {
    display: none;
  }
}

@media (max-width: 30rem) {
  .tetris-board-wrap {
    width: min(100%, calc(var(--spacing) * 72));
    gap: calc(var(--spacing) * 3);
  }

  .tetris-mobile-hud {
    gap: calc(var(--spacing) * 2);
  }

  .tetris-mobile-stats,
  .tetris-controls {
    gap: calc(var(--spacing) * 1.5);
  }

  .tetris-stat {
    padding: calc(var(--spacing) * 1.5);
  }

  .tetris-stat strong {
    font-size: 1rem;
    line-height: 1.5rem;
  }

  .tetris-preview-compact {
    width: calc(var(--spacing) * 16);
    height: calc(var(--spacing) * 16);
    padding: calc(var(--spacing) * 1);
  }
}

@media (orientation: landscape) and (max-height: 30rem) and (hover: none) and (pointer: coarse) {
  .tetris-layout {
    display: block;
  }

  .tetris-orientation-tip {
    display: block;
    margin: 0 auto;
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4);
    border-radius: calc(var(--ui-radius) * 2);
    background: color-mix(in oklab, var(--ui-bg-elevated) 75%, transparent);
    color: var(--ui-text);
    text-align: center;
  }

  .tetris-orientation-title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .tetris-orientation-text {
    margin-top: calc(var(--spacing) * 1);
    color: var(--ui-text-muted);
    font-size: .8125rem;
    line-height: 1.35;
  }

  .tetris-play-area,
  .tetris-sidebar {
    display: none;
  }
}
</style>
