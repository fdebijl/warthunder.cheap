import config from '@fdebijl/eslint-config';

export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
    },
  },
];
