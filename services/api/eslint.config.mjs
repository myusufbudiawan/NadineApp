import parser from '@typescript-eslint/parser';

export default [
  { ignores: ['node_modules/', 'dist/', 'coverage/'] },
  { files: ['**/*.ts'], languageOptions: { parser }, rules: {} },
];
