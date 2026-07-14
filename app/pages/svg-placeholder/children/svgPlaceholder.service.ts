export interface SvgPlaceholderOptions {
  width: number
  height: number
  text: string
  background: string
  foreground: string
}

export function createSvgPlaceholder(options: SvgPlaceholderOptions) {
  const width = clamp(options.width, 1, 10000)
  const height = clamp(options.height, 1, 10000)
  const text = escapeXml(options.text || `${width} x ${height}`)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${escapeXml(options.background)}"/>`,
    `<text x="50%" y="50%" fill="${escapeXml(options.foreground)}" font-family="Arial, sans-serif" font-size="${Math.max(12, Math.round(Math.min(width, height) / 10))}" text-anchor="middle" dominant-baseline="middle">${text}</text>`,
    '</svg>',
  ].join('')
}

export function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
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
