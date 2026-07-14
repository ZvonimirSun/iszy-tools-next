export function percentageOf(value: number, percent: number) {
  return value * percent / 100
}

export function percentRatio(part: number, total: number) {
  if (total === 0) {
    throw new Error('总数不能为 0')
  }

  return part / total * 100
}

export function percentChange(from: number, to: number) {
  if (from === 0) {
    throw new Error('起始值不能为 0')
  }

  return (to - from) / Math.abs(from) * 100
}

export function formatPercentValue(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return Number(value.toFixed(digits)).toLocaleString('zh-CN')
}
