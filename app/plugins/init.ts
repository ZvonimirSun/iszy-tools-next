export default defineNuxtPlugin(() => {
  // Public catalog initialization is synchronous and never depends on a session.
  useOriginToolsStore()
  if (import.meta.server)
    return

  // Discard a persisted account overlay before restoring the current session.
  useSettingsStore().resetSync()
  const auth = useAuthInitStore()
  authEvents.on('profileUpdated', auth.profileUpdated)
  onNuxtReady(() => {
    void auth.ensureAuth().catch(() => {})
  })
})
