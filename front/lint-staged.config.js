/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx}': ['eslint --max-warnings=0', 'prettier --check', () => 'tsc -b'],
  '*.{js,json,md,css,html}': 'prettier --check',
};
