import { sharedPagePaths } from '#shared/utils/pageCache'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', () => {
    const path = nuxtApp.$router.currentRoute.value.path
    if (sharedPagePaths.has(path)) {
      // Nuxt otherwise serializes the first visitor's query into payload.path,
      // which can override the next visitor's query during client hydration.
      // The browser router combines this canonical path with window.search.
      nuxtApp.payload.path = path
    }
  })
})
