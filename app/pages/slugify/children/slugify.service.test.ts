import { describe, expect, it } from 'vitest'
import { slugifyText } from './slugify.service'

describe('slugify.service', () => {
  it('生成小写短横线 slug', () => {
    expect(slugifyText('Hello, World! 2026', { keepCjk: false })).toBe('hello-world-2026')
  })

  it('使用成熟 slugify 规则处理音标和符号', () => {
    expect(slugifyText('Crème brûlée -- déjà vu', { keepCjk: false })).toBe('creme-brulee-deja-vu')
    expect(slugifyText('I ♥ Dogs & Cats!', { keepCjk: false })).toBe('i-love-dogs-and-cats')
  })

  it('支持自定义分隔符和大小写', () => {
    expect(slugifyText('Hello World', { separator: '_', lowercase: false, keepCjk: false })).toBe('Hello_World')
  })

  it('可选择是否保留中文字符', () => {
    expect(slugifyText('在线工具 Iszy')).toBe('在线工具-iszy')
    expect(slugifyText('在线工具 Iszy', { keepCjk: false })).toBe('iszy')
  })
})
