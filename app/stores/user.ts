import { emptyProfile } from '#shared/data/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    logged: false,
    profile: structuredClone(emptyProfile),
  }),
})
