import type { Device, ResultDto } from '@zvonimirsun/iszy-common'
import dayjs from 'dayjs'

export const useUserStore = defineStore('user', () => {
  const profilePulled = ref(false)
  const profile = ref<PublicSimpleUser>()
  const logged = computed(() => {
    return !!profile.value
  })

  let pullProfilePromise: Promise<ResultDto<{
    logged: boolean
    profile?: PublicSimpleUser
  }>> | null = null
  let pullProfileResolve: ((value: ResultDto<{ logged: boolean, profile?: PublicSimpleUser }>) => void) | null
  let pullProfileReject: ((value: unknown) => void) | null
  let pullProfileAbortController: AbortController | null = null // 用于中断请求

  async function login({ userName, password }: {
    userName: string
    password: string
  }) {
    let error = ''
    try {
      if (userName && password) {
        const res = await $fetch<ResultDto<PublicSimpleUser>>(`/api/auth/login`, {
          method: 'post',
          body: {
            userName: userName.trim(),
            password,
          },
        })
        if (res.success) {
          profilePulled.value = true
          await updateProfile(res.data)
          await useSettingsStore().getSyncData()
          return
        }
        else {
          removeProfile()
          error = res.message
        }
      }
      else {
        error = '用户名或密码错误'
      }
    }
    catch (e) {
      removeProfile()
      throw e
    }
    throw new Error(error)
  }

  async function logout() {
    const data = await $fetch<ResultDto<void>>(`/api/auth/logout`, {
      method: 'POST',
    })
    if (data && data.success) {
      await removeProfile()
    }
    else {
      throw new Error(data?.message || '登出失败')
    }
  }

  async function pullProfile(force?: boolean, fetcher: Fetcher = $fetch) {
    // 1. 非强制刷新且已拉取成功，直接返回
    if (profilePulled.value && !force) {
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
      profile?: PublicSimpleUser
    }>>((resolve, reject) => {
      pullProfileResolve = resolve
      pullProfileReject = reject
    })
    try {
      // 创建 AbortController 用于中断请求
      pullProfileAbortController = new AbortController()
      const res = await fetcher<ResultDto<{
        logged: boolean
        profile?: PublicSimpleUser
      }>>(`/api/auth/check`, {
        signal: pullProfileAbortController.signal, // 关联中断信号
      })
      if (res && res.success) {
        await updateProfile(res.data?.profile, fetcher)
        profilePulled.value = true
        // 安全调用 resolve（避免空值）
        pullProfileResolve?.(res)
      }
      else {
        await removeProfile(fetcher)
        // 安全调用 reject
        pullProfileReject?.(new Error(res?.message || '拉取用户信息失败'))
      }
    }
    catch (error) {
      // 处理中断错误（无需提示，属于正常取消）
      if ((error as Error).name !== 'AbortError') {
        await removeProfile(fetcher)
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
  }

  async function updateProfile(data?: PublicSimpleUser, fetcher?: Fetcher) {
    profile.value = data
    return useOriginToolsStore().fetchTools(fetcher)
  }

  async function removeProfile(fetcher?: Fetcher) {
    return updateProfile(undefined, fetcher)
  }

  async function thirdPartyUnbind(type: string) {
    await $fetch<{
      success: boolean
    }>('/api/oauth/unbind', {
      method: 'POST',
      body: {
        provider: type,
      },
    })
    await pullProfile(true)
  }

  async function getDevices(): Promise<(Device & {
    createTime?: string
    lastLoginTime?: string
  })[]> {
    const res = await $fetch<ResultDto<Device[]>>(`/api/auth/devices`)
    return res.data!.map((device: Device & {
      createTime?: string
      lastLoginTime?: string
    }) => {
      const ip = device.ip
      if (!ip) {
        device.ip = '未知'
      }
      else {
        const tmp = ip.split('.')
        device.ip = `${tmp[0]}.${tmp[1]}.***.***`
      }
      device.createTime = dayjs(device.createdAt!).format('YYYY年MM月DD日 HH:mm')
      device.lastLoginTime = dayjs(device.updatedAt!).format('YYYY年MM月DD日 HH:mm')
      return device
    })
  }

  async function removeDevice({ deviceId, other }: {
    deviceId?: string
    all?: boolean
    other?: boolean
  }) {
    if (other) {
      await $fetch(`/api/auth/logout`, {
        method: 'POST',
        query: {
          other,
        },
      })
      return
    }
    if (deviceId) {
      await $fetch(`/api/auth/logout`, {
        method: 'POST',
        query: {
          deviceId,
        },
      })
    }
  }

  return {
    profilePulled,
    profile,
    logged,
    login,
    logout,
    pullProfile,
    updateProfile,
    removeProfile,
    thirdPartyUnbind,
    getDevices,
    removeDevice,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
