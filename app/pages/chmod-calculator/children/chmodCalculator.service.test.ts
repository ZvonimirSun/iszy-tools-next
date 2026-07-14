import { describe, expect, it } from 'vitest'
import { chmodStateToOctal, chmodStateToSymbolic, createEmptyChmodState, parseChmodOctal } from './chmodCalculator.service'

describe('chmodCalculator.service', () => {
  it('默认状态为 755', () => {
    const state = createEmptyChmodState()

    expect(chmodStateToOctal(state)).toBe('755')
    expect(chmodStateToSymbolic(state)).toBe('rwxr-xr-x')
  })

  it('解析八进制权限', () => {
    const state = parseChmodOctal('640')

    expect(state.owner).toEqual({ read: true, write: true, execute: false })
    expect(state.group).toEqual({ read: true, write: false, execute: false })
    expect(state.others).toEqual({ read: false, write: false, execute: false })
    expect(chmodStateToSymbolic(state)).toBe('rw-r-----')
  })

  it('拒绝非法权限值', () => {
    expect(() => parseChmodOctal('888')).toThrow('权限值必须是 3 位八进制数字')
    expect(() => parseChmodOctal('7555')).toThrow('权限值必须是 3 位八进制数字')
  })
})
