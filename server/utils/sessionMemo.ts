import type { H3Event } from 'h3'
import {
  getRedisSession as readSession,
  rotateRedisSession as rotateSession,
  setRedisSession as writeSession,
} from '#layers/iszy-nuxt-auth-layer/server/utils/sessionStore'

type Session = Awaited<ReturnType<typeof readSession>>
const reads = new WeakMap<H3Event, Promise<Session>>()

// Root server imports override the layer's auto-imports. Keep renewal, token
// rotation, tombstones and revocation in the layer; memoize reads per event only.
export function getRedisSession(event: H3Event): Promise<Session> {
  let pending = reads.get(event)
  if (!pending) {
    pending = readSession(event).catch((error) => {
      reads.delete(event)
      throw error
    })
    reads.set(event, pending)
  }
  return pending
}

export async function setRedisSession(...args: Parameters<typeof writeSession>) {
  const previous = reads.get(args[0])
  reads.delete(args[0])
  try {
    await writeSession(...args)
    // The layer renews before routing in H3 v1. A renewal of the exact same
    // session must not force the handler to GET Redis again.
    if (args[1] && previous && await previous === args[1])
      reads.set(args[0], previous)
  }
  catch (error) {
    reads.delete(args[0])
    throw error
  }
}

export async function rotateRedisSession(...args: Parameters<typeof rotateSession>) {
  reads.delete(args[0])
  try {
    const session = await rotateSession(...args)
    reads.set(args[0], Promise.resolve(session))
    return session
  }
  catch (error) {
    reads.delete(args[0])
    throw error
  }
}

export async function destroyRedisSession(event: H3Event) {
  await setRedisSession(event, undefined)
}
