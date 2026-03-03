import type { MinimalUser, ResultDto } from '@zvonimirsun/iszy-common'

let profilePulled = false
let pullProfilePromise: Promise<ResultDto<{
  logged: boolean
  profile?: MinimalUser
}>> | null = null
export const useUserStore = defineStore('user', {
  state: () => ({
    profile: undefined as MinimalUser | undefined,
  }),
  getters: {
    logged: (state) => {
      return !!state.profile
    },
  },
  actions: {
    async login({ userName, password }: {
      userName: string
      password: string
    }) {
      let error = ''
      try {
        if (userName && password) {
          const res = await $fetch<ResultDto<MinimalUser>>(`/api/auth/login`, {
            method: 'post',
            body: {
              userName: userName.trim(),
              password,
            },
          })
          if (res.success) {
            profilePulled = true
            this.updateProfile(res.data)
            return
          }
          else {
            this.removeProfile()
            error = res.message
          }
        }
        else {
          error = '用户名或密码错误'
        }
      }
      catch (e) {
        this.removeProfile()
        throw e
      }
      throw new Error(error)
    },
    async logout() {

    },
    async pullProfile(force?: boolean) {
      if (profilePulled && !force) {
        return true
      }
      if (!pullProfilePromise || force) {
        pullProfilePromise = $fetch<ResultDto<{
          logged: boolean
          profile?: MinimalUser
        }>>(`/api/auth/check`)
        pullProfilePromise.then((res) => {
          if (res && res.success) {
            if (res.data!.logged) {
              profilePulled = true
            }
            else {
              this.updateProfile(res.data?.profile)
            }
          }
        })
      }
      try {
        const data = await pullProfilePromise
        if (data && data.success) {
          profilePulled = true
          return true
        }
        else {
          this.removeProfile()
          return false
        }
      }
      catch (e) {
        if ((e as Error).name === 'AbortError') {
          this.removeProfile()
        }
        return false
      }
    },
    updateProfile(data?: MinimalUser) {
      this.profile = data
      useOriginToolsStore().fetchTools()
    },
    removeProfile() {
      this.updateProfile()
    },
  },
})
