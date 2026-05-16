import type { GameState } from '~/pages/2048/children/2048.types'
import { defineStore } from 'pinia'

export const use2048Store = defineStore('2048', () => {
  const gameState = ref<GameState | null>(null)

  function setBestScore(bestScore: number) {
    useSettingsStore().modules['2048'].bestScore = bestScore
  }

  function setGameState(nextGameState?: GameState) {
    gameState.value = nextGameState ?? null
  }

  function clearGameState() {
    setGameState()
  }

  return {
    gameState,
    setBestScore,
    setGameState,
    clearGameState,
  }
}, {
  persist: true,
})
