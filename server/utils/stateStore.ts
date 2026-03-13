import type { StateData } from '#server/types/state'
import ms from 'ms'

export function getStateKey(state: string): string {
  return `oauth:state:${state}`
}

export async function setState(state: string, data: StateData) {
  const storage = useStorage<StateData>('redis')
  return await storage.setItem(getStateKey(state), data, {
    ttl: ms('5m') / 1000,
  })
}

export async function getState(state: string) {
  const storage = useStorage<StateData>('redis')
  return await storage.getItem(getStateKey(state))
}

export async function removeState(state: string) {
  const storage = useStorage<StateData>('redis')
  await storage.removeItem(getStateKey(state))
}
