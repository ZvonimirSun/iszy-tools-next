export interface SvgPlaceholderOptions {
  width: number
  height: number
  text: string
  background: string
  foreground: string
  fontSize?: number
  exactSize?: boolean
}

export function createSvgPlaceholder(options: SvgPlaceholderOptions) {
  const width = clamp(options.width, 1, 10000)
  const height = clamp(options.height, 1, 10000)
  const text = escapeXml(options.text || `${width} x ${height}`)
  const fontSize = clamp(options.fontSize ?? Math.round(Math.min(width, height) / 10), 1, 1000)
  const sizeAttributes = options.exactSize === false ? '' : ` width="${width}" height="${height}"`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${sizeAttributes} viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${escapeXml(options.background)}"/>`,
    `<text x="50%" y="50%" fill="${escapeXml(options.foreground)}" font-family="Arial, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${text}</text>`,
    '</svg>',
  ].join('')
}

export function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function createSvgBase64DataUrl(svg: string) {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return `data:image/svg+xml;base64,${btoa(binary)}`
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
