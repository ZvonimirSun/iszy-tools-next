import dayjs from 'dayjs'

export const useLinuxCommandStore = defineStore('linuxCommand', {
  state: () => ({
    data: {} as Record<string, any>,
    time: null as string | null,
  }),
  actions: {
    async getData() {
      const { cdnOrigin } = usePublicConfig()
      this.data = await $fetch(`${cdnOrigin}/jsd/gh/jaywcjlove/linux-command@1.8.1/dist/data.min.json`)
      this.time = dayjs().format()
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLinuxCommandStore, import.meta.hot))
}
