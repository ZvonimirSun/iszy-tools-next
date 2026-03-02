const locks = new Map<string, Promise<void>>()

export async function refreshWithLock(sessionId: string, fn: () => Promise<void>) {
  if (locks.has(sessionId)) {
    return locks.get(sessionId)!
  }

  const p = (async () => {
    try {
      await fn()
    }
    finally {
      locks.delete(sessionId)
    }
  })()

  locks.set(sessionId, p)
  return p
}
