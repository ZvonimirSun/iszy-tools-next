import type { EditorPlugin } from '#shared/types/editor'
import { esLint, javascript } from '@codemirror/lang-javascript'
import { linter } from '@codemirror/lint'

// Uses linter.mjs
import * as eslint from 'eslint-linter-browserify'
import { js as jsBeautify } from 'js-beautify'

// flat config format (ESLint v9+)
const config = [
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
]

export function formatter(value: string, { indent = 2 } = {}) {
  return jsBeautify(value, {
    indent_size: indent,
  })
}

const plugin: EditorPlugin = {
  formatter,
  miniExtensions: [
    javascript(),
  ],
  extensions: [
    javascript(),
    linter(esLint(new eslint.Linter(), config)),
  ],
}

export default plugin
