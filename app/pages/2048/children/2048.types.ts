export interface Position {
  x: number
  y: number
}

export interface SerializedTile {
  position: Position
  value: number
}

export interface SerializedGrid {
  size: number
  cells: Array<Array<SerializedTile | null>>
}

export interface GameState {
  grid: SerializedGrid
  score: number
  over: boolean
  won: boolean
  keepPlaying: boolean
}

export interface GameRefs {
  tileContainer: HTMLElement
  scoreContainer: HTMLElement
  bestContainer: HTMLElement
  messageContainer: HTMLElement
  retryButton: HTMLElement
  restartButton: HTMLElement
  keepPlayingButton: HTMLElement
  gameContainer: HTMLElement
}

export interface GameView {
  refs: GameRefs
  gameState: GameState | null
  bestScore: number
  state: GameUiState | null
  setBestScore: (bestScore: number) => void
  setGameState: (gameState?: GameState) => void
  clearGameState: () => void
}

export interface GameUiState {
  grid: unknown
  score: number
  over: boolean
  won: boolean
  bestScore: number
  terminated: boolean
}

export interface ActuateMetadata {
  score: number
  over: boolean
  won: boolean
  bestScore: number
  terminated: boolean
}

export type Direction = 0 | 1 | 2 | 3
