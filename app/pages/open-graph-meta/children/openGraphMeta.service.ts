export interface OpenGraphMetaInput {
  title: string
  description: string
  url: string
  image: string
  siteName: string
  type: string
  twitterCard: string
}

export function generateOpenGraphMeta(input: OpenGraphMetaInput) {
  const tags = [
    ['meta', { property: 'og:title', content: input.title }],
    ['meta', { property: 'og:description', content: input.description }],
    ['meta', { property: 'og:type', content: input.type }],
    ['meta', { property: 'og:url', content: input.url }],
    ['meta', { property: 'og:image', content: input.image }],
    ['meta', { property: 'og:site_name', content: input.siteName }],
    ['meta', { name: 'twitter:card', content: input.twitterCard }],
    ['meta', { name: 'twitter:title', content: input.title }],
    ['meta', { name: 'twitter:description', content: input.description }],
    ['meta', { name: 'twitter:image', content: input.image }],
  ] as const

  return tags
    .filter(([, attrs]) => attrs.content.trim())
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(' ')}>`)
    .join('\n')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
