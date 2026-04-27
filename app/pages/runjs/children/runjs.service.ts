import type { RunjsDependency } from '~/stores/runjs'
import { parse } from 'acorn'

export interface RunjsDependencyValidationResult {
  normalized: RunjsDependency[] | null
  error: string
}

export function buildRunjsImportMap(deps: RunjsDependency[]) {
  const imports: Record<string, string> = {}
  for (const dep of deps) {
    const name = dep.name.trim()
    const url = dep.url.trim()
    if (!name || !url || imports[name]) {
      continue
    }
    imports[name] = url
  }
  return { imports }
}

export function findDuplicateRunjsAliases(deps: RunjsDependency[]) {
  const countMap = new Map<string, number>()
  for (const dep of deps) {
    const alias = dep.name.trim()
    if (!alias) {
      continue
    }
    countMap.set(alias, (countMap.get(alias) || 0) + 1)
  }

  return [...countMap.entries()]
    .filter(([, count]) => count > 1)
    .map(([alias]) => alias)
}

export function normalizeRunjsDependencies(drafts: RunjsDependency[]): RunjsDependencyValidationResult {
  const aliasSet = new Set<string>()
  const normalized: RunjsDependency[] = []

  for (const [index, item] of drafts.entries()) {
    const name = item.name.trim()
    const inputUrl = item.url.trim()

    if (!name && !inputUrl) {
      continue
    }
    if (!name) {
      return {
        normalized: null,
        error: `第 ${index + 1} 行需填写别名`,
      }
    }
    if (/\s/.test(name)) {
      return {
        normalized: null,
        error: `第 ${index + 1} 行别名不能包含空白字符`,
      }
    }
    if (aliasSet.has(name)) {
      return {
        normalized: null,
        error: `第 ${index + 1} 行别名重复：${name}`,
      }
    }

    let url = inputUrl || `https://esm.sh/${name}`
    if (inputUrl && !/^https?:\/\//i.test(inputUrl)) {
      url = `https://esm.sh/${inputUrl}`
    }

    try {
      const parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) {
        return {
          normalized: null,
          error: `第 ${index + 1} 行 URL 仅支持 http/https`,
        }
      }
    }
    catch {
      return {
        normalized: null,
        error: `第 ${index + 1} 行 URL 无效`,
      }
    }

    aliasSet.add(name)
    normalized.push({ name, url })
  }

  return {
    normalized,
    error: '',
  }
}

export function runjsDepsSignature(deps: RunjsDependency[]) {
  return deps.map(dep => `${dep.name.trim()}|${dep.url.trim()}`).join('\n')
}

export function escapeScriptTag(source: string) {
  return source.replace(/<\/script/gi, '<\\/script')
}

export function instrumentExpressionStatements(code: string) {
  const ast = parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }) as {
    body: Array<{ type: string, directive?: string, start: number, end: number }>
  }

  const patches: Array<{ start: number, end: number, text: string }> = []

  for (const stmt of ast.body) {
    if (stmt.type !== 'ExpressionStatement' || stmt.directive) {
      continue
    }

    const expressionCode = code.slice(stmt.start, stmt.end).replace(/;\s*$/u, '')
    patches.push({
      start: stmt.start,
      end: stmt.end,
      text: `__runjs_output(( ${expressionCode} ))`,
    })
  }

  if (!patches.length) {
    return code
  }

  let output = code
  for (const patch of patches.toReversed()) {
    output = output.slice(0, patch.start) + patch.text + output.slice(patch.end)
  }

  return output
}

export function buildRunjsSrcdoc(executableCode: string, importMap: { imports: Record<string, string> }, frameSource: string) {
  const safeCode = escapeScriptTag(executableCode)
  const importMapText = escapeScriptTag(JSON.stringify(importMap))

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script type="importmap">${importMapText}<\/script>
</head>
<body>
  <script>
    const source = '${frameSource}'

    function serialize(value) {
      if (value instanceof Error) {
        return value.stack || value.message || String(value)
      }
      if (typeof value === 'string') {
        return value
      }
      if (typeof value === 'bigint') {
        return value.toString()
      }
      if (value === undefined) {
        return 'undefined'
      }
      if (typeof value === 'function') {
        return '[Function]'
      }

      try {
        const seen = new WeakSet()
        return JSON.stringify(value, (key, item) => {
          if (typeof item === 'bigint') {
            return item.toString()
          }
          if (typeof item === 'object' && item !== null) {
            if (seen.has(item)) {
              return '[Circular]'
            }
            seen.add(item)
          }
          return item
        }, 2)
      }
      catch {
        return String(value)
      }
    }

    function post(type, payload) {
      window.parent.postMessage({
        source,
        type,
        time: Date.now(),
        ...payload,
      }, '*')
    }

    console.log = (...args) => {
      post('log', { text: args.map(serialize).join(' ') })
    }

    console.error = (...args) => {
      const firstError = args.find(arg => arg instanceof Error)
      post('error', {
        text: args.map(serialize).join(' '),
        stack: firstError ? (firstError.stack || firstError.message) : undefined,
      })
    }

    window.__runjs_output = (value) => {
      post('result', {
        text: serialize(value),
      })
    }

    window.addEventListener('error', (event) => {
      post('runtime-error', {
        text: String(event.message || '运行时错误'),
        stack: event.error?.stack || (event.filename ? event.filename + ':' + event.lineno + ':' + event.colno : undefined),
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      post('unhandledrejection', {
        text: serialize(reason),
        stack: reason?.stack,
      })
    })
  <\/script>

  <script type="module">
${safeCode}
  <\/script>
</body>
</html>`
}
