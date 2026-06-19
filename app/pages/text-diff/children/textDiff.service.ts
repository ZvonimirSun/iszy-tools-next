import { Change } from '@codemirror/merge'

export type DiffKind = 'equal' | 'delete' | 'insert' | 'change'

export interface DiffOptions {
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
}

export interface InlineDiffPart {
  kind: DiffKind
  text: string
}

export interface DiffRow {
  kind: DiffKind
  leftNumber?: number
  rightNumber?: number
  leftText: string
  rightText: string
  leftParts: InlineDiffPart[]
  rightParts: InlineDiffPart[]
}

export interface GitDiffOptions {
  fromFile?: string
  toFile?: string
  context?: number
}

interface LineItem {
  number: number
  text: string
  normalized: string
}

interface LineOp {
  type: 'equal' | 'delete' | 'insert'
  left?: LineItem
  right?: LineItem
}

interface LineRange {
  from: number
  to: number
}

function normalizeValue(value: string, options: DiffOptions): string {
  let normalized = value
  if (options.ignoreWhitespace) {
    normalized = normalized.trim().replace(/\s+/g, ' ')
  }
  if (options.ignoreCase) {
    normalized = normalized.toLowerCase()
  }
  return normalized
}

function createLineRanges(value: string): LineRange[] {
  const ranges: LineRange[] = []
  const matcher = /.*(?:\r\n|\n|\r|$)/g
  let match = matcher.exec(value)

  while (match) {
    const text = match[0]
    if (!text && matcher.lastIndex >= value.length) {
      break
    }

    const from = matcher.lastIndex - text.length
    let to = matcher.lastIndex

    if (text.endsWith('\r\n')) {
      to -= 2
    }
    else if (text.endsWith('\n') || text.endsWith('\r')) {
      to -= 1
    }

    ranges.push({ from, to })

    if (matcher.lastIndex >= value.length) {
      break
    }

    match = matcher.exec(value)
  }

  return ranges.length ? ranges : [{ from: 0, to: 0 }]
}

function createLineItems(value: string, options: DiffOptions): LineItem[] {
  return value.split(/\r\n|\n|\r/).map((text, index) => ({
    number: index + 1,
    text,
    normalized: normalizeValue(text, options),
  }))
}

function getLineRange(ranges: LineRange[], lineNumber?: number): LineRange | undefined {
  return lineNumber === undefined ? undefined : ranges[lineNumber - 1]
}

function getFallbackPosition(rows: DiffRow[], ranges: LineRange[], index: number, side: 'left' | 'right'): number {
  for (let i = index - 1; i >= 0; i -= 1) {
    const range = getLineRange(ranges, side === 'left' ? rows[i]!.leftNumber : rows[i]!.rightNumber)
    if (range) {
      return range.to
    }
  }

  for (let i = index + 1; i < rows.length; i += 1) {
    const range = getLineRange(ranges, side === 'left' ? rows[i]!.leftNumber : rows[i]!.rightNumber)
    if (range) {
      return range.from
    }
  }

  return 0
}

function createNumberArray(length: number): number[] {
  return Array.from({ length }).fill(0) as number[]
}

function createLcsTable(left: LineItem[], right: LineItem[]): number[][] {
  const table = Array.from({ length: left.length + 1 }, () => createNumberArray(right.length + 1))

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i]![j] = left[i]!.normalized === right[j]!.normalized
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }

  return table
}

function createLineOps(left: LineItem[], right: LineItem[]): LineOp[] {
  const table = createLcsTable(left, right)
  const ops: LineOp[] = []
  let i = 0
  let j = 0

  while (i < left.length && j < right.length) {
    if (left[i]!.normalized === right[j]!.normalized) {
      ops.push({ type: 'equal', left: left[i], right: right[j] })
      i += 1
      j += 1
    }
    else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      ops.push({ type: 'delete', left: left[i] })
      i += 1
    }
    else {
      ops.push({ type: 'insert', right: right[j] })
      j += 1
    }
  }

  while (i < left.length) {
    ops.push({ type: 'delete', left: left[i] })
    i += 1
  }

  while (j < right.length) {
    ops.push({ type: 'insert', right: right[j] })
    j += 1
  }

  return ops
}

function tokenize(value: string): string[] {
  return value.match(/\s+|\S+/g) ?? []
}

function createTokenParts(source: string[], target: string[], changedKind: DiffKind): InlineDiffPart[] {
  const table = Array.from({ length: source.length + 1 }, () => createNumberArray(target.length + 1))

  for (let i = source.length - 1; i >= 0; i -= 1) {
    for (let j = target.length - 1; j >= 0; j -= 1) {
      table[i]![j] = source[i] === target[j]
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }

  const parts: InlineDiffPart[] = []
  let i = 0
  let j = 0

  function pushPart(kind: DiffKind, text: string) {
    const last = parts.at(-1)
    if (last?.kind === kind) {
      last.text += text
    }
    else {
      parts.push({ kind, text })
    }
  }

  while (i < source.length && j < target.length) {
    if (source[i] === target[j]) {
      pushPart('equal', source[i]!)
      i += 1
      j += 1
    }
    else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      pushPart(changedKind, source[i]!)
      i += 1
    }
    else {
      j += 1
    }
  }

  while (i < source.length) {
    pushPart(changedKind, source[i]!)
    i += 1
  }

  return parts
}

function createInlineParts(leftText: string, rightText: string): Pick<DiffRow, 'leftParts' | 'rightParts'> {
  if (!leftText && !rightText) {
    return {
      leftParts: [],
      rightParts: [],
    }
  }

  if (leftText === rightText) {
    return {
      leftParts: [{ kind: 'equal', text: leftText }],
      rightParts: [{ kind: 'equal', text: rightText }],
    }
  }

  const leftTokens = tokenize(leftText)
  const rightTokens = tokenize(rightText)

  return {
    leftParts: createTokenParts(leftTokens, rightTokens, 'delete'),
    rightParts: createTokenParts(rightTokens, leftTokens, 'insert'),
  }
}

function createRow(kind: DiffKind, left?: LineItem, right?: LineItem): DiffRow {
  const leftText = left?.text ?? ''
  const rightText = right?.text ?? ''
  const { leftParts, rightParts } = createInlineParts(leftText, rightText)

  return {
    kind,
    leftNumber: left?.number,
    rightNumber: right?.number,
    leftText,
    rightText,
    leftParts,
    rightParts,
  }
}

export function diffText(leftValue: string, rightValue: string, options: DiffOptions = {}): DiffRow[] {
  const left = createLineItems(leftValue, options)
  const right = createLineItems(rightValue, options)
  const ops = createLineOps(left, right)
  const rows: DiffRow[] = []

  for (let index = 0; index < ops.length; index += 1) {
    const op = ops[index]!

    if (op.type === 'equal') {
      rows.push(createRow('equal', op.left, op.right))
      continue
    }

    const deletes: LineItem[] = []
    const inserts: LineItem[] = []

    while (ops[index]?.type === 'delete') {
      deletes.push(ops[index]!.left!)
      index += 1
    }
    while (ops[index]?.type === 'insert') {
      inserts.push(ops[index]!.right!)
      index += 1
    }
    index -= 1

    const length = Math.max(deletes.length, inserts.length)
    for (let i = 0; i < length; i += 1) {
      const deletedLine = deletes[i]
      const insertedLine = inserts[i]
      const kind = deletedLine && insertedLine
        ? 'change'
        : deletedLine
          ? 'delete'
          : 'insert'
      rows.push(createRow(kind, deletedLine, insertedLine))
    }
  }

  return rows
}

export function createCodeMirrorChanges(leftValue: string, rightValue: string, options: DiffOptions = {}): readonly Change[] {
  const rows = diffText(leftValue, rightValue, options)
  const leftRanges = createLineRanges(leftValue)
  const rightRanges = createLineRanges(rightValue)

  return rows
    .map((row, index) => {
      if (row.kind === 'equal') {
        return undefined
      }

      const leftRange = getLineRange(leftRanges, row.leftNumber)
      const rightRange = getLineRange(rightRanges, row.rightNumber)
      const leftPosition = leftRange ? leftRange.from : getFallbackPosition(rows, leftRanges, index, 'left')
      const rightPosition = rightRange ? rightRange.from : getFallbackPosition(rows, rightRanges, index, 'right')

      return new Change(
        leftRange?.from ?? leftPosition,
        leftRange?.to ?? leftPosition,
        rightRange?.from ?? rightPosition,
        rightRange?.to ?? rightPosition,
      )
    })
    .filter((change): change is Change => Boolean(change))
}

function countSideLines(rows: DiffRow[], side: 'left' | 'right'): number {
  return rows.filter(row => side === 'left' ? row.leftNumber !== undefined : row.rightNumber !== undefined).length
}

function findPreviousLineNumber(rows: DiffRow[], index: number, side: 'left' | 'right'): number {
  for (let i = index - 1; i >= 0; i -= 1) {
    const lineNumber = side === 'left' ? rows[i]!.leftNumber : rows[i]!.rightNumber
    if (lineNumber !== undefined) {
      return lineNumber
    }
  }
  return 0
}

function findHunkStartLine(allRows: DiffRow[], hunkRows: DiffRow[], startIndex: number, side: 'left' | 'right'): number {
  const lineNumber = hunkRows.find(row => side === 'left' ? row.leftNumber !== undefined : row.rightNumber !== undefined)
  const value = side === 'left' ? lineNumber?.leftNumber : lineNumber?.rightNumber
  return value ?? findPreviousLineNumber(allRows, startIndex, side) + 1
}

function createHunkLine(row: DiffRow): string[] {
  if (row.kind === 'equal') {
    return [` ${row.leftText}`]
  }
  if (row.kind === 'delete') {
    return [`-${row.leftText}`]
  }
  if (row.kind === 'insert') {
    return [`+${row.rightText}`]
  }
  return [`-${row.leftText}`, `+${row.rightText}`]
}

export function createGitDiff(rows: DiffRow[], {
  fromFile = 'a/text',
  toFile = 'b/text',
  context = 3,
}: GitDiffOptions = {}): string {
  const changedIndexes = rows
    .map((row, index) => row.kind === 'equal' ? -1 : index)
    .filter(index => index >= 0)

  if (!changedIndexes.length) {
    return ''
  }

  const lines = [
    `diff --git ${fromFile} ${toFile}`,
    `--- ${fromFile}`,
    `+++ ${toFile}`,
  ]
  let cursor = 0

  while (cursor < changedIndexes.length) {
    let start = Math.max(0, changedIndexes[cursor]! - context)
    let end = Math.min(rows.length - 1, changedIndexes[cursor]! + context)
    cursor += 1

    while (cursor < changedIndexes.length && changedIndexes[cursor]! <= end + context + 1) {
      end = Math.min(rows.length - 1, changedIndexes[cursor]! + context)
      cursor += 1
    }

    while (start < end && rows[start]?.kind === 'equal' && rows[start + 1]?.kind === 'equal' && start < changedIndexes[0]!) {
      start += 1
    }

    const hunkRows = rows.slice(start, end + 1)
    const leftStart = findHunkStartLine(rows, hunkRows, start, 'left')
    const rightStart = findHunkStartLine(rows, hunkRows, start, 'right')
    const leftCount = countSideLines(hunkRows, 'left')
    const rightCount = countSideLines(hunkRows, 'right')

    lines.push(`@@ -${leftStart},${leftCount} +${rightStart},${rightCount} @@`)
    for (const row of hunkRows) {
      lines.push(...createHunkLine(row))
    }
  }

  return lines.join('\n')
}
