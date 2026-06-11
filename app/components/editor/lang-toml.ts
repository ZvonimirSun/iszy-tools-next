import type { EditorPlugin } from '#shared/types/editor'
import { StreamLanguage } from '@codemirror/language'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { parse, stringify } from 'smol-toml'

export function formatter(val: string): string {
  try {
    return stringify(parse(val)).trimEnd()
  }
  catch (e) {
    return val
  }
}

export function isValid(val: string): boolean {
  try {
    parse(val)
    return true
  }
  catch (e) {
    return false
  }
}

const plugin: EditorPlugin = {
  formatter,
  isValid,
  extensions: [
    StreamLanguage.define(toml),
  ],
}

export default plugin
