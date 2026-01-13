export function isExternalLink(href: string) {
  const dummyBase = 'https://example.com'
  return new URL(href, dummyBase).origin !== dummyBase
}
