/**
 * Checks staged files without changing them. A failed check stops the commit.
 * Run `npm run lint:fix` or `npm run format` to fix the reported files.
 *
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.ts': ['eslint --max-warnings=0', 'prettier --check', () => 'tsc --noEmit'],
  '*.{js,mjs,json,md,yml,yaml}': 'prettier --check',
};
