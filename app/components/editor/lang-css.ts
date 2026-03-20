import type { EditorPlugin } from '#shared/types/editor'
import { css } from '@codemirror/lang-css'
import { css as cssBeautify } from 'js-beautify'

const search1 = /\s+/g
const search2 = /\s*\{\s*/g
const search3 = /\s*\}\s*/g
const search4 = /\s*:\s*/g
const search5 = /\s*;\s*/g

export function formatter(val: string, { indent = 2 } = {}) {
  return cssBeautify(val, { indent_size: indent })
}

export function compactor(val: string): string {
  return val.replace(search1, ' ')
    .replace(search2, '{')
    .replace(search3, '}')
    .replace(search4, ':')
    .replace(search5, ';')
}

const plugin: EditorPlugin = {
  formatter,
  compactor,
  extensions: [
    css(),
  ],
}

export default plugin
