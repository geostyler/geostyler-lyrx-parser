module.exports = {
  extends: ["@terrestris/eslint-config-typescript", "prettier"],
  rules: {
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    camelcase: [
      "off",
      {
        ignoreImports: true,
      },
    ],
  },
};
