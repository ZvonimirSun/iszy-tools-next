export interface Hsva {
  h: number // 0-360
  s: number // 0-100
  v: number // 0-100
  a: number // 0-100
}

export type FormatName = 'HEX' | 'HEX8' | 'RGB' | 'RGBA' | 'HSL' | 'HSLA' | 'HSV' | 'OKLCH' | 'OKLAB' | 'P3'

export function hsvaToRgba(hsva: Hsva): {
  r: number
  g: number
  b: number
  a: number
} {
  const h = (((hsva.h % 360) + 360) % 360) / 360
  const s = hsva.s / 100
  const v = hsva.v / 100
  const a = hsva.a / 100

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  let r: number
  let g: number
  let b: number

  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    default:
      r = v
      g = p
      b = q
      break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  }
}

export async function parseToHsva(input: string): Promise<Hsva | null> {
  try {
    const { parse, converter } = await import('~/libs/culori')
    const color = parse(input.trim())

    if (!color) {
      return null
    }

    const toHsv = converter('hsv')
    const hsv = toHsv(color)

    if (!hsv) {
      return null
    }

    const h = hsv.h

    return {
      h: h === undefined || Number.isNaN(h) ? 0 : h,
      s: (hsv.s ?? 0) * 100,
      v: (hsv.v ?? 0) * 100,
      a: (hsv.alpha ?? 1) * 100,
    }
  }
  catch {
    return null
  }
}

export async function hsvaToFormats(hsva: Hsva): Promise<Record<FormatName, string>> {
  const { converter, formatHex, formatHex8 } = await import('~/libs/culori')

  const color = {
    mode: 'hsv' as const,
    h: (((hsva.h % 360) + 360) % 360),
    s: hsva.s / 100,
    v: hsva.v / 100,
    alpha: hsva.a / 100,
  }

  const hex = (formatHex(color) ?? '#000000').toUpperCase()
  const hex8 = (formatHex8(color) ?? '#000000FF').toUpperCase()

  const toRgb = converter('rgb')
  const rgbColor = toRgb(color)
  const r = Math.round((rgbColor.r ?? 0) * 255)
  const g = Math.round((rgbColor.g ?? 0) * 255)
  const b = Math.round((rgbColor.b ?? 0) * 255)
  const a = Math.round(hsva.a) / 100

  const toHsl = converter('hsl')
  const hslColor = toHsl(color)
  const hD = Math.round(!hslColor.h || Number.isNaN(hslColor.h) ? 0 : hslColor.h)
  const sP = Math.round((hslColor.s ?? 0) * 100)
  const lP = Math.round((hslColor.l ?? 0) * 100)

  const toOklch = converter('oklch')
  const oklch = toOklch(color)
  const oklchL = formatFloat(oklch.l ?? 0)
  const oklchC = formatFloat(oklch.c ?? 0)
  const oklchH = formatFloat(oklch.h ?? 0, 2)

  const toOklab = converter('oklab')
  const oklab = toOklab(color)
  const oklabL = formatFloat(oklab.l ?? 0)
  const oklabA = formatFloat(oklab.a ?? 0)
  const oklabB = formatFloat(oklab.b ?? 0)

  const toP3 = converter('p3')
  const p3 = toP3(color)
  const p3R = formatFloat(p3.r ?? 0, 3)
  const p3G = formatFloat(p3.g ?? 0, 3)
  const p3B = formatFloat(p3.b ?? 0, 3)
  const p3A = formatFloat(p3.alpha ?? color.alpha, 2)
  const p3Css = p3A === '1'
    ? `color(display-p3 ${p3R} ${p3G} ${p3B})`
    : `color(display-p3 ${p3R} ${p3G} ${p3B} / ${p3A})`

  const hsvH = Math.round((((hsva.h % 360) + 360) % 360))
  const hsvS = Math.round(hsva.s)
  const hsvV = Math.round(hsva.v)

  return {
    HEX: hex,
    HEX8: hex8,
    RGB: `rgb(${r}, ${g}, ${b})`,
    RGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
    HSL: `hsl(${hD}, ${sP}%, ${lP}%)`,
    HSLA: `hsla(${hD}, ${sP}%, ${lP}%, ${a})`,
    HSV: `hsv(${hsvH}, ${hsvS}%, ${hsvV}%)`,
    OKLCH: `oklch(${oklchL} ${oklchC} ${oklchH}${a < 1 ? ` / ${a}` : ''})`,
    OKLAB: `oklab(${oklabL} ${oklabA} ${oklabB}${a < 1 ? ` / ${a}` : ''})`,
    P3: p3Css,
  }
}
