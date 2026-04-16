import { describe, expect, it } from 'vitest'
import {
  buildRunjsImportMap,
  buildRunjsSrcdoc,
  escapeScriptTag,
  findDuplicateRunjsAliases,
  instrumentExpressionStatements,
  normalizeRunjsDependencies,
  runjsDepsSignature,
} from './runjs.service'

describe('runjs.service', () => {
  describe('normalizeRunjsDependencies', () => {
    // eslint-disable-next-line test/prefer-lowercase-title
    it('URL 为空时默认补全为 esm.sh 别名路径', () => {
      const result = normalizeRunjsDependencies([
        { name: 'dayjs', url: '' },
      ])

      expect(result.error).toBe('')
      expect(result.normalized).toEqual([
        { name: 'dayjs', url: 'https://esm.sh/dayjs' },
      ])
    })

    // eslint-disable-next-line test/prefer-lowercase-title
    it('URL 输入包名时自动映射到 esm.sh 地址', () => {
      const result = normalizeRunjsDependencies([
        { name: 'vueuse', url: '@vueuse/core' },
      ])

      expect(result.error).toBe('')
      expect(result.normalized).toEqual([
        { name: 'vueuse', url: 'https://esm.sh/@vueuse/core' },
      ])
    })

    it('别名重复时返回校验错误', () => {
      const result = normalizeRunjsDependencies([
        { name: 'dayjs', url: 'https://esm.sh/dayjs' },
        { name: 'dayjs', url: 'https://esm.sh/dayjs@1.11.0' },
      ])

      expect(result.normalized).toBeNull()
      expect(result.error).toBe('第 2 行别名重复：dayjs')
    })

    it('别名缺失时返回校验错误', () => {
      const result = normalizeRunjsDependencies([
        { name: '', url: 'https://esm.sh/dayjs' },
      ])

      expect(result.normalized).toBeNull()
      expect(result.error).toBe('第 1 行需填写别名')
    })
  })

  describe('buildRunjsImportMap 与重复别名检测', () => {
    it('构建 importmap 时跳过无效项和重复项', () => {
      const importMap = buildRunjsImportMap([
        { name: 'dayjs', url: 'https://esm.sh/dayjs' },
        { name: 'dayjs', url: 'https://esm.sh/dayjs@1.11.0' },
        { name: ' ', url: 'https://esm.sh/empty' },
        { name: 'nanoid', url: 'https://esm.sh/nanoid' },
      ])

      expect(importMap).toEqual({
        imports: {
          dayjs: 'https://esm.sh/dayjs',
          nanoid: 'https://esm.sh/nanoid',
        },
      })
    })

    it('能够检测重复别名', () => {
      const duplicates = findDuplicateRunjsAliases([
        { name: 'dayjs', url: 'https://esm.sh/dayjs' },
        { name: ' dayjs ', url: 'https://esm.sh/dayjs@latest' },
        { name: 'lodash', url: 'https://esm.sh/lodash-es' },
      ])

      expect(duplicates).toEqual(['dayjs'])
    })

    it('生成稳定的依赖签名', () => {
      const signature = runjsDepsSignature([
        { name: ' dayjs ', url: ' https://esm.sh/dayjs ' },
        { name: 'nanoid', url: 'https://esm.sh/nanoid' },
      ])

      expect(signature).toBe('dayjs|https://esm.sh/dayjs\nnanoid|https://esm.sh/nanoid')
    })
  })

  describe('instrumentExpressionStatements', () => {
    it('只对顶层表达式语句进行注入', () => {
      const code = [
        '"use strict";',
        'const answer = 40 + 2;',
        'answer;',
        'console.log(answer);',
      ].join('\n')

      const transformed = instrumentExpressionStatements(code)

      expect(transformed).toContain('"use strict";')
      expect(transformed).toContain('const answer = 40 + 2;')
      expect(transformed).toContain('__runjs_output(( answer ))')
      expect(transformed).toContain('__runjs_output(( console.log(answer) ))')
    })
  })

  describe('buildRunjsSrcdoc', () => {
    it('对模块代码和 importmap 中的 script 闭合标签进行转义', () => {
      const source = buildRunjsSrcdoc(
        `console.log('</script>')`,
        { imports: { a: 'https://esm.sh/a</script>' } },
        'runjs-frame',
      )

      expect(source).toContain('<script type="importmap">')
      expect(source).toContain('<\\/script>')
      expect(source).toContain('const source = \'runjs-frame\'')
      expect(source).toContain('window.__runjs_output')
    })

    it('escapeScriptTag 能安全替换 script 闭合标签', () => {
      expect(escapeScriptTag('</script><script>alert(1)</script>'))
        .toBe('<\\/script><script>alert(1)<\\/script>')
    })
  })
})
