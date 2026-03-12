export default defineNuxtPlugin({
  async setup() {
    const headers = useRequestHeaders()
    await useUserStore().pullProfile(false, headers)
    await useOriginToolsStore().init(headers)
  },
})
