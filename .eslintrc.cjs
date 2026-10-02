module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
  ],
  overrides: [
    {
      files: ['src/lib/policy/**/*.ts'],
      excludedFiles: ['src/lib/policy/compiler.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/lib/llm/**', '../llm/**', '**/llm/**'],
                message: 'Policy engine must not import from LLM modules. The Prime Invariant strictly forbids model dependencies in the policy engine.',
              },
              {
                group: ['@/lib/paypal/**', '../paypal/**', '**/paypal/**'],
                message: 'Policy engine must not import from PayPal modules. The policy engine is isolated from payment gateways.',
              },
              {
                group: ['@/lib/agent/**', '../agent/**', '**/agent/**'],
                message: 'Policy engine must not import from agent execution loop modules.',
              },
            ],
          },
        ],
      },
    },
  ],
};
