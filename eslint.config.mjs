import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { configs } from 'typescript-eslint';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettierRecommended,
  ...configs.recommended,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/sw.js',
    'public/workbox-*.js',
    'public/swe-worker-*.js',
  ]),
  {
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionExpression',
          message:
            'function 표현식 대신 const name = () => {} 화살표 함수 형식을 사용하세요.',
        },
      ],
    },
  },
]);

export default eslintConfig;
