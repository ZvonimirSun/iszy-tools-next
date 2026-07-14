import { describe, expect, it } from 'vitest'
import { percentChange, percentRatio, percentageOf } from './percentageCalculator.service'

describe('percentageCalculator.service', () => {
  it('计算某数的百分比', () => {
    expect(percentageOf(200, 15)).toBe(30)
  })

  it('计算占比', () => {
    expect(percentRatio(25, 200)).toBe(12.5)
    expect(() => percentRatio(1, 0)).toThrow('总数不能为 0')
  })

  it('计算增长率', () => {
    expect(percentChange(100, 125)).toBe(25)
    expect(percentChange(100, 75)).toBe(-25)
    expect(() => percentChange(0, 1)).toThrow('起始值不能为 0')
  })
})
