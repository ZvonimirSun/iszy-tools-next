import { describe, expect, it } from 'vitest'
import { analyzePassword } from './passwordStrength.service'

describe('passwordStrength.service', () => {
  it('识别空密码和弱密码', () => {
    expect(analyzePassword('').score).toBe(0)

    const weak = analyzePassword('password123')
    expect(weak.score).toBeLessThanOrEqual(1)
    expect(weak.suggestions.some(item => item.includes('常见'))).toBe(true)
  })

  it('根据字符集估算池大小和熵', () => {
    const result = analyzePassword('Aa1!')

    expect(result.poolSize).toBe(94)
    expect(Math.round(result.entropyBits)).toBe(26)
  })

  it('特殊字符池大小与常见估算模型一致', () => {
    expect(analyzePassword('-_(').poolSize).toBe(32)
  })

  it('长随机密码得分更高', () => {
    expect(analyzePassword('9vK$2qLm#8pZ!4tR').score).toBeGreaterThanOrEqual(3)
  })
})
