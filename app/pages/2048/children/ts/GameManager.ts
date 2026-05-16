import type { Direction, GameState, GameView, Position } from '../2048.types'
import Grid from './Grid'
import Actuator from './HtmlActuator'
import InputManager from './KeyboardInputManager'
import Tile from './Tile'

export default class GameManager {
  view: GameView
  size: number
  inputManager: InputManager
  actuator: Actuator
  startTiles = 2
  grid!: Grid
  score = 0
  over = false
  won = false
  keepPlayingEnabled = false

  constructor(size: number, view: GameView) {
    this.view = view
    this.size = size // Size of the grid
    this.inputManager = new InputManager(view)
    // this.storageManager = new StorageManager()
    this.actuator = new Actuator(view)

    this.inputManager.on('move', direction => this.move(direction))
    this.inputManager.on('restart', this.restart.bind(this))
    this.inputManager.on('keepPlaying', this.keepPlaying.bind(this))

    this.setup()
  }

  destroy() {
    this.inputManager.destroy()
  }

  restart() {
    this.view.clearGameState()
    this.actuator.continueGame() // Clear the game won/lost message
    this.setup()
  }

  keepPlaying() {
    this.keepPlayingEnabled = true
    this.actuator.continueGame() // Clear the game won/lost message
  }

  isGameTerminated() {
    return this.over || (this.won && !this.keepPlayingEnabled)
  }

  setup() {
    const previousState = this.view.gameState

    // Reload the game from a previous game if present
    if (previousState) {
      try {
        this.grid = new Grid(previousState.grid.size, previousState.grid.cells) // Reload grid
        this.score = previousState.score
        this.over = previousState.over
        this.won = previousState.won
        this.keepPlayingEnabled = previousState.keepPlaying
      }
      catch {
        this.restart()
      }
    }
    else {
      this.grid = new Grid(this.size)
      this.score = 0
      this.over = false
      this.won = false
      this.keepPlayingEnabled = false

      // Add the initial tiles
      this.addStartTiles()
    }

    // Update the actuator
    this.actuate()
  }

  addStartTiles() {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile()
    }
  }

  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4
      const cell = this.grid.randomAvailableCell()
      if (!cell)
        return

      const tile = new Tile(cell, value)

      this.grid.insertTile(tile)
    }
  }

  actuate() {
    if (this.view.bestScore < this.score) {
      this.view.setBestScore(this.score)
    }

    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
      this.view.clearGameState()
    }
    else {
      this.view.setGameState(this.serialize())
    }

    this.view.state = {
      grid: this.grid,
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.view.bestScore,
      terminated: this.isGameTerminated(),
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.view.bestScore,
      terminated: this.isGameTerminated(),
    })
  }

  serialize(): GameState {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlayingEnabled,
    }
  }

  prepareTiles() {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null
        tile.savePosition()
      }
    })
  }

  moveTile(tile: Tile, cell: Position) {
    this.grid.cells[tile.x]![tile.y] = null
    this.grid.cells[cell.x]![cell.y] = tile
    tile.updatePosition(cell)
  }

  move(direction: Direction) {
    // 0: up, 1: right, 2: down, 3: left
    if (this.isGameTerminated())
      return // Don't do anything if the game's over

    let cell: Position
    let tile: Tile | null

    const vector = this.getVector(direction)
    const traversals = this.buildTraversals(vector)
    let moved = false

    // Save the current tile positions and remove merger information
    this.prepareTiles()

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        cell = { x, y }
        tile = this.grid.cellContent(cell)

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector)
          const next = this.grid.cellContent(positions.next)

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            const merged = new Tile(positions.next, tile.value * 2)
            merged.mergedFrom = [tile, next]

            this.grid.insertTile(merged)
            this.grid.removeTile(tile)

            // Converge the two tiles' positions
            tile.updatePosition(positions.next)

            // Update the score
            this.score += merged.value

            // The mighty 2048 tile
            if (merged.value === 2048)
              this.won = true
          }
          else {
            this.moveTile(tile, positions.farthest)
          }

          if (!this.positionsEqual(cell, tile)) {
            moved = true // The tile moved from its original cell!
          }
        }
      })
    })

    if (moved) {
      this.addRandomTile()

      if (!this.movesAvailable()) {
        this.over = true // Game over!
      }

      this.actuate()
    }
  }

  getVector(direction: Direction): Position {
    // Vectors representing tile movement
    const map: Record<Direction, Position> = {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 }, // Right
      2: { x: 0, y: 1 }, // Down
      3: { x: -1, y: 0 }, // Left
    }

    return map[direction]
  }

  buildTraversals(vector: Position) {
    const traversals: { x: number[], y: number[] } = { x: [], y: [] }

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos)
      traversals.y.push(pos)
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1)
      traversals.x = traversals.x.reverse()
    if (vector.y === 1)
      traversals.y = traversals.y.reverse()

    return traversals
  }

  findFarthestPosition(cell: Position, vector: Position) {
    let previous: Position

    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell
      cell = { x: previous.x + vector.x, y: previous.y + vector.y }
    } while (this.grid.withinBounds(cell)
      && this.grid.cellAvailable(cell))

    return {
      farthest: previous,
      next: cell, // Used to check if a merge is required
    }
  }

  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable()
  }

  tileMatchesAvailable() {
    let tile: Tile | null

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x, y })

        if (tile) {
          for (const direction of [0, 1, 2, 3] as Direction[]) {
            const vector = this.getVector(direction)
            const cell = { x: x + vector.x, y: y + vector.y }

            const other = this.grid.cellContent(cell)

            if (other && other.value === tile.value) {
              return true // These two tiles can be merged
            }
          }
        }
      }
    }

    return false
  }

  positionsEqual(first: Position, second: Position) {
    return first.x === second.x && first.y === second.y
  }
}
