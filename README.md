# Stone product list

This is an API where users log in with a JWT and read a paginated, rate-limited product list. It is a take-home challenge for Stone.

The API is NestJS 11 on Node.js 22 and TypeScript. It stores users and products in DynamoDB and keeps the rate limit counters in Redis. Terraform describes how it runs on AWS: a Lambda behind API Gateway and WAF. A React web client in `front/` logs in and pages through the products.

## Repository layout

| Folder   | What it holds                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `back/`  | The API. Read [back/README.md](back/README.md) for the setup, the scripts, and the rate limits.       |
| `infra/` | The Terraform for AWS. Read [infra/README.md](infra/README.md) for what it creates and how to deploy. |
| `docs/`  | The [OpenAPI spec](docs/openapi.json) and the [request flow diagrams](docs/flows.md).                 |
| `front/` | The web client. Read [front/README.md](front/README.md) for the setup and the settings.               |

Each project has its own `package.json`. Run npm commands inside the project folder, not at the repo root.

## Run the API locally

You need Node.js 22, npm 10 or later, and Docker with Docker Compose. You don't need an AWS account. Docker Compose runs DynamoDB Local and Redis.

Run these commands in `back/`:

1. Install the dependencies and create your `.env` file:

   ```bash
   npm install
   cp .env.example .env
   ```

2. Set `JWT_SECRET` in `.env` to at least 32 random characters. To generate one, run `openssl rand -base64 48`.

3. Start DynamoDB Local and Redis, then create the tables and the demo data:

   ```bash
   docker compose up -d
   npm run db:create-tables
   npm run db:seed
   ```

4. Start the API:

   ```bash
   npm run start:dev
   ```

The API listens on `http://localhost:3000`. The Swagger UI is at `http://localhost:3000/docs`. If port 6379 is in use, [back/README.md](back/README.md) explains how to move Redis to another port.

## Run the web app

With the API running, run these commands in `front/`:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The login page shows the demo email and password with copy buttons. The API allows this origin through `CORS_ORIGINS` in `back/.env`.

## Try the API

1. Log in as the demo user. The password is `SEED_USER_PASSWORD` in `.env`, `demo-password` by default:

   ```bash
   curl -s -X POST http://localhost:3000/auth/login \
   	-H 'Content-Type: application/json' \
   	-d '{"email":"demo@example.com","password":"demo-password"}'
   ```

   The response has an `accessToken` that is valid for 15 minutes.

2. List the first page of products with the token:

   ```bash
   curl -s 'http://localhost:3000/products?limit=5' \
   	-H 'Authorization: Bearer <accessToken>'
   ```

   The response has `items`, newest first, and a `nextCursor`.

3. To read the next page, send the `nextCursor` value as `cursor`:

   ```bash
   curl -s 'http://localhost:3000/products?limit=5&cursor=<nextCursor>' \
   	-H 'Authorization: Bearer <accessToken>'
   ```

   On the last page, `nextCursor` is `null`.

## Routes

| Route              | Token | What it does                                                           |
| ------------------ | ----- | ---------------------------------------------------------------------- |
| `GET /health`      | No    | Reports that the API is running. It has no rate limit.                 |
| `POST /auth/login` | No    | Checks an email and password, and returns an access token.             |
| `GET /auth/me`     | Yes   | Returns the user that the token belongs to.                            |
| `GET /products`    | Yes   | Returns a page of products. `limit` is 20 by default, and 100 at most. |

Each error response has a `statusCode`, a `code`, and a `message`. Clients branch on `code`, such as `AUTH_INVALID_TOKEN` or `RATE_LIMIT_EXCEEDED`. The full contract is in [docs/openapi.json](docs/openapi.json).

## Rate limits

- One user can send 60 requests a minute, across all routes.
- One IP can send 5 logins a minute, whether they succeed or fail.

A request over a limit gets a 429 and a `Retry-After` header. On AWS, WAF and API Gateway add limits in front of the API. [docs/flows.md](docs/flows.md) shows each layer.

## Tests and checks

Run the full check list in `back/`. The end-to-end tests need `docker compose up -d` first:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:cov && npm run test:e2e && npm run build
```

The web client has no tests. Run its checks in `front/`:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run build
```

GitHub Actions runs one workflow for each project, on each pull request that changes it:

- The back-end workflow runs the back-end checks. It also fails when `docs/openapi.json` does not match the code.
- The front-end workflow runs the front-end checks.
- The infra workflow runs `terraform fmt` and `terraform validate`.

The git hooks in `back/.husky` check both `back/` and `front/` on commit and on push.

## Deploy to AWS

[infra/README.md](infra/README.md) has the steps: build the Lambda zip, then run `terraform plan` and `terraform apply` in `infra/`. It also explains why the Terraform is checked with `terraform validate` and not applied to a local emulator.

## License

[MIT](LICENSE)
