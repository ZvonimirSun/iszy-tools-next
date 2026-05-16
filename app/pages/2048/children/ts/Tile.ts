import type { Position, SerializedTile } from '../2048.types'

export default class Tile {
  x: number
  y: number
  value: number
  previousPosition: Position | null
  mergedFrom: Tile[] | null

  constructor(position: Position, value = 2) {
    this.x = position.x
    this.y = position.y
    this.value = value

    this.previousPosition = null
    this.mergedFrom = null // Tracks tiles that merged together
  }

  savePosition() {
    this.previousPosition = { x: this.x, y: this.y }
  }

  updatePosition(position: Position) {
    this.x = position.x
    this.y = position.y
  }

  serialize(): SerializedTile {
    return {
      position: {
        x: this.x,
        y: this.y,
      },
      value: this.value,
    }
  }
}
