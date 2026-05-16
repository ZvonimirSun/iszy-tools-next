import dayjs from 'dayjs'

export const useLinuxCommandStore = defineStore('linuxCommand', () => {
  const data = ref<Record<string, any>>({})
  const time = ref<string | null>(null)

  async function getData() {
    const { cdnOrigin } = usePublicConfig()
    data.value = await $fetch<Record<string, any>>(`${cdnOrigin}/jsd/gh/jaywcjlove/linux-command@1.8.1/dist/data.min.json`)
    time.value = dayjs().format()
  }

  return {
    data,
    time,
    getData,
  }
}, {
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLinuxCommandStore, import.meta.hot))
}
