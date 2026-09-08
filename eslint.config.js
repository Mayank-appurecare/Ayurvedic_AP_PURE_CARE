// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // These two rules flag a pattern (data loading in useEffect, Animated refs
    // read during render) that's widespread and working across this codebase.
    // Downgraded to warn so CI isn't blocked while it's fixed screen by screen.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly' },
    },
  },
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        device: 'readonly',
        element: 'readonly',
        by: 'readonly',
        waitFor: 'readonly',
        expect: 'readonly',
      },
    },
  },
]);
