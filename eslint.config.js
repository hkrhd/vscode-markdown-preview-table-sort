const eslint = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'test-resources/**',
      '.vscode-test/**',
      '.vscode-test-resources/**',
      'coverage/**'
    ]
  },
  {
    files: ['eslint.config.js', '.mocharc.js'],
    languageOptions: {
      globals: globals.node
    }
  },
  eslint.configs.recommended,
  {
    files: ['media/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.browser
    },
    rules: {
      'no-restricted-globals': ['error', 'event']
    }
  },
  {
    files: ['src/ui-test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  }
];
