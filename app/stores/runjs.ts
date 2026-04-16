export interface RunjsDependency {
  name: string
  url: string
}

export const useRunjsStore = defineStore('runjs', {
  state: () => ({
    code: `console.log('RunJS ready')`,
    deps: [] as RunjsDependency[],
  }),
  persist: true,
})
