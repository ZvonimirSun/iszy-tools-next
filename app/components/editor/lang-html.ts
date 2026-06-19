import type { EditorPlugin } from '#shared/types/editor'
import { html } from '@codemirror/lang-html'
import beautify from 'js-beautify'

export function formatter(value: string, { indent = 2 } = {}) {
  return beautify.html(value, {
    indent_size: indent,
  })
}

export function compactor(value: string) {
  return value
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const plugin: EditorPlugin = {
  formatter,
  compactor,
  extensions: [
    html(),
  ],
}

export default plugin
