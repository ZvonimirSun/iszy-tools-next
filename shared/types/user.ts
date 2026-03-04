import type { PublicUser } from '@zvonimirsun/iszy-common'

export type PublicSimpleUserOmit = 'groups' | 'status' | 'createBy' | 'updateBy' | 'privileges'
export type PublicSimpleUser = Omit<PublicUser, PublicSimpleUserOmit>
