export interface RunjsDependency {
  name: string
  url: string
}

export const useRunjsStore = defineStore('runjs', () => {
  const code = ref(`console.log('RunJS ready')`)
  const deps = ref<RunjsDependency[]>([])

  return {
    code,
    deps,
  }
}, {
  persist: true,
})
