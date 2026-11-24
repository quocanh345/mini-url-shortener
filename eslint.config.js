import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/dist', '**/coverage', 'backend/logs', 'backend/backups']),

  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Backend + root config files: Node.js
  {
    files: ['backend/**/*.js', '*.js'],
    languageOptions: { globals: globals.node },
  },

  // Frontend: React in the browser
  {
    files: ['frontend/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['frontend/vite.config.js'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off rules that conflict with Prettier
  eslintConfigPrettier,
]);
