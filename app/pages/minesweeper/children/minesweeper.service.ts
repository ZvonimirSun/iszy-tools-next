export type DifficultyId = 'beginner' | 'intermediate' | 'expert' | 'custom'
export type CellMark = 'none' | 'flag'
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'
export type RandomFn = () => number

export interface BoardConfig {
  width: number
  height: number
  mines: number
}

export interface Cell {
  mine: boolean
  revealed: boolean
  mark: CellMark
  adjacentMines: number
}

export interface GameState {
  config: BoardConfig
  difficulty: DifficultyId
  status: GameStatus
  cells: Cell[]
  startAt: number | null
  endAt: number | null
  explodedIndex: number | null
  minesPlaced: boolean
}

export interface MinesweeperSettings {
  bestTimes: Record<Exclude<DifficultyId, 'custom'>, number | null>
  lastDifficulty: DifficultyId
  custom: BoardConfig
}

export const PRESET_DIFFICULTIES: Record<Exclude<DifficultyId, 'custom'>, BoardConfig> = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
}

export const CUSTOM_LIMITS = {
  minSize: 5,
  maxWidth: 40,
  maxHeight: 24,
  minMines: 1,
}

const NEIGHBOR_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const

export function createDefaultMinesweeperSettings(): MinesweeperSettings {
  return {
    bestTimes: {
      beginner: null,
      intermediate: null,
      expert: null,
    },
    lastDifficulty: 'beginner',
    custom: { ...PRESET_DIFFICULTIES.beginner },
  }
}

export function normalizeConfig(config: BoardConfig): BoardConfig {
  const width = clamp(Math.trunc(config.width), CUSTOM_LIMITS.minSize, CUSTOM_LIMITS.maxWidth)
  const height = clamp(Math.trunc(config.height), CUSTOM_LIMITS.minSize, CUSTOM_LIMITS.maxHeight)
  const maxMines = width * height - 1
  const mines = clamp(Math.trunc(config.mines), CUSTOM_LIMITS.minMines, maxMines)
  return { width, height, mines }
}

export function getBoardConfig(difficulty: DifficultyId, custom?: BoardConfig): BoardConfig {
  if (difficulty === 'custom') {
    return normalizeConfig(custom ?? PRESET_DIFFICULTIES.beginner)
  }
  return { ...PRESET_DIFFICULTIES[difficulty] }
}

export function createGame(difficulty: DifficultyId, custom?: BoardConfig): GameState {
  return createGameWithConfig(difficulty, getBoardConfig(difficulty, custom))
}

export function createGameWithConfig(difficulty: DifficultyId, config: BoardConfig): GameState {
  return {
    config: { ...config },
    difficulty,
    status: 'ready',
    cells: Array.from({ length: config.width * config.height }, () => createEmptyCell()),
    startAt: null,
    endAt: null,
    explodedIndex: null,
    minesPlaced: false,
  }
}

export function plantMines(state: GameState, mineIndices: number[]): GameState {
  const uniqueIndices = [...new Set(mineIndices)]
  if (uniqueIndices.length !== state.config.mines) {
    throw new Error('地雷数量必须与棋盘配置一致')
  }
  if (uniqueIndices.some(index => !isInsideIndex(state, index))) {
    throw new Error('地雷位置超出棋盘范围')
  }

  const next = cloneState(state)
  for (const index of uniqueIndices) {
    next.cells[index]!.mine = true
  }
  fillAdjacentCounts(next)
  next.minesPlaced = true
  return next
}

export function reveal(state: GameState, index: number, options: { now?: number, random?: RandomFn } = {}): GameState {
  if (isFinished(state) || !isInsideIndex(state, index)) {
    return state
  }

  const now = options.now ?? Date.now()
  const next = state.minesPlaced ? cloneState(state) : ensureMines(state, index, now, options.random)
  if (next.status === 'ready') {
    next.status = 'playing'
    next.startAt = now
  }
  const cell = next.cells[index]
  if (!cell || cell.revealed || cell.mark === 'flag') {
    return next
  }

  if (cell.mine) {
    return finishLost(next, index, now)
  }

  floodReveal(next, index)
  return maybeFinishWon(next, now)
}

export function toggleFlag(state: GameState, index: number): GameState {
  if (isFinished(state) || !isInsideIndex(state, index)) {
    return state
  }

  const cell = state.cells[index]
  if (!cell || cell.revealed) {
    return state
  }

  const next = cloneState(state)
  next.cells[index]!.mark = cell.mark === 'flag' ? 'none' : 'flag'
  return next
}

export function chord(state: GameState, index: number, options: { now?: number } = {}): GameState {
  if (isFinished(state) || !isInsideIndex(state, index) || !state.minesPlaced) {
    return state
  }

  const cell = state.cells[index]
  if (!cell?.revealed || cell.adjacentMines === 0) {
    return state
  }

  const neighborIndexes = getNeighborIndexes(index, state.config)
  const flagCount = neighborIndexes.filter(neighbor => state.cells[neighbor]?.mark === 'flag').length
  if (flagCount !== cell.adjacentMines) {
    return state
  }

  const now = options.now ?? Date.now()
  const targets = neighborIndexes.filter((neighbor) => {
    const neighborCell = state.cells[neighbor]
    return neighborCell && !neighborCell.revealed && neighborCell.mark !== 'flag'
  })
  if (!targets.length) {
    return state
  }

  const hitMines = targets.filter(target => state.cells[target]?.mine)
  if (hitMines.length) {
    const next = cloneState(state)
    return finishLost(next, hitMines[0]!, now)
  }

  const next = cloneState(state)
  for (const target of targets) {
    floodReveal(next, target)
  }
  return maybeFinishWon(next, now)
}

export function getRemainingMines(state: GameState) {
  const flagged = state.cells.filter(cell => cell.mark === 'flag').length
  return state.config.mines - flagged
}

export function getElapsedSeconds(state: GameState, now = Date.now()) {
  if (state.startAt == null) {
    return 0
  }
  const end = state.endAt ?? now
  return clamp(Math.floor((end - state.startAt) / 1000), 0, 999)
}

export function formatCounter(value: number) {
  const sign = value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toString().padStart(3, '0')}`
}

export function isFinished(state: GameState) {
  return state.status === 'won' || state.status === 'lost'
}

export function isPresetDifficulty(difficulty: DifficultyId): difficulty is Exclude<DifficultyId, 'custom'> {
  return difficulty !== 'custom'
}

export function toIndex(x: number, y: number, width: number) {
  return y * width + x
}

function createEmptyCell(): Cell {
  return {
    mine: false,
    revealed: false,
    mark: 'none',
    adjacentMines: 0,
  }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    config: { ...state.config },
    cells: state.cells.map(cell => ({ ...cell })),
  }
}

function ensureMines(state: GameState, safeIndex: number, now: number, random: RandomFn = Math.random): GameState {
  const next = cloneState(state)
  const protectedIndexes = getProtectedIndexes(safeIndex, next.config)
  const candidates: number[] = []
  for (let index = 0; index < next.cells.length; index += 1) {
    if (!protectedIndexes.has(index)) {
      candidates.push(index)
    }
  }

  const chosen = shuffle(candidates, random).slice(0, next.config.mines)
  for (const index of chosen) {
    next.cells[index]!.mine = true
  }
  fillAdjacentCounts(next)
  next.minesPlaced = true
  next.status = 'playing'
  next.startAt = now
  return next
}

function getProtectedIndexes(safeIndex: number, config: BoardConfig) {
  const neighborhood = [safeIndex, ...getNeighborIndexes(safeIndex, config)]
  const remaining = config.width * config.height - neighborhood.length
  if (remaining >= config.mines) {
    return new Set(neighborhood)
  }
  return new Set([safeIndex])
}

function fillAdjacentCounts(state: GameState) {
  state.cells.forEach((cell, index) => {
    if (cell.mine) {
      cell.adjacentMines = 0
      return
    }
    cell.adjacentMines = getNeighborIndexes(index, state.config)
      .filter(neighbor => state.cells[neighbor]?.mine)
      .length
  })
}

function floodReveal(state: GameState, startIndex: number) {
  const stack = [startIndex]
  while (stack.length) {
    const index = stack.pop()!
    const cell = state.cells[index]
    if (!cell || cell.revealed || cell.mark === 'flag' || cell.mine) {
      continue
    }
    cell.revealed = true
    if (cell.adjacentMines === 0) {
      stack.push(...getNeighborIndexes(index, state.config))
    }
  }
}

function maybeFinishWon(state: GameState, now: number) {
  const unrevealedSafe = state.cells.some(cell => !cell.mine && !cell.revealed)
  if (unrevealedSafe) {
    return state
  }

  for (const cell of state.cells) {
    if (cell.mine) {
      cell.mark = 'flag'
    }
  }
  state.status = 'won'
  state.endAt = now
  return state
}

function finishLost(state: GameState, explodedIndex: number, now: number) {
  state.cells.forEach((cell) => {
    if (cell.mine) {
      cell.revealed = true
    }
  })
  state.status = 'lost'
  state.explodedIndex = explodedIndex
  state.endAt = now
  return state
}

function getNeighborIndexes(index: number, config: BoardConfig) {
  const x = index % config.width
  const y = Math.floor(index / config.width)
  const neighbors: number[] = []
  for (const [offsetX, offsetY] of NEIGHBOR_OFFSETS) {
    const nextX = x + offsetX
    const nextY = y + offsetY
    if (nextX >= 0 && nextX < config.width && nextY >= 0 && nextY < config.height) {
      neighbors.push(toIndex(nextX, nextY, config.width))
    }
  }
  return neighbors
}

function isInsideIndex(state: GameState, index: number) {
  return Number.isInteger(index) && index >= 0 && index < state.cells.length
}

function shuffle<T>(items: T[], random: RandomFn) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const current = result[i]!
    result[i] = result[j]!
    result[j] = current
  }
  return result
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
