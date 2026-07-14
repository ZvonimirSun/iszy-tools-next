import { describe, expect, it } from 'vitest'
import { generateRandomPorts } from './randomPort.service'

describe('randomPort.service', () => {
  it('生成指定范围内端口', () => {
    const ports = generateRandomPorts({ min: 3000, max: 3010, count: 5, unique: false })

    expect(ports).toHaveLength(5)
    expect(ports.every(port => port >= 3000 && port <= 3010)).toBe(true)
  })

  it('避开系统保留端口范围', () => {
    const ports = generateRandomPorts({ min: 0, max: 2000, count: 20, unique: true })

    expect(ports.every(port => port >= 1024 && port <= 2000)).toBe(true)
  })

  it('支持唯一端口', () => {
    const ports = generateRandomPorts({ min: 4000, max: 4010, count: 10, unique: true })

    expect(new Set(ports).size).toBe(10)
  })

  it('检测非法范围', () => {
    expect(() => generateRandomPorts({ min: 10, max: 1, count: 1, unique: false })).toThrow('最小端口不能大于最大端口')
    expect(() => generateRandomPorts({ min: 1, max: 2, count: 3, unique: true })).toThrow('唯一端口数量不能超过范围大小')
  })
})
