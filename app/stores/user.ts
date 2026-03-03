import type { MinimalUser, ResultDto } from '@zvonimirsun/iszy-common'

let pullProfilePromise: Promise<ResultDto<{
  logged: boolean
  profile?: MinimalUser
}>> | null = null
let pullProfileResolve: ((value: ResultDto<{ logged: boolean, profile?: MinimalUser }>) => void) | null
let pullProfileReject: ((value: unknown) => void) | null
let pullProfileAbortController: AbortController | null = null // 用于中断请求

export const useUserStore = defineStore('user', {
  state: () => ({
    profilePulled: false,
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
            this.profilePulled = true
            await this.updateProfile(res.data)
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
      const data = await $fetch<ResultDto<void>>(`/api/auth/logout`, {
        method: 'POST',
      })
      if (data && data.success) {
        await this.removeProfile()
      }
      else {
        throw new Error(data?.message || '登出失败')
      }
    },
    async pullProfile(force?: boolean, headers?: any) {
      // 1. 非强制刷新且已拉取成功，直接返回
      if (this.profilePulled && !force) {
        return true
      }

      // 2. 强制刷新：中断正在进行的请求并重置状态
      if (force) {
        // 中断之前的请求
        if (pullProfileAbortController) {
          pullProfileAbortController.abort()
          pullProfileAbortController = null
        }
        // 重置 Promise 相关状态
        pullProfilePromise = null
        pullProfileResolve = null
        pullProfileReject = null
      }

      // 3. 非强制刷新且已有请求中，返回现有 Promise
      if (pullProfilePromise && !force) {
        return pullProfilePromise
      }

      // 4. 创建新的 Promise 并发起请求
      pullProfilePromise = new Promise<ResultDto<{
        logged: boolean
        profile?: MinimalUser
      }>>((resolve, reject) => {
        pullProfileResolve = resolve
        pullProfileReject = reject
      })
      try {
        // 创建 AbortController 用于中断请求
        pullProfileAbortController = new AbortController()
        const res = await $fetch<ResultDto<{
          logged: boolean
          profile?: MinimalUser
        }>>(`/api/auth/check`, {
          headers,
          signal: pullProfileAbortController.signal, // 关联中断信号
        })
        if (res && res.success) {
          await this.updateProfile(res.data?.profile, headers)
          this.profilePulled = true
          // 安全调用 resolve（避免空值）
          pullProfileResolve?.(res)
        }
        else {
          await this.removeProfile(headers)
          // 安全调用 reject
          pullProfileReject?.(new Error(res?.message || '拉取用户信息失败'))
        }
      }
      catch (error) {
        // 处理中断错误（无需提示，属于正常取消）
        if ((error as Error).name !== 'AbortError') {
          await this.removeProfile(headers)
          console.error('拉取用户信息异常:', error)
        }
        // 安全调用 reject
        pullProfileReject?.(error)
      }
      finally {
        // 清理资源
        pullProfileAbortController = null
        pullProfileResolve = null
        pullProfileReject = null
        // 关键：请求完成后重置 Promise（避免复用旧 Promise）
        pullProfilePromise = null
      }
      return pullProfilePromise
    },
    async updateProfile(data?: MinimalUser, headers?: any) {
      this.profile = data
      return useOriginToolsStore().fetchTools(headers)
    },
    async removeProfile(headers?: any) {
      return this.updateProfile(headers)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
