import type { Position, SerializedGrid, SerializedTile } from '../2048.types'
import Tile from './Tile'

export default class Grid {
  size: number
  cells: Array<Array<Tile | null>>

  constructor(size: number, previousState?: SerializedGrid['cells']) {
    this.size = size
    this.cells = previousState ? this.fromState(previousState) : this.empty()
  }

  // Build a grid of the specified size
  empty() {
    const cells: Array<Array<Tile | null>> = []

    for (let x = 0; x < this.size; x++) {
      const row: Array<Tile | null> = []

      for (let y = 0; y < this.size; y++) {
        row.push(null)
      }

      cells[x] = row
    }

    return cells
  }

  fromState(state: SerializedGrid['cells']) {
    const cells: Array<Array<Tile | null>> = []

    for (let x = 0; x < this.size; x++) {
      const row: Array<Tile | null> = []

      for (let y = 0; y < this.size; y++) {
        const tile: SerializedTile | null = state[x]?.[y] ?? null
        row.push(tile ? new Tile(tile.position, tile.value) : null)
      }

      cells[x] = row
    }

    return cells
  }

  // Find the first available random position
  randomAvailableCell() {
    const cells = this.availableCells()

    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)]
    }

    return null
  }

  availableCells() {
    const cells: Position[] = []

    this.eachCell((x, y, tile) => {
      if (!tile) {
        cells.push({ x, y })
      }
    })

    return cells
  }

  // Call callback for every cell
  eachCell(callback: (x: number, y: number, tile: Tile | null) => void) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x]?.[y] ?? null)
      }
    }
  }

  // Check if there are any cells available
  cellsAvailable() {
    return !!this.availableCells().length
  }

  // Check if the specified cell is taken
  cellAvailable(cell: Position) {
    return !this.cellOccupied(cell)
  }

  cellOccupied(cell: Position) {
    return !!this.cellContent(cell)
  }

  cellContent(cell: Position) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x]?.[cell.y] ?? null
    }
    else {
      return null
    }
  }

  // Inserts a tile at its position
  insertTile(tile: Tile) {
    this.cells[tile.x]![tile.y] = tile
  }

  removeTile(tile: Tile) {
    this.cells[tile.x]![tile.y] = null
  }

  withinBounds(position: Position) {
    return position.x >= 0 && position.x < this.size
      && position.y >= 0 && position.y < this.size
  }

  serialize(): SerializedGrid {
    const cellState: SerializedGrid['cells'] = []

    for (let x = 0; x < this.size; x++) {
      const row: Array<SerializedTile | null> = []

      for (let y = 0; y < this.size; y++) {
        const tile = this.cells[x]?.[y] ?? null
        row.push(tile ? tile.serialize() : null)
      }

      cellState[x] = row
    }

    return {
      size: this.size,
      cells: cellState,
    }
  }
}
