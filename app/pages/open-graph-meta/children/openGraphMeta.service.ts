import type { MetadataConfig, MetadataValue } from '@it-tools/oggen'
import { generateMeta } from '@it-tools/oggen'

export type OpenGraphType
  = | 'website'
    | 'article'
    | 'book'
    | 'profile'
    | 'music.song'
    | 'music.album'
    | 'music.playlist'
    | 'music.radio_station'
    | 'video.movie'
    | 'video.episode'
    | 'video.tv_show'
    | 'video.other'

export interface OpenGraphField {
  key: string
  label: string
  placeholder: string
  list?: boolean
  numeric?: boolean
}

export interface OpenGraphSection {
  title: string
  fields: OpenGraphField[]
}

export type OpenGraphMetaInput = Record<string, string> & {
  type: OpenGraphType
}

export const openGraphTypeOptions: Array<{ label: string, value: OpenGraphType }> = [
  { label: 'Website', value: 'website' },
  { label: 'Article', value: 'article' },
  { label: 'Book', value: 'book' },
  { label: 'Profile', value: 'profile' },
  { label: 'Music song', value: 'music.song' },
  { label: 'Music album', value: 'music.album' },
  { label: 'Music playlist', value: 'music.playlist' },
  { label: 'Music radio station', value: 'music.radio_station' },
  { label: 'Video movie', value: 'video.movie' },
  { label: 'Video episode', value: 'video.episode' },
  { label: 'Video TV show', value: 'video.tv_show' },
  { label: 'Other video', value: 'video.other' },
]

export const twitterCardOptions = [
  { label: 'summary_large_image', value: 'summary_large_image' },
  { label: 'summary', value: 'summary' },
  { label: 'app', value: 'app' },
  { label: 'player', value: 'player' },
]

const baseSection: OpenGraphSection = {
  title: '基础信息',
  fields: [
    { key: 'title', label: '标题', placeholder: '页面标题' },
    { key: 'description', label: '描述', placeholder: '页面描述' },
    { key: 'url', label: '页面 URL', placeholder: 'https://example.com/page' },
    { key: 'site_name', label: '站点名称', placeholder: '站点或产品名称' },
    { key: 'locale', label: 'Locale', placeholder: 'zh_CN' },
  ],
}

const imageSection: OpenGraphSection = {
  title: '分享图片',
  fields: [
    { key: 'image', label: '图片 URL', placeholder: 'https://example.com/og.png' },
    { key: 'image:alt', label: '图片替代文本', placeholder: '图片内容描述' },
    { key: 'image:width', label: '图片宽度', placeholder: '1200', numeric: true },
    { key: 'image:height', label: '图片高度', placeholder: '630', numeric: true },
  ],
}

const twitterSection: OpenGraphSection = {
  title: 'Twitter',
  fields: [
    { key: 'twitter:site', label: '站点账号', placeholder: '@site' },
    { key: 'twitter:creator', label: '作者账号', placeholder: '@creator' },
  ],
}

const typedSections: Partial<Record<OpenGraphType, OpenGraphSection>> = {
  'article': {
    title: 'Article',
    fields: [
      { key: 'article:published_time', label: '发布时间', placeholder: '2026-07-15T00:00:00Z' },
      { key: 'article:modified_time', label: '修改时间', placeholder: '2026-07-15T08:00:00Z' },
      { key: 'article:expiration_time', label: '过期时间', placeholder: '可选' },
      { key: 'article:author', label: '作者', placeholder: 'Alice, Bob', list: true },
      { key: 'article:section', label: '栏目', placeholder: 'Technology' },
      { key: 'article:tag', label: '标签', placeholder: 'nuxt, tools', list: true },
    ],
  },
  'book': {
    title: 'Book',
    fields: [
      { key: 'book:author', label: '作者', placeholder: 'Alice, Bob', list: true },
      { key: 'book:isbn', label: 'ISBN', placeholder: '978...' },
      { key: 'book:release_date', label: '发布日期', placeholder: '2026-07-15' },
      { key: 'book:tag', label: '标签', placeholder: 'fiction, tools', list: true },
    ],
  },
  'profile': {
    title: 'Profile',
    fields: [
      { key: 'profile:first_name', label: 'First name', placeholder: 'Ada' },
      { key: 'profile:last_name', label: 'Last name', placeholder: 'Lovelace' },
      { key: 'profile:username', label: 'Username', placeholder: 'ada' },
      { key: 'profile:gender', label: 'Gender', placeholder: 'female' },
    ],
  },
  'music.song': {
    title: 'Song details',
    fields: [
      { key: 'music:duration', label: '时长（秒）', placeholder: '240', numeric: true },
      { key: 'music:album', label: '专辑 URL', placeholder: 'https://example.com/album' },
      { key: 'music:album:disc', label: 'Disc', placeholder: '1', numeric: true },
      { key: 'music:album:track', label: 'Track', placeholder: '3', numeric: true },
      { key: 'music:musician', label: '音乐人', placeholder: 'Alice, Bob', list: true },
    ],
  },
  'music.album': {
    title: 'Album details',
    fields: [
      { key: 'music:song', label: '歌曲 URL', placeholder: 'https://example.com/song' },
      { key: 'music:song:disc', label: 'Disc', placeholder: '1', numeric: true },
      { key: 'music:song:track', label: 'Track', placeholder: '3', numeric: true },
      { key: 'music:musician', label: '音乐人', placeholder: 'Alice, Bob', list: true },
      { key: 'music:release_date', label: '发布日期', placeholder: '2026-07-15' },
    ],
  },
  'music.playlist': {
    title: 'Playlist details',
    fields: [
      { key: 'music:song', label: '歌曲 URL', placeholder: 'https://example.com/song' },
      { key: 'music:song:disc', label: 'Disc', placeholder: '1', numeric: true },
      { key: 'music:song:track', label: 'Track', placeholder: '3', numeric: true },
      { key: 'music:creator', label: '创建者', placeholder: 'Alice' },
    ],
  },
  'music.radio_station': {
    title: 'Radio station details',
    fields: [
      { key: 'music:creator', label: '创建者', placeholder: 'Alice' },
    ],
  },
  'video.movie': {
    title: 'Movie details',
    fields: [
      { key: 'video:actor', label: '演员', placeholder: 'Alice, Bob', list: true },
      { key: 'video:director', label: '导演', placeholder: 'Alice, Bob', list: true },
      { key: 'video:writer', label: '编剧', placeholder: 'Alice, Bob', list: true },
      { key: 'video:duration', label: '时长（秒）', placeholder: '7200', numeric: true },
      { key: 'video:release_date', label: '发布日期', placeholder: '2026-07-15' },
      { key: 'video:tag', label: '标签', placeholder: 'movie, trailer', list: true },
    ],
  },
  'video.episode': {
    title: 'Video episode details',
    fields: [
      { key: 'video:actor', label: '演员', placeholder: 'Alice, Bob', list: true },
      { key: 'video:director', label: '导演', placeholder: 'Alice, Bob', list: true },
      { key: 'video:writer', label: '编剧', placeholder: 'Alice, Bob', list: true },
      { key: 'video:duration', label: '时长（秒）', placeholder: '2700', numeric: true },
      { key: 'video:release_date', label: '发布日期', placeholder: '2026-07-15' },
      { key: 'video:tag', label: '标签', placeholder: 'episode, series', list: true },
      { key: 'video:series', label: '剧集 URL', placeholder: 'https://example.com/series' },
    ],
  },
  'video.tv_show': {
    title: 'TV show details',
    fields: [
      { key: 'video:actor', label: '演员', placeholder: 'Alice, Bob', list: true },
      { key: 'video:director', label: '导演', placeholder: 'Alice, Bob', list: true },
      { key: 'video:writer', label: '编剧', placeholder: 'Alice, Bob', list: true },
      { key: 'video:duration', label: '时长（秒）', placeholder: '2700', numeric: true },
      { key: 'video:release_date', label: '发布日期', placeholder: '2026-07-15' },
      { key: 'video:tag', label: '标签', placeholder: 'tv, show', list: true },
    ],
  },
  'video.other': {
    title: 'Other video details',
    fields: [
      { key: 'video:actor', label: '演员', placeholder: 'Alice, Bob', list: true },
      { key: 'video:director', label: '导演', placeholder: 'Alice, Bob', list: true },
      { key: 'video:writer', label: '编剧', placeholder: 'Alice, Bob', list: true },
      { key: 'video:duration', label: '时长（秒）', placeholder: '2700', numeric: true },
      { key: 'video:release_date', label: '发布日期', placeholder: '2026-07-15' },
      { key: 'video:tag', label: '标签', placeholder: 'video, clip', list: true },
    ],
  },
}

export function createDefaultOpenGraphMetaInput(): OpenGraphMetaInput {
  const input: OpenGraphMetaInput = {
    'type': 'website',
    'title': 'ISZY Tools',
    'description': 'Handy online tools for developers.',
    'url': 'https://example.com/tools',
    'site_name': 'ISZY',
    'locale': 'zh_CN',
    'image': 'https://example.com/og.png',
    'image:alt': 'ISZY Tools preview',
    'image:width': '1200',
    'image:height': '630',
    'twitter:card': 'summary_large_image',
  }

  for (const field of getAllFields()) {
    input[field.key] ??= ''
  }

  return input
}

export function getOpenGraphSections(type: OpenGraphType) {
  return [
    baseSection,
    imageSection,
    twitterSection,
    typedSections[type],
  ].filter(Boolean) as OpenGraphSection[]
}

export function generateOpenGraphMeta(input: OpenGraphMetaInput) {
  return generateMeta(createMetadata(input), { generateTwitterCompatibleMeta: true })
}

export function createMetadata(input: OpenGraphMetaInput): MetadataConfig {
  const metadata: MetadataConfig = {}
  const fieldMap = new Map(getAllFields().map(field => [field.key, field]))

  for (const [key, rawValue] of Object.entries(input)) {
    if (key === 'twitter:card') {
      assignTwitterMetadata(metadata, 'card', rawValue)
      continue
    }

    if (key.startsWith('twitter:')) {
      assignTwitterMetadata(metadata, key.replace(/^twitter:/, ''), rawValue)
      continue
    }

    const value = normalizeValue(rawValue, fieldMap.get(key))
    if (value !== undefined) {
      metadata[key] = value
    }
  }

  return metadata
}

export function splitList(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function assignTwitterMetadata(metadata: MetadataConfig, key: string, value: string) {
  const normalized = normalizeValue(value)
  if (normalized === undefined) {
    return
  }

  metadata.twitter = {
    ...((metadata.twitter ?? {}) as MetadataConfig),
    [key]: normalized,
  }
}

function normalizeValue(value: string, field?: OpenGraphField): MetadataValue | MetadataValue[] | undefined {
  if (field?.list) {
    const values = splitList(value)
    return values.length > 0 ? values : undefined
  }

  if (field?.numeric) {
    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function getAllFields() {
  return [
    { key: 'type', label: '类型', placeholder: '' },
    { key: 'twitter:card', label: 'Twitter Card', placeholder: '' },
    ...baseSection.fields,
    ...imageSection.fields,
    ...twitterSection.fields,
    ...Object.values(typedSections).flatMap(section => section?.fields ?? []),
  ]
}
