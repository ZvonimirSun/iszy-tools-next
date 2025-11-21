import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu(
  {},
  {
    rules: {
      'no-console': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
))
