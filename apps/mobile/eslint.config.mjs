import parser from '@typescript-eslint/parser';

export default [
  { ignores: ['node_modules/', '.expo/', 'dist/', 'coverage/'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {},
  },
];
