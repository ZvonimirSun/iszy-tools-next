import type { PublicUser } from '@zvonimirsun/iszy-common'
import { emptyProfile } from '#shared/data/user'
import { cloneDeep } from 'lodash-es'

export const useUserStore = defineStore('user', {
  state: () => ({
    logged: false,
    profile: cloneDeep(emptyProfile) as PublicUser,
  }),
})
