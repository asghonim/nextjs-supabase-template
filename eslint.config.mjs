// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    files: ['app/**/*.{js,jsx,ts,tsx}', 'components/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/router',
              message: 'Use next/navigation in App Router code.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'nav',
          property: 'go',
          message: 'Use next/navigation router methods instead of nav.go().',
        },
        {
          object: 'window',
          property: 'location',
          message: 'Use next/navigation or <Link> instead of window.location for internal navigation.',
        },
        {
          object: 'history',
          property: 'pushState',
          message: 'Use next/navigation router methods instead of history.pushState().',
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
])

export default eslintConfig
