module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => /^chore\(release\): \d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)? \[skip ci\](?:\r?\n|$)/.test(message)
  ]
};