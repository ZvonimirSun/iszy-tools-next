import relationship from 'relationship.js'

export type ActiveTab = 'call' | 'relation'
export type CallDirection = 'toTarget' | 'fromTarget'
export type Sex = 0 | 1

const RELATION_KEY_SEX_MAP: Record<string, Sex> = {
  父: 1,
  母: 0,
  兄: 1,
  姐: 0,
  弟: 1,
  妹: 0,
  夫: 1,
  妻: 0,
  子: 1,
  女: 0,
}

const MALE_KEYS = new Set(['父', '兄', '弟', '夫', '子'])
const FEMALE_KEYS = new Set(['母', '姐', '妹', '妻', '女'])

export function isActiveTab(value: string | number): value is ActiveTab {
  return value === 'call' || value === 'relation'
}

export function isSex(value: string | number): value is Sex {
  return value === 0 || value === 1
}

export function normalizeRelationshipResult(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
}

export function getCurrentPersonSex(chain: string[], selfSex: Sex): Sex {
  const last = chain.at(-1)
  if (!last) {
    return selfSex
  }

  return RELATION_KEY_SEX_MAP[last] ?? selfSex
}

export function getDisabledSpouseKey(chain: string[], selfSex: Sex): '夫' | '妻' {
  return getCurrentPersonSex(chain, selfSex) === 1 ? '夫' : '妻'
}

export function getTargetPronoun(chain: string[]): '他' | '她' | 'TA' {
  const last = chain.at(-1)
  if (!last) {
    return 'TA'
  }

  if (MALE_KEYS.has(last)) {
    return '他'
  }

  if (FEMALE_KEYS.has(last)) {
    return '她'
  }

  return 'TA'
}

export function calculateCallResult(chain: string[], selfSex: Sex, callDirection: CallDirection): string[] {
  if (!chain.length) {
    return []
  }

  try {
    const relationText = chain.join('的')
    const response = relationship({
      text: relationText,
      sex: selfSex,
      reverse: callDirection === 'fromTarget',
    })

    return normalizeRelationshipResult(response)
  }
  catch {
    return []
  }
}

export function calculateRelationChainResult(text: string): string[] {
  const normalizedText = text.trim()
  if (!normalizedText) {
    return []
  }

  try {
    const response = relationship({
      text: normalizedText,
      type: 'chain',
    })

    return normalizeRelationshipResult(response)
  }
  catch {
    return []
  }
}
