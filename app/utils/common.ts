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
