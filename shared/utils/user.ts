import type { PublicSimpleUser, PublicSimpleUserOmit } from '#shared/types/user'
import type { Optional, PublicUser } from '@zvonimirsun/iszy-common'

export function toPublicSimpleUser(user: Optional<PublicUser, PublicSimpleUserOmit>): PublicSimpleUser {
  const { groups, status, createBy, updateBy, privileges, ...result } = user
  return result
}
