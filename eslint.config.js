import js from '@eslint/js';

const browser = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  performance: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  CSS: 'readonly',
};
const node = { process: 'readonly', console: 'readonly', URL: 'readonly' };
const worker = { self: 'readonly', caches: 'readonly', fetch: 'readonly', URL: 'readonly', Response: 'readonly' };

export default [
  js.configs.recommended,
  {
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  { files: ['src/**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browser } },
  { files: ['sw.js'], languageOptions: { sourceType: 'script', globals: worker } },
  { files: ['scripts/**', 'tests/**', 'eslint.config.js'], languageOptions: { globals: node } },
];
