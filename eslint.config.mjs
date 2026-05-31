// @ts-check
import eslint from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load custom ESLint rules as an @obsidian plugin
const customRules = require('./tools/scripts/eslint-rules');
const obsidianPlugin = {
  rules: {
    'no-raw-throw': customRules.noRawThrow,
    'no-direct-event-emitter': customRules.noDirectEventEmitter,
    'no-console-log': customRules.noConsoleLog,
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.nx/**',
      '**/coverage/**',
      '.cursor/**',
      'apps/platform-owner/legacy/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      '@nx': nxPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'prettier/prettier': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^\\./', '^\\.\\./', '^@obsidian/'],
          depConstraints: [
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:web', 'scope:design-system'],
            },
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: ['scope:backend'],
            },
            {
              sourceTag: 'scope:mobile',
              onlyDependOnLibsWithTags: ['scope:mobile', 'scope:design-system'],
            },
            {
              sourceTag: 'scope:desktop',
              onlyDependOnLibsWithTags: ['scope:desktop', 'scope:design-system'],
            },
            {
              sourceTag: 'scope:design-system',
              onlyDependOnLibsWithTags: ['scope:design-system'],
            },
            {
              sourceTag: 'layer:entrypoint',
              onlyDependOnLibsWithTags: ['layer:domain', 'layer:infra'],
            },
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:domain', 'layer:infra'],
            },
            {
              sourceTag: 'layer:infra',
              onlyDependOnLibsWithTags: ['layer:infra'],
            },
          ],
        },
      ],
    },
  },
  {
    // Backend source files — enforce load-bearing patterns via custom ESLint rules
    files: ['apps/backend/src/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**', '**/tests/**'],
    plugins: {
      '@obsidian': obsidianPlugin,
    },
    rules: {
      '@obsidian/no-raw-throw': 'error',
      '@obsidian/no-direct-event-emitter': 'error',
      '@obsidian/no-console-log': 'error',
    },
  },
);
