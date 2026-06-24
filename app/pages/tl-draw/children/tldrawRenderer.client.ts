import type { Root } from 'react-dom/client'
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export function mountTlDraw(container: HTMLElement) {
  const { cdnOrigin, features: { tlDraw } } = usePublicConfig()
  const isDark = useIsDark()
  const root: Root = createRoot(container)
  let syncColorScheme = () => {}

  root.render(createElement(Tldraw, {
    assetUrls: getAssetUrls({ baseUrl: `${cdnOrigin}/jsd/npm/@tldraw/assets@3.15.5/` }),
    onMount: (editor) => {
      syncColorScheme = () => {
        editor.user.updateUserPreferences({
          colorScheme: isDark.value ? 'dark' : 'light',
        })
      }
      syncColorScheme()
    },
    ...(tlDraw.persistenceKey ? { persistenceKey: tlDraw.persistenceKey } : {}),
  }))

  const stopWatch = watch(isDark, () => {
    syncColorScheme()
  })

  return () => {
    stopWatch()
    root.unmount()
  }
}
