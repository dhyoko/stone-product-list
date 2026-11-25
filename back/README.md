# Product API

This is the back-end for the product listing challenge. It is a NestJS 11 API in TypeScript. Users log in to get a JWT, and they use the JWT to read a paginated product list.

## Requirements

- Node.js 22. Run `nvm use` in this folder to switch to the version in `.nvmrc`.
- npm 10 or later.

## Run the API

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the API in watch mode:

   ```bash
   npm run start:dev
   ```

The API listens on port 3000. Set `PORT` to use another port.

## Scripts

| Script                 | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `npm run build`        | Compiles `src/` to `dist/`.                         |
| `npm run start:dev`    | Starts the API and restarts it when a file changes. |
| `npm run start:prod`   | Starts the compiled API from `dist/`.               |
| `npm run typecheck`    | Runs the TypeScript compiler without output.        |
| `npm run lint`         | Runs ESLint and reports problems.                   |
| `npm run lint:fix`     | Runs ESLint and fixes what it can.                  |
| `npm run format`       | Formats all files with Prettier.                    |
| `npm run format:check` | Checks that all files match the Prettier format.    |
| `npm test`             | Runs the unit tests.                                |
| `npm run test:cov`     | Runs the unit tests with a coverage report.         |
| `npm run test:e2e`     | Runs the end-to-end tests in `test/`.               |

## Git hooks

`npm install` sets up the hooks with Husky. The hooks check files and never change them.

- `pre-commit` runs ESLint and Prettier on the staged files in `back/`. When a staged file is a `.ts` file, it also runs `tsc --noEmit` on the whole project.
- `pre-push` runs `npm run test:cov`. The push fails when a test fails or coverage is below the threshold.

When a hook fails, run `npm run lint:fix` or `npm run format`, stage the changes, and commit again.

## Code rules

Read the [back-end styleguide](docs/styleguide.md) before you change code.
