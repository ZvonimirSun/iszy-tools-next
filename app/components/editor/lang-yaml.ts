import type { EditorPlugin } from '#shared/types/editor'
import { yaml } from '@codemirror/lang-yaml'
import { parseDocument } from 'yaml'

interface YamlFormatOptions {
  indent?: number
}

export function formatter(val: string, { indent = 2 }: YamlFormatOptions = {}): string {
  const doc = parseDocument(val, {
    prettyErrors: false,
  })

  if (doc.errors.length) {
    return val
  }

  return doc.toString({
    indent,
    lineWidth: 0,
  }).trimEnd()
}

export function isValid(val: string): boolean {
  const doc = parseDocument(val, {
    prettyErrors: false,
  })

  return doc.errors.length === 0
}

const plugin: EditorPlugin = {
  formatter,
  isValid,
  extensions: [
    yaml(),
  ],
}

export default plugin
