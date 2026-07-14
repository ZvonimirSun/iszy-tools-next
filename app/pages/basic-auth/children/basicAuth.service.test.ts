import { describe, expect, it } from 'vitest'
import { createBasicAuthHeader, createBasicAuthToken } from './basicAuth.service'

describe('basicAuth.service', () => {
  it('生成 Basic Auth token 和 header', () => {
    expect(createBasicAuthToken({ username: 'admin', password: 'secret' })).toBe('YWRtaW46c2VjcmV0')
    expect(createBasicAuthHeader({ username: 'admin', password: 'secret' })).toBe('Authorization: Basic YWRtaW46c2VjcmV0')
  })

  it('支持空密码', () => {
    expect(createBasicAuthToken({ username: 'admin', password: '' })).toBe('YWRtaW46')
  })

  it('按 UTF-8 编码非 ASCII 输入', () => {
    expect(createBasicAuthToken({ username: '用户', password: '密码' })).toBe('55So5oi3OuWvhueggQ==')
  })
})
