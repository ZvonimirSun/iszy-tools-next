import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#layers/iszy-nuxt-auth-layer': fileURLToPath(new URL('./node_modules/@zvonimirsun/iszy-nuxt-auth-layer', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
