import { describe, expect, it } from 'vitest'
import { anyRuleItems } from './anyRule.data'

function testRule(rule: RegExp, value: string) {
  rule.lastIndex = 0
  return rule.test(value)
}

describe('anyRule.data', () => {
  it('keeps the migrated upstream rule set', () => {
    expect(anyRuleItems.length).toBeGreaterThanOrEqual(60)
  })

  it('matches every documented example', () => {
    const failures = anyRuleItems.flatMap((item) => {
      return item.examples
        .map(example => `${example}`)
        .filter(example => !testRule(item.rule, example))
        .map(example => `${item.title} -> example failed: ${example}`)
    })

    expect(failures).toEqual([])
  })

  it('rejects documented counter examples', () => {
    const failures = anyRuleItems.flatMap((item) => {
      return (item.counterExamples ?? [])
        .map(example => `${example}`)
        .filter(example => testRule(item.rule, example))
        .map(example => `${item.title} -> counter example unexpectedly matched: ${example}`)
    })

    expect(failures).toEqual([])
  })
})
