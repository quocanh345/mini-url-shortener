import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/dist', '**/coverage', 'backend/logs', 'backend/backups']),

  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [js.configs.recommended],
  },

  // TypeScript
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // Backend + root config files: Node.js
  {
    files: ['backend/**/*.ts', '*.js', 'frontend/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // Frontend: React in the browser
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },

  // Must stay last: turns off rules that conflict with Prettier
  eslintConfigPrettier,
]);
