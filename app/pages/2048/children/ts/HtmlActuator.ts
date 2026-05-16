import type { ActuateMetadata, GameView, Position } from '../2048.types'
import type Grid from './Grid'
import type Tile from './Tile'

export default class HtmlActuator {
  view: GameView
  tileContainer: HTMLElement
  scoreContainer: HTMLElement
  bestContainer: HTMLElement
  messageContainer: HTMLElement
  score = 0

  constructor(view: GameView) {
    this.view = view
    this.tileContainer = this.view.refs.tileContainer
    this.scoreContainer = this.view.refs.scoreContainer
    this.bestContainer = this.view.refs.bestContainer
    this.messageContainer = this.view.refs.messageContainer
  }

  actuate(grid: Grid, metadata: ActuateMetadata) {
    window.requestAnimationFrame(() => {
      this.clearContainer(this.tileContainer)

      grid.cells.forEach((column) => {
        column.forEach((cell) => {
          if (cell) {
            this.addTile(cell)
          }
        })
      })

      this.updateScore(metadata.score)
      this.updateBestScore(metadata.bestScore)

      if (metadata.terminated) {
        if (metadata.over) {
          this.message(false) // You lose
        }
        else if (metadata.won) {
          this.message(true) // You win!
        }
      }
    })
  }

  // Continues the game (both restart and keep playing)
  continueGame() {
    this.clearMessage()
  }

  clearContainer(container: HTMLElement) {
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
  }

  addTile(tile: Tile) {
    const wrapper = document.createElement('div')
    const inner = document.createElement('div')
    const position = tile.previousPosition || { x: tile.x, y: tile.y }
    const positionClass = this.positionClass(position)

    // We can't use classlist because it somehow glitches when replacing classes
    const classes = ['tile', `tile-${tile.value}`, positionClass]

    if (tile.value > 2048)
      classes.push('tile-super')

    this.applyClasses(wrapper, classes)

    inner.classList.add('tile-inner')
    inner.textContent = String(tile.value)

    if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(() => {
        classes[2] = this.positionClass({ x: tile.x, y: tile.y })
        this.applyClasses(wrapper, classes) // Update the position
      })
    }
    else if (tile.mergedFrom) {
      classes.push('tile-merged')
      this.applyClasses(wrapper, classes)

      // Render the tiles that merged
      tile.mergedFrom.forEach((merged) => {
        this.addTile(merged)
      })
    }
    else {
      classes.push('tile-new')
      this.applyClasses(wrapper, classes)
    }

    // Add the inner part of the tile to the wrapper
    wrapper.appendChild(inner)

    // Put the tile on the board
    this.tileContainer.appendChild(wrapper)
  }

  applyClasses(element: HTMLElement, classes: string[]) {
    element.setAttribute('class', classes.join(' '))
  }

  normalizePosition(position: Position) {
    return { x: position.x + 1, y: position.y + 1 }
  }

  positionClass(position: Position) {
    position = this.normalizePosition(position)
    return `tile-position-${position.x}-${position.y}`
  }

  updateScore(score: number) {
    this.clearContainer(this.scoreContainer)

    const difference = score - this.score
    this.score = score

    this.scoreContainer.textContent = String(this.score)

    if (difference > 0) {
      const addition = document.createElement('div')
      addition.classList.add('score-addition')
      addition.textContent = `+${difference}`

      this.scoreContainer.appendChild(addition)
    }
  }

  updateBestScore(bestScore: number) {
    this.bestContainer.textContent = String(bestScore)
  }

  message(won: boolean) {
    const type = won ? 'game-won' : 'game-over'
    const message = won ? '你赢啦!' : '游戏结束!'

    this.messageContainer.classList.add(type)
    const messageText = this.messageContainer.getElementsByTagName('p')[0]
    if (messageText)
      messageText.textContent = message
  }

  clearMessage() {
  // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove('game-won')
    this.messageContainer.classList.remove('game-over')
  }
}
