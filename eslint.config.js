import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

import eslintPlugin from '@typescript-eslint/eslint-plugin';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Airbnb not compatible with Flat config yet
// Need to use backwards compatibility util - https://eslint.org/blog/2022/08/new-config-system-part-2/#backwards-compatibility-utility
// import airbnb from 'eslint-config-airbnb-base';

import imprt from 'eslint-plugin-import'; // 'import' is ambiguous & prettier has trouble
import prettier from 'eslint-plugin-prettier';
import deprecation from 'eslint-plugin-deprecation';
import preferArrow from 'eslint-plugin-prefer-arrow';
import jsdoc from 'eslint-plugin-jsdoc';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname, // optional; default: process.cwd()
//   resolvePluginsRelativeTo: __dirname, // optional
//   recommendedConfig: js.configs.recommended, // optional
//   allConfig: js.configs.all, // optional
// });

/** @type { import("eslint").Linter.FlatConfig[] } */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'bin/**', 'build/**', '.eslint.config.js', 'jest.config.js'],
  },
  // mimic extends
  // ...compat.extends('airbnb'),
  {
    files: ['**/*.ts'],
    plugins: {
      eslintPlugin,
      import: imprt,
      '@typescript-eslint': ts,
      ts,
      prettier,
      'prefer-arrow': preferArrow,
      deprecation,
      jsdoc,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      ...imprt.configs.recommended.rules,
      ...prettier.configs['recommended'].rules,
      ...ts.configs['recommended'].rules,
      ...ts.configs['recommended-type-checked'].rules,
      ...ts.configs['stylistic-type-checked'].rules,
      ...deprecation.configs.recommended.rules,
      'ts/return-await': 2,
      semi: 'error',
      'prefer-const': 'error',
      'jsdoc/require-example': 'error',
      'prefer-arrow/prefer-arrow-functions': [
        'warn',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
      'deprecation/deprecation': 'error',
    },
  },
];
