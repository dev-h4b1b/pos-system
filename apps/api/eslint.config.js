import createConfig from '@pos-system/eslint-config/create-config'

export default createConfig(
  {},
  {
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-empty-object-type': 'off',
      'ts/no-redeclare': 'off',
    },
  },
)
