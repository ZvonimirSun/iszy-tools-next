import { describe, expect, it } from 'vitest'
import {
  chord,
  createGame,
  createGameWithConfig,
  formatCounter,
  getBoardConfig,
  getElapsedSeconds,
  getRemainingMines,
  normalizeConfig,
  plantMines,
  reveal,
  toggleFlag,
  toIndex,
} from './minesweeper.service'

function createPlantedGame(width: number, height: number, mineIndexes: number[]) {
  return plantMines(createGameWithConfig('custom', {
    width,
    height,
    mines: mineIndexes.length,
  }), mineIndexes)
}

function toRows<T>(items: T[], width: number) {
  const rows: T[][] = []
  for (let index = 0; index < items.length; index += width) {
    rows.push(items.slice(index, index + width))
  }
  return rows
}

describe('minesweeper.service', () => {
  it('标准化自定义棋盘范围', () => {
    expect(normalizeConfig({ width: 2, height: 100, mines: 999 })).toEqual({
      width: 5,
      height: 24,
      mines: 119,
    })
    expect(getBoardConfig('expert')).toEqual({ width: 30, height: 16, mines: 99 })
  })

  it('计算相邻地雷数量', () => {
    const game = createPlantedGame(5, 4, [0, 12, 19])

    expect(toRows(game.cells.map(cell => cell.mine ? 'M' : cell.adjacentMines), 5)).toEqual([
      ['M', 1, 0, 0, 0],
      [1, 2, 1, 1, 0],
      [0, 1, 'M', 2, 1],
      [0, 1, 1, 2, 'M'],
    ])
  })

  it('首次点击不会踩雷，并尽量留出开空', () => {
    const random = () => 0
    const revealed = reveal(createGame('beginner'), 0, { now: 1000, random })

    expect(revealed.minesPlaced).toBe(true)
    expect(revealed.status).not.toBe('lost')
    expect(revealed.cells[0]?.mine).toBe(false)
    expect(revealed.cells.filter(cell => cell.mine)).toHaveLength(10)
    expect(revealed.cells[0]?.revealed).toBe(true)
    expect(revealed.startAt).toBe(1000)
  })

  it('点击空格会递归翻开相邻格子', () => {
    const revealed = reveal(createPlantedGame(5, 4, [0, 12, 19]), 2, { now: 1 })

    expect(revealed.status).toBe('playing')
    expect(toRows(revealed.cells.map(cell => cell.revealed), 5)).toEqual([
      [false, true, true, true, true],
      [false, true, true, true, true],
      [false, false, false, true, true],
      [false, false, false, false, false],
    ])
  })

  it('插旗后不能直接翻开，剩余地雷数会变化', () => {
    const planted = createPlantedGame(3, 3, [0])
    const flagged = toggleFlag(planted, 0)

    expect(getRemainingMines(flagged)).toBe(0)
    expect(reveal(flagged, 0, { now: 1 }).cells[0]?.revealed).toBe(false)

    const unflagged = toggleFlag(flagged, 0)
    expect(getRemainingMines(unflagged)).toBe(1)
  })

  it('翻开地雷会失败并露出全部地雷', () => {
    const lost = reveal(createPlantedGame(3, 3, [0]), 0, { now: 8 })

    expect(lost.status).toBe('lost')
    expect(lost.explodedIndex).toBe(0)
    expect(lost.cells[0]?.revealed).toBe(true)
    expect(lost.endAt).toBe(8)
  })

  it('翻开全部安全格后获胜并自动插旗', () => {
    const won = reveal(createPlantedGame(3, 3, [0]), 8, { now: 12 })

    expect(won.status).toBe('won')
    expect(won.cells.every(cell => cell.mine ? cell.mark === 'flag' : cell.revealed)).toBe(true)
    expect(getElapsedSeconds(won, 50)).toBe(0)
  })

  it('数字格在插旗数量匹配时可以双击展开', () => {
    const planted = createPlantedGame(3, 3, [0, 1])
    const opened = reveal(planted, toIndex(2, 0, 3), { now: 1 })
    const flagged = toggleFlag(opened, 1)
    const expanded = chord(flagged, toIndex(2, 0, 3), { now: 2 })

    expect(expanded.status).toBe('playing')
    expect(expanded.cells[toIndex(1, 1, 3)]?.revealed).toBe(true)
    expect(expanded.cells[toIndex(2, 1, 3)]?.revealed).toBe(true)
  })

  it('错误插旗后展开会失败', () => {
    const planted = createPlantedGame(3, 3, [0, 1])
    const opened = reveal(planted, toIndex(2, 0, 3), { now: 1 })
    const wrongFlag = toggleFlag(opened, toIndex(2, 1, 3))
    const lost = chord(wrongFlag, toIndex(2, 0, 3), { now: 3 })

    expect(lost.status).toBe('lost')
    expect(lost.explodedIndex).toBe(1)
  })

  it('格式化计数器和计时', () => {
    expect(formatCounter(7)).toBe('007')
    expect(formatCounter(-2)).toBe('-002')

    const playing = reveal(createPlantedGame(3, 3, [0]), 1, { now: 1000 })
    expect(getElapsedSeconds(playing, 4500)).toBe(3)
  })
})
