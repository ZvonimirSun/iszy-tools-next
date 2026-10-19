export default defineNuxtPlugin(() => {
  // Public catalog initialization is synchronous and never depends on a session.
  useOriginToolsStore()
  if (import.meta.server)
    return

  const auth = useAuthInitStore()
  authEvents.on('profileUpdated', auth.profileUpdated)
  onNuxtReady(() => {
    void auth.ensureAuth().catch(() => {})
  })
})
