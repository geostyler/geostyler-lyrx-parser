module.exports = {
  extends: '@terrestris/eslint-config-typescript',
  rules: {
    'no-underscore-dangle': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    camelcase: [
      'off',
      {
        ignoreImports: true,
      },
    ],
  },
};
