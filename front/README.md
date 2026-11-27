# Product web

This is the web client for the Product API. It is a React app in TypeScript, built with Vite.

## Requirements

- Node.js 22. Run `nvm use` in this folder to switch to the version in `.nvmrc`.
- npm 10 or later.

## Run the app

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

Vite prints the local URL, `http://localhost:5173` by default.

## Scripts

| Script                 | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Starts the dev server and reloads on each change. |
| `npm run build`        | Type checks the app and builds it to `dist/`.     |
| `npm run preview`      | Serves the `dist/` build to check it locally.     |
| `npm run typecheck`    | Runs the TypeScript compiler without output.      |
| `npm run lint`         | Runs ESLint and reports problems.                 |
| `npm run lint:fix`     | Runs ESLint and fixes what it can.                |
| `npm run format`       | Formats all files with Prettier.                  |
| `npm run format:check` | Checks that all files match the Prettier format.  |

## Git hooks

The hooks live in `back/.husky`, and `npm install` in `back/` sets them up. They also check this folder, and they fail when `front/node_modules` is missing:

- `pre-commit` runs ESLint and Prettier on the staged files in `front/`. When a staged file is a `.ts` or `.tsx` file, it also runs `tsc -b`.
- `pre-push` runs `npm run lint` and `npm run build`.
