# Product API

A NestJS 11 API in TypeScript, running on Node 22. The scripts are in `package.json`, and setup steps are in `README.md`.

## Code rules

Before you write or change code in `src/` or `test/`, read `docs/styleguide.md`. It sets the layers, the error format, the validation approach, and the test conventions.

## Checks

A task is done when all of these commands pass in `back/`:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:cov && npm run test:e2e && npm run build
```

The git hooks run part of this list. Run the full list yourself before you report a task as done.

## Decisions

These choices are agreed with the user. Ask before you change one.

- npm is the package manager.
- Request DTOs use `class-validator`, so `@nestjs/swagger` can build the OpenAPI spec from them. Environment variables are parsed with `zod` in `src/config/`.
- DynamoDB stores users and products. Repositories call the AWS SDK Document Client directly, with no ORM.
- The `users` table is keyed by `email`. The products list reads the `byCreatedAt` index, which has a fixed `listKey` partition and a `createdAtId` sort key.
- A seed script creates the users. The API has no sign-up route.
- Passwords are hashed with argon2.
- Login returns an HS256 access token that expires after 15 minutes. The API issues no refresh token.
- Pagination uses an opaque base64url cursor built from the DynamoDB `LastEvaluatedKey`, not page numbers. The API returns a 400 for a cursor that does not decode. The page size is 20 by default and 100 at most.
- Rate limiting has two layers. In AWS, API Gateway and WAF set a global cap and a per-IP cap on login. In the app, `@nestjs/throttler` sets one cap per user from the JWT, for all routes together. A request with no user, such as a login, counts against a lower cap per IP. `/health` has no cap. The counters live in Redis, so all instances share them.
- The API runs on Lambda behind an API Gateway REST API. A REST API is used because WAF does not attach to an HTTP API. In AWS, the Lambda runs in a VPC to reach ElastiCache, and the JWT secret comes from SSM.
- The front-end calls the API directly, so the API turns on CORS for the origins in `CORS_ORIGINS`. It is off when the list is empty. In AWS, Terraform sets the list from `var.cors_origins`.
- The project runs locally with no AWS account. Docker Compose runs the local services: DynamoDB Local and Redis. Terraform in `infra/` is checked with `terraform validate` only. No free emulator can apply it, as `infra/README.md` explains.

## Gotchas

- The git root is the parent folder. Husky is installed with `cd .. && husky back/.husky`, and each hook starts with `cd back`.
- `tsconfig.build.json` includes only `src/`. A root-level `.ts` file in the build moves `main.js` to `dist/src/` and breaks `start:prod`.
- The e2e specs need DynamoDB Local and Redis. Start them with `docker compose up -d` before `npm run test:e2e`. `test/setup-env.ts` gives each run its own tables, and the specs delete them at the end, so a run never touches the tables from `.env`.
- `npm run db:create-tables` skips a table that exists, so it does not add a new index to an old table. After you change a table in `src/database/tables.ts`, delete the local data with `docker compose down -v` and create the tables again.
- Jest gives each test file its own copy of `process.env`. Code that writes env variables takes the target object as a parameter, as `loadEnvFile` does, so specs can pass a plain object.
- The app connects to Redis at startup and fails to start when Redis is down.
- Every Redis key starts with `REDIS_KEY_PREFIX`. `test/setup-env.ts` gives each e2e spec file its own prefix and raises the rate limits, so the specs do not block each other or the dev server. A spec that tests the limits sets its own `RATE_LIMIT_*` values before it builds the app, as `test/rate-limit.e2e-spec.ts` does.
- Add each new env variable in three places: `src/config/env.schema.ts`, `AppConfig`, and `.env.example`.
- Table key schemas live in `src/database/tables.ts`. Change a key there, and `infra/dynamodb.tf` must match it.
- When `DYNAMODB_LOCAL_ENDPOINT` is set, the client sends placeholder credentials, because DynamoDB Local accepts any. Without it, the client uses the default AWS credential chain.
- The app is on NestJS 11, which is CommonJS. Version 12 of `@nestjs/*` packages, such as `@nestjs/jwt` 12, is ESM-only and fails to load in Jest. Install the version that matches Nest 11.
- `JWT_SECRET` has no default. `test/setup-env.ts` sets it for the e2e specs, and unit specs build their config with `buildTestConfig` from `src/config/testing/`.
- `jest.config.ts` runs ts-jest with `isolatedModules: false`. With it on, the decorator metadata for each injected constructor parameter compiles to a branch that never runs, and branch coverage drops under the threshold.
- `src/lambda.ts` is the Lambda entry point. It reads `JWT_SECRET` from the SSM parameter named in `JWT_SECRET_SSM_PARAMETER` when `JWT_SECRET` is not set.
- Do not set `trust proxy`. On Lambda, serverless-express sets `req.ip` from the API Gateway `sourceIp`. With `trust proxy`, `req.ip` comes from `X-Forwarded-For`, which a client can fake.
- `@codegenie/serverless-express` 5 needs Node 24. Stay on 4.x while the project runs on Node 22.
- `docs/openapi.json` at the repo root is generated. After you change a route or a DTO, run `npm run openapi:export` and commit the file. CI fails when the file does not match the code.
- The export builds the app in Nest preview mode, which creates no providers, so it needs no Redis and no `JWT_SECRET`. Do not call `app.close()` on a preview app. The shutdown hooks run on providers that were never created.
- A Docker build must install with `npm ci --ignore-scripts`. The `prepare` script needs `.git` and Husky.
