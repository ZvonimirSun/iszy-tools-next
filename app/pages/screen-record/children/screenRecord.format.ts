export interface ScreenRecordErrorText {
  always: string
  motion: string
  never: string
  permissionError: string
  notFoundError: string
  notReadableError: string
  constraintError: string
  operationFailed: string
}

export function formatCursor(value: string | undefined, text: Pick<ScreenRecordErrorText, 'always' | 'motion' | 'never'>) {
  switch (value) {
    case 'always':
      return text.always
    case 'motion':
      return text.motion
    case 'never':
      return text.never
    default:
      return '-'
  }
}

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

export function getErrorMessage(error: unknown, text: Pick<ScreenRecordErrorText, 'permissionError' | 'notFoundError' | 'notReadableError' | 'constraintError' | 'operationFailed'>) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
    return text.permissionError
  }
  if (message.includes('NotFoundError')) {
    return text.notFoundError
  }
  if (message.includes('NotReadableError')) {
    return text.notReadableError
  }
  if (message.includes('OverconstrainedError')) {
    return text.constraintError
  }

  return `${text.operationFailed}${message}`
}
