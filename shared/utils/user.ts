import type { Optional, PublicUser } from '@zvonimirsun/iszy-common'
import type { PublicSimpleUser, PublicSimpleUserOmit } from '#shared/types/user'

export function toPublicSimpleUser(user: Optional<PublicUser, PublicSimpleUserOmit>): PublicSimpleUser {
  const { groups, status, createBy, updateBy, privileges, ...result } = user
  return result
}
