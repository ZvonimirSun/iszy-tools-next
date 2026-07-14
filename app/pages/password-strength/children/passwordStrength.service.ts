export interface PasswordStrengthResult {
  length: number
  poolSize: number
  entropyBits: number
  score: 0 | 1 | 2 | 3 | 4
  label: string
  suggestions: string[]
  crackTimes: Array<{ label: string, value: string }>
}

const LOWERCASE_REGEX = /[a-z]/
const UPPERCASE_REGEX = /[A-Z]/
const NUMBER_REGEX = /\d/
const SYMBOL_REGEX = /[^A-Z0-9]/i
const SYMBOL_POOL_SIZE = 32
const COMMON_PATTERNS = [
  /password/i,
  /qwerty/i,
  /admin/i,
  /123456/,
  /111111/,
]

export function analyzePassword(password: string): PasswordStrengthResult {
  const length = password.length
  const poolSize = estimatePoolSize(password)
  const entropyBits = length && poolSize ? length * Math.log2(poolSize) : 0
  const suggestions = createSuggestions(password, poolSize)
  const score = scoreEntropy(entropyBits, suggestions.length)

  return {
    length,
    poolSize,
    entropyBits,
    score,
    label: ['很弱', '较弱', '一般', '较强', '很强'][score]!,
    suggestions,
    crackTimes: [
      { label: '在线限速场景（100 次/秒）', value: formatDuration(entropyToSeconds(entropyBits, 100)) },
      { label: '普通离线场景（1 亿次/秒）', value: formatDuration(entropyToSeconds(entropyBits, 100_000_000)) },
      { label: '高性能离线场景（1 万亿次/秒）', value: formatDuration(entropyToSeconds(entropyBits, 1_000_000_000_000)) },
    ],
  }
}

function estimatePoolSize(password: string) {
  let pool = 0
  if (LOWERCASE_REGEX.test(password)) {
    pool += 26
  }
  if (UPPERCASE_REGEX.test(password)) {
    pool += 26
  }
  if (NUMBER_REGEX.test(password)) {
    pool += 10
  }
  if (SYMBOL_REGEX.test(password)) {
    pool += SYMBOL_POOL_SIZE
  }
  return pool
}

function createSuggestions(password: string, poolSize: number) {
  const suggestions: string[] = []

  if (password.length < 12) {
    suggestions.push('建议长度至少 12 位。')
  }
  if (poolSize < 62) {
    suggestions.push('建议混合大小写字母、数字和符号。')
  }
  if (COMMON_PATTERNS.some(pattern => pattern.test(password))) {
    suggestions.push('避免使用常见单词、连续数字或键盘序列。')
  }

  return suggestions
}

function scoreEntropy(entropyBits: number, suggestionCount: number): PasswordStrengthResult['score'] {
  const penalty = suggestionCount > 1 ? 25 : suggestionCount * 8
  const adjusted = Math.max(0, entropyBits - penalty)

  if (adjusted >= 100) {
    return 4
  }
  if (adjusted >= 70) {
    return 3
  }
  if (adjusted >= 45) {
    return 2
  }
  if (adjusted >= 28) {
    return 1
  }
  return 0
}

function entropyToSeconds(entropyBits: number, guessesPerSecond: number) {
  if (entropyBits <= 0) {
    return 0
  }

  return (2 ** (entropyBits - 1)) / guessesPerSecond
}

function formatDuration(seconds: number) {
  if (seconds < 1) {
    return '小于 1 秒'
  }

  const units = [
    { label: '年', seconds: 31_536_000 },
    { label: '天', seconds: 86_400 },
    { label: '小时', seconds: 3_600 },
    { label: '分钟', seconds: 60 },
    { label: '秒', seconds: 1 },
  ]

  for (const unit of units) {
    if (seconds >= unit.seconds) {
      const value = seconds / unit.seconds
      return `${formatNumber(value)} ${unit.label}`
    }
  }

  return '小于 1 秒'
}

function formatNumber(value: number) {
  if (value >= 1_000_000) {
    return value.toExponential(2)
  }

  return value >= 10 ? Math.round(value).toLocaleString('zh-CN') : value.toFixed(1)
}
