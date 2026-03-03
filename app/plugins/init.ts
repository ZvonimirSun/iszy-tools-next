export default defineNuxtPlugin({
  async setup() {
    const headers = useRequestHeaders(['cookie'])
    await useUserStore().pullProfile(false, headers)
    await useOriginToolsStore().init(headers)
  },
})
