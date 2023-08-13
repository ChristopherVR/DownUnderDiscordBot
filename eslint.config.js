import warnings from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import jsdoc from 'eslint-plugin-jsdoc';

import TypeScriptEsLintConfigs from '@typescript-eslint/eslint-plugin';

export default [
  'eslint:recommended',
  TypeScriptEsLintConfigs.configs.all,
  prettier.configs.all,
  {
    root: true,
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', 'eslint.config.js'],
    parserOptions: {
      project: ['tsconfig.json'],
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      warnings,
      jsdoc,
      prettier,
    },
    rules: {
      ...AngularEslintPluginTemplateConfigs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      'no-return-await': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      'deprecation/deprecation': 'error',
      '@typescript-eslint/member-ordering': ['error'],
      'no-underscore-dangle': 'error',
      '@typescript-eslint/naming-convention': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          overrides: {
            constructors: 'implicit',
            properties: 'explicit',
          },
        },
      ],
      'arrow-parens': ['error', 'always'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
    },
  },
];
