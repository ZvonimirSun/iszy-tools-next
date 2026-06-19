import { describe, expect, it } from 'vitest'
import { createGitDiff, diffText } from './textDiff.service'

describe('textDiff.service', () => {
  it('detects inserted and deleted lines', () => {
    const rows = diffText('a\nb\nc', 'a\nc\nd')

    expect(rows.map(row => row.kind)).toEqual(['equal', 'delete', 'equal', 'insert'])
    expect(createGitDiff(rows)).toContain('diff --git a/text b/text\n--- a/text\n+++ b/text')
    expect(createGitDiff(rows)).toContain('-b')
    expect(createGitDiff(rows)).toContain('+d')
  })

  it('pairs adjacent delete and insert rows as changes', () => {
    const rows = diffText('hello world', 'hello there')

    expect(rows).toHaveLength(1)
    expect(rows[0]!.kind).toBe('change')
    expect(rows[0]!.leftParts.some(part => part.kind === 'delete' && part.text === 'world')).toBe(true)
    expect(rows[0]!.rightParts.some(part => part.kind === 'insert' && part.text === 'there')).toBe(true)
  })

  it('supports whitespace and case insensitive comparison', () => {
    const rows = diffText(' Hello   World ', 'hello world', {
      ignoreCase: true,
      ignoreWhitespace: true,
    })

    expect(rows.map(row => row.kind)).toEqual(['equal'])
  })
})
