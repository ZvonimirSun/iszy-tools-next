export type AsciiGroup = 'control' | 'digit' | 'uppercase' | 'lowercase' | 'symbol'

export interface AsciiRow {
  dec: number
  hex: string
  oct: string
  bin: string
  htmlCode: string
  char: string
  escaped: string
  name: string
  group: AsciiGroup
  isControl: boolean
}

interface ControlMeta {
  label: string
  aliases: string[]
}

const controlMetaMap: Record<number, ControlMeta> = {
  0: { label: 'NUL', aliases: ['null', 'zero'] },
  1: { label: 'SOH', aliases: ['start of heading'] },
  2: { label: 'STX', aliases: ['start of text'] },
  3: { label: 'ETX', aliases: ['end of text'] },
  4: { label: 'EOT', aliases: ['end of transmission'] },
  5: { label: 'ENQ', aliases: ['enquiry'] },
  6: { label: 'ACK', aliases: ['acknowledge'] },
  7: { label: 'BEL', aliases: ['bell', 'alert'] },
  8: { label: 'BS', aliases: ['backspace'] },
  9: { label: 'HT', aliases: ['tab', 'horizontal tab'] },
  10: { label: 'LF', aliases: ['line feed', 'newline'] },
  11: { label: 'VT', aliases: ['vertical tab'] },
  12: { label: 'FF', aliases: ['form feed'] },
  13: { label: 'CR', aliases: ['carriage return'] },
  14: { label: 'SO', aliases: ['shift out'] },
  15: { label: 'SI', aliases: ['shift in'] },
  16: { label: 'DLE', aliases: ['data link escape'] },
  17: { label: 'DC1', aliases: ['device control 1', 'xon'] },
  18: { label: 'DC2', aliases: ['device control 2'] },
  19: { label: 'DC3', aliases: ['device control 3', 'xoff'] },
  20: { label: 'DC4', aliases: ['device control 4'] },
  21: { label: 'NAK', aliases: ['negative acknowledge'] },
  22: { label: 'SYN', aliases: ['synchronous idle'] },
  23: { label: 'ETB', aliases: ['end of transmission block'] },
  24: { label: 'CAN', aliases: ['cancel'] },
  25: { label: 'EM', aliases: ['end of medium'] },
  26: { label: 'SUB', aliases: ['substitute'] },
  27: { label: 'ESC', aliases: ['escape'] },
  28: { label: 'FS', aliases: ['file separator'] },
  29: { label: 'GS', aliases: ['group separator'] },
  30: { label: 'RS', aliases: ['record separator'] },
  31: { label: 'US', aliases: ['unit separator'] },
  127: { label: 'DEL', aliases: ['delete'] },
  128: { label: 'PAD', aliases: ['padding character'] },
  129: { label: 'HOP', aliases: ['high octet preset'] },
  130: { label: 'BPH', aliases: ['break permitted here'] },
  131: { label: 'NBH', aliases: ['no break here'] },
  132: { label: 'IND', aliases: ['index'] },
  133: { label: 'NEL', aliases: ['next line'] },
  134: { label: 'SSA', aliases: ['start of selected area'] },
  135: { label: 'ESA', aliases: ['end of selected area'] },
  136: { label: 'HTS', aliases: ['character tabulation set'] },
  137: { label: 'HTJ', aliases: ['character tabulation with justification'] },
  138: { label: 'VTS', aliases: ['line tabulation set'] },
  139: { label: 'PLD', aliases: ['partial line forward'] },
  140: { label: 'PLU', aliases: ['partial line backward'] },
  141: { label: 'RI', aliases: ['reverse line feed'] },
  142: { label: 'SS2', aliases: ['single shift two'] },
  143: { label: 'SS3', aliases: ['single shift three'] },
  144: { label: 'DCS', aliases: ['device control string'] },
  145: { label: 'PU1', aliases: ['private use one'] },
  146: { label: 'PU2', aliases: ['private use two'] },
  147: { label: 'STS', aliases: ['set transmit state'] },
  148: { label: 'CCH', aliases: ['cancel character'] },
  149: { label: 'MW', aliases: ['message waiting'] },
  150: { label: 'SPA', aliases: ['start of protected area'] },
  151: { label: 'EPA', aliases: ['end of protected area'] },
  152: { label: 'SOS', aliases: ['start of string'] },
  153: { label: 'SGCI', aliases: ['single graphic character introducer'] },
  154: { label: 'SCI', aliases: ['single character introducer'] },
  155: { label: 'CSI', aliases: ['control sequence introducer'] },
  156: { label: 'ST', aliases: ['string terminator'] },
  157: { label: 'OSC', aliases: ['operating system command'] },
  158: { label: 'PM', aliases: ['privacy message'] },
  159: { label: 'APC', aliases: ['application program command'] },
}

function isControlCode(dec: number) {
  return dec <= 31 || dec === 127 || (dec >= 128 && dec <= 159)
}

function getAsciiGroup(dec: number): AsciiGroup {
  if (isControlCode(dec))
    return 'control'
  if (dec >= 48 && dec <= 57)
    return 'digit'
  if (dec >= 65 && dec <= 90)
    return 'uppercase'
  if (dec >= 97 && dec <= 122)
    return 'lowercase'
  return 'symbol'
}

function toHex(dec: number) {
  return dec.toString(16).toUpperCase().padStart(2, '0')
}

function toOct(dec: number) {
  return dec.toString(8).padStart(3, '0')
}

function toBinary(dec: number) {
  return dec.toString(2).padStart(8, '0')
}

function toHtmlCode(dec: number) {
  return `&#${dec};`
}

function getEscapedChar(dec: number) {
  switch (dec) {
    case 0:
      return '\\0'
    case 7:
      return '\\a'
    case 8:
      return '\\b'
    case 9:
      return '\\t'
    case 10:
      return '\\n'
    case 11:
      return '\\v'
    case 12:
      return '\\f'
    case 13:
      return '\\r'
    case 27:
      return '\\x1B'
    case 32:
      return '\\s'
    case 127:
      return '\\x7F'
    default:
      if (isControlCode(dec))
        return `\\x${toHex(dec)}`
      return JSON.stringify(String.fromCharCode(dec)).slice(1, -1)
  }
}

function getDisplayChar(dec: number) {
  if (dec === 32)
    return ' '
  if (isControlCode(dec))
    return ''
  return String.fromCharCode(dec)
}

function getReadableName(dec: number, group: AsciiGroup) {
  if (dec === 32)
    return 'SPACE'
  if (group === 'control')
    return controlMetaMap[dec]?.label ?? 'CTRL'
  if (group === 'digit')
    return `DIGIT ${String.fromCharCode(dec)}`
  if (group === 'uppercase')
    return `UPPER ${String.fromCharCode(dec)}`
  if (group === 'lowercase')
    return `LOWER ${String.fromCharCode(dec)}`
  return `SYMBOL ${String.fromCharCode(dec)}`
}

export const asciiRows: AsciiRow[] = Array.from({ length: 256 }, (_, dec) => {
  const group = getAsciiGroup(dec)

  return {
    dec,
    hex: toHex(dec),
    oct: toOct(dec),
    bin: toBinary(dec),
    htmlCode: toHtmlCode(dec),
    char: getDisplayChar(dec),
    escaped: getEscapedChar(dec),
    name: getReadableName(dec, group),
    group,
    isControl: group === 'control',
  }
})

export const asciiSearchIndex = new Map<number, string>(
  asciiRows.map((row) => {
    const controlAliases = row.isControl ? controlMetaMap[row.dec]?.aliases.join(' ') ?? '' : ''
    const text = [
      row.dec,
      row.hex,
      row.oct,
      row.bin,
      row.htmlCode,
      row.char,
      row.escaped,
      row.name,
      row.group,
      controlAliases,
    ].join(' ').toLowerCase()

    return [row.dec, text]
  }),
)
