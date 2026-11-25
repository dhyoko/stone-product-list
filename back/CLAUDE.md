# Product API

A NestJS 11 API in TypeScript, running on Node 22. The scripts are in `package.json`, and setup steps are in `README.md`.

## Code rules

Before you write or change code in `src/` or `test/`, read `docs/styleguide.md`. It sets the layers, the error format, the validation approach, and the test conventions.

## Checks

A task is done when all of these commands pass in `back/`:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:cov && npm run build
```

The git hooks run part of this list. Run the full list yourself before you report a task as done.

## Decisions

These choices are agreed with the user. Ask before you change one.

- npm is the package manager.
- Request DTOs use `class-validator`, so `@nestjs/swagger` can build the OpenAPI spec from them. Environment variables are parsed with `zod` in `src/config/`.
- Passwords are hashed with argon2.
- Pagination uses a cursor built from the DynamoDB `LastEvaluatedKey`, not page numbers.
- Rate limiting has two layers. API Gateway and WAF set a global cap and a per-IP cap on login. `@nestjs/throttler` sets a per-user cap from the JWT, with the counters stored in DynamoDB so all instances share them.
- The hosting target (Lambda or ECS) is not decided yet. Decide it with the user in the Terraform task.

## Gotchas

- The git root is the parent folder. Husky is installed with `cd .. && husky back/.husky`, and each hook starts with `cd back`.
- `tsconfig.build.json` includes only `src/`. A root-level `.ts` file in the build moves `main.js` to `dist/src/` and breaks `start:prod`.
- `test/jest-e2e.config.ts` sets `passWithNoTests` because no e2e specs exist yet. Remove it when you add the first e2e spec.
- Jest gives each test file its own copy of `process.env`. Code that writes env variables takes the target object as a parameter, as `loadEnvFile` does, so specs can pass a plain object.
- Add each new env variable in three places: `src/config/env.schema.ts`, `AppConfig`, and `.env.example`.
- Table key schemas live in `src/database/tables.ts`. Change a key there, and Terraform must match it.
- When `DYNAMODB_LOCAL_ENDPOINT` is set, the client sends placeholder credentials, because DynamoDB Local accepts any. Without it, the client uses the default AWS credential chain.
- A Docker build must install with `npm ci --ignore-scripts`. The `prepare` script needs `.git` and Husky.
