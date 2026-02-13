export function isExternalLink(href: string) {
  const dummyBase = 'https://example.com'
  return new URL(href, dummyBase).origin !== dummyBase
}

export async function afterRequestAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve()
    })
  })
}

export function isUint8Array(data: unknown): data is Uint8Array {
  return data instanceof Uint8Array || ArrayBuffer.isView(data)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
