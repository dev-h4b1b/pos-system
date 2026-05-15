import createConfig from '@pos-system/eslint-config/create-config'

export default createConfig(
  {},
  {
    ignores: ['src/routeTree.gen.ts'],
  },
  {
    rules: {
      'style/max-statements-per-line': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
    },
  },
)
