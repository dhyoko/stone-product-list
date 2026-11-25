# Back-end styleguide

This guide sets the rules for code in `back/`. The back-end is a NestJS 11 API in TypeScript, with DynamoDB for storage.

ESLint and Prettier enforce formatting and most syntax rules. This guide covers the decisions that a linter cannot check. When a rule here conflicts with a lint rule, fix the lint config, not the code.

## Project layout

Group code by feature. Each feature is one Nest module with its own folder.

```text
back/
  src/
    main.ts                  # bootstrap only
    app.module.ts            # imports feature modules
    config/                  # env schema and typed config
    common/                  # errors, filters, guards, decorators shared by features
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
      *.spec.ts
    users/
      users.module.ts
      users.service.ts
      user.ts                # domain type
      users.repository.ts    # abstract class, the DI token
      dynamo-users.repository.ts
      *.spec.ts
    products/
      ...
  test/                      # e2e specs only
  docs/
```

- Put a file in `common/` only when two or more features use it.
- Keep `main.ts` to bootstrap: create the app, set global options, listen.
- Do not create barrel `index.ts` files. Import from the file that owns the symbol.

## Naming

- Name files in kebab-case with the Nest suffix: `products.controller.ts`, `list-products.dto.ts`.
- Name classes in PascalCase with the same suffix: `ProductsController`, `ListProductsDto`.
- Prefix an infrastructure implementation with its technology: `DynamoProductsRepository` implements `ProductsRepository`.
- Name booleans as questions: `isActive`, `hasNextPage`.
- Use English for code, comments, and docs.

## TypeScript

- Turn on `strict`. Never turn off a strict flag to make code compile.
- Do not use `any`. Type external data as `unknown` and parse it.
- Do not use `as` casts, except after a check that proves the type. Prefer `satisfies` for literal objects.
- Use a type guard named `isX` or `hasX` only when it checks every property it claims.
- Brand IDs that share a primitive type: `type UserId = string & { readonly __brand: 'UserId' }`. Create a branded value only in one parse function.
- Model variants as discriminated unions with a `kind` field. End a `switch` over a union with `const _exhaustive: never = value`.
- Pass an object when a function takes more than two arguments.

## Modules and dependency injection

- Export from a module only the providers that other modules use.
- Inject dependencies through the constructor.
- Use an abstract class as the token for a port, such as a repository. An interface leaves no token at runtime.
- Keep providers singletons. Pass per-request values, such as the current user, as arguments.
- Register global guards, filters, and interceptors with `APP_GUARD`, `APP_FILTER`, and `APP_INTERCEPTOR`, so they can use injection.

## Layers

Each request goes through three layers. A layer calls only the layer below it.

1. The controller handles HTTP. It validates input, calls one service method, and maps the result to a response DTO. It has no business logic.
2. The service holds the use case. It works with domain types and repository ports. It does not import `@aws-sdk`, `express`, or a DTO class.
3. The repository reads and writes DynamoDB. It maps items to domain types. Only this layer imports `@aws-sdk`.

Return domain types from services, not DynamoDB items. Never return a password hash outside the users module.

## Input validation

- Validate request input with DTO classes and `class-validator`.
- Run the global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- Write DTOs as classes and import them as values. A type-only import leaves no metadata to validate.
- Add `@ApiProperty` to every DTO field so the OpenAPI document matches the code.
- Trust typed values inside the service. Do not validate the same input twice.

## Configuration

- Read environment variables only in `src/config/`. Parse them with a `zod` schema.
- Fail at startup when a required variable is missing or invalid.
- Read config in other code through the typed config provider, never through `process.env`.
- Keep secrets out of the repo. List every variable with a safe example value in `.env.example`.

## Errors

- Throw a domain error class with a stable `code`, such as `InvalidCredentialsError` with code `AUTH_INVALID_CREDENTIALS`.
- Map domain errors to HTTP responses in one global exception filter. Services do not throw `HttpException`.
- Return this body for every error:

  ```json
  { "statusCode": 401, "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password" }
  ```

- Attach the original error as `cause`. Log the cause, and never send it to the client.
- Return the same error for an unknown email and a wrong password, so a client cannot find out which emails exist.

## Authentication

- Treat every route as protected. Mark public routes with a `@Public()` decorator that the global JWT guard reads.
- Hash passwords with argon2. Never log or return a password or a hash.
- Put only the user ID and the token expiry in the JWT payload.

## Logging

- Create one `Logger` per class: `private readonly logger = new Logger(ProductsService.name)`.
- Do not use `console.log`.
- Log IDs, not personal data. Never log tokens, passwords, or request bodies from auth routes.

## Tests

- Write unit specs as `*.spec.ts` next to the file they test. Put e2e specs in `test/`.
- Build the unit under test with `Test.createTestingModule`, and mock its collaborators with `useValue`.
- Do not call AWS in a unit spec. Mock the repository port in service specs. Mock the DynamoDB client in repository specs.
- Assert what a caller sees: the return value, the error class and code, and the collaborator calls that matter.
- Test every error path, not only the success path.
- Name each test by the behavior: `it('returns the next cursor when more items exist')`.
- Keep coverage at or above the threshold in `jest.config.ts`. Jest fails the run below it.

## Commits

- Use Conventional Commits with the `back` scope: `feat(back): add product listing endpoint`.
- Keep each commit to one task. Each commit must pass lint, type check, and tests.
