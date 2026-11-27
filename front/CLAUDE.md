# Product web

A React 19 app in TypeScript, built with Vite, that uses the Product API in `back/`. The scripts are in `package.json`, and setup steps are in `README.md`.

## Checks

A task is done when all of these commands pass in `front/`:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run build
```

## Decisions

These choices are agreed with the user. Ask before you change one.

- npm is the package manager.
- The UI uses MUI. React Router handles the pages, and TanStack Query fetches and caches the API data.
- The app has no tests. It only consumes the API, and the API has the test suite.
- In development, Vite proxies `/api` to the local API, so the API needs no CORS. The app is not hosted on AWS.
- ESLint runs `typescript-eslint` with `strictTypeChecked`, the same as `back/`, plus the React Hooks rules.

## Gotchas

- TypeScript stays on 5.9. The Vite template installs TypeScript 7, and `typescript-eslint` does not support it yet.
- `tsc -b` checks both `tsconfig.app.json` for `src/` and `tsconfig.node.json` for `vite.config.ts`. A setting for app code goes in `tsconfig.app.json`.
- The git hooks live in `back/.husky` and check both projects. They fail when `front/node_modules` is missing.
