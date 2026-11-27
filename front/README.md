# Product web

This is the web client for the Product API. It is a React app in TypeScript, built with Vite, MUI, React Router, and TanStack Query.

## What it does

- **Login page.** You log in with an email and a password. The page checks the fields before it calls the API, and it shows a message for wrong credentials. After too many attempts, it disables the form until the API's `Retry-After` wait ends. The footer shows the demo account with copy buttons.
- **Products page.** It lists the products, newest first, 12 at a time. **Load more** fetches the next page with the cursor that the API returns. The header shows your name and a **Log out** button.
- **Session.** The app keeps the access token and its expiry time in `sessionStorage`, so a reload keeps you logged in until you close the tab. It logs you out when the token expires or when the API answers with a 401.
- **Footer.** Every page links to the API reference, the OpenAPI spec, the request flows, and the source code.

## Requirements

- Node.js 22. Run `nvm use` in this folder to switch to the version in `.nvmrc`.
- npm 10 or later.

## Run the app

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the API in `back/`. Its `CORS_ORIGINS` setting must list this app's origin. `back/.env.example` lists `http://localhost:5173`.

3. Start the dev server:

   ```bash
   npm run dev
   ```

Vite prints the local URL, `http://localhost:5173` by default.

## Settings

The defaults work with the local API and the seed data. To change one, copy `.env.example` to `.env` and edit it. Vite reads the values when the dev server starts or when you build.

| Variable             | Default                 | What it sets                                              |
| -------------------- | ----------------------- | --------------------------------------------------------- |
| `VITE_API_URL`       | `http://localhost:3000` | URL of the Product API.                                   |
| `VITE_DEMO_EMAIL`    | `demo@example.com`      | Demo email that the login page shows.                     |
| `VITE_DEMO_PASSWORD` | `demo-password`         | Demo password. Match `SEED_USER_PASSWORD` in `back/.env`. |

To use the deployed API, build with its stage URL, and add the app's origin to the Terraform `cors_origins` variable:

```bash
VITE_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/v1 npm run build
```

## Code layout

| Folder          | What it holds                                                        |
| --------------- | -------------------------------------------------------------------- |
| `src/api/`      | The fetch client, the zod schemas for each response, and `ApiError`. |
| `src/session/`  | The token session, the route guard, and the logout hook.             |
| `src/app/`      | The app shell: theme, routes, and the TanStack Query client.         |
| `src/layout/`   | The page layout, the footer, and the copy button.                    |
| `src/login/`    | The login page, the password field, and the demo account.            |
| `src/products/` | The products page, its data hooks, and the product card.             |

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
