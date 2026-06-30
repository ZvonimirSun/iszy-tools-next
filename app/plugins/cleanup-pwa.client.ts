export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  onNuxtReady(async () => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const reloadKey = 'iszy:pwa-cleanup-reloaded'
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(registration => registration.unregister()))

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys
        .filter(key => key.startsWith('iszy-tools-next-') || key.startsWith('workbox-'))
        .map(key => caches.delete(key)))
    }

    if (navigator.serviceWorker.controller && sessionStorage.getItem(reloadKey) !== '1') {
      sessionStorage.setItem(reloadKey, '1')
      window.location.reload()
      return
    }

    sessionStorage.removeItem(reloadKey)
  })
})
