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
- Rate limiting has two layers. In AWS, API Gateway and WAF set a global cap and a per-IP cap on login. In the app, `@nestjs/throttler` sets a per-user cap from the JWT. Its counters live in Redis, so all instances share them.
- The API runs on Lambda behind an API Gateway REST API. A REST API is used because WAF does not attach to an HTTP API. In AWS, the Lambda runs in a VPC to reach ElastiCache, and the JWT secret comes from SSM.
- The project runs locally with no AWS account. Docker Compose runs the local services: DynamoDB Local, and Redis once the rate-limit phase adds it. The Terraform phase applies Terraform to a local AWS emulator. Pick the emulator with the user in that phase.

## Gotchas

- The git root is the parent folder. Husky is installed with `cd .. && husky back/.husky`, and each hook starts with `cd back`.
- `tsconfig.build.json` includes only `src/`. A root-level `.ts` file in the build moves `main.js` to `dist/src/` and breaks `start:prod`.
- The e2e specs build the app from `AppModule` and do not reach DynamoDB. Start DynamoDB Local before you add an e2e spec that reads or writes data.
- Jest gives each test file its own copy of `process.env`. Code that writes env variables takes the target object as a parameter, as `loadEnvFile` does, so specs can pass a plain object.
- Add each new env variable in three places: `src/config/env.schema.ts`, `AppConfig`, and `.env.example`.
- Table key schemas live in `src/database/tables.ts`. Change a key there, and Terraform must match it.
- When `DYNAMODB_LOCAL_ENDPOINT` is set, the client sends placeholder credentials, because DynamoDB Local accepts any. Without it, the client uses the default AWS credential chain.
- The app is on NestJS 11, which is CommonJS. Version 12 of `@nestjs/*` packages, such as `@nestjs/jwt` 12, is ESM-only and fails to load in Jest. Install the version that matches Nest 11.
- `JWT_SECRET` has no default. `test/setup-env.ts` sets it for the e2e specs, and unit specs build their config with `buildTestConfig` from `src/config/testing/`.
- `jest.config.ts` runs ts-jest with `isolatedModules: false`. With it on, the decorator metadata for each injected constructor parameter compiles to a branch that never runs, and branch coverage drops under the threshold.
- A Docker build must install with `npm ci --ignore-scripts`. The `prepare` script needs `.git` and Husky.
