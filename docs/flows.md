# Request flows

These diagrams show how the Product API handles a login and a product list request, and how it runs on AWS. The routes and their responses are in [openapi.json](openapi.json).

## Every request passes the same checks

The app runs the same steps, in the same order, for every route:

1. `JwtAuthGuard` checks the bearer token. A route marked `@Public()`, such as `/auth/login`, skips the check.
2. `RateLimitGuard` counts the request in Redis. It counts by user when the request has a valid token, and by IP when it has none. `/health` is not counted.
3. The `ValidationPipe` checks the body and the query.
4. The controller calls the service.
5. `AllExceptionsFilter` turns any error into a JSON body with a `statusCode`, a `code`, and a `message`.

A request with a missing or bad token gets a 401 at step 1, so it never uses up a rate limit budget.

## Log in

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Guards as JwtAuthGuard and RateLimitGuard
    participant Redis
    participant Auth as AuthService
    participant Users as UsersService
    participant DynamoDB as DynamoDB users table

    Client->>Guards: POST /auth/login with email and password
    Note over Guards: The route is public, so no token is needed
    Guards->>Redis: Count the request for the client IP
    alt The IP is over its limit
        Guards-->>Client: 429 RATE_LIMIT_EXCEEDED with Retry-After
    end
    Guards->>Auth: login(email, password)
    Auth->>Users: verifyCredentials(email, password)
    Users->>DynamoDB: Get the user by email
    alt The email is unknown
        Users->>Users: Verify a dummy argon2 hash, so the response takes as long as a known email
    else The email is known
        Users->>Users: Verify the password against the stored argon2 hash
    end
    alt The password does not match
        Auth-->>Client: 401 AUTH_INVALID_CREDENTIALS
    else The password matches
        Auth->>Auth: Sign an HS256 JWT for the user ID, valid for 15 minutes
        Auth-->>Client: 200 with accessToken, tokenType, and expiresIn
    end
```

A failed login counts against the IP budget like a successful one. The default budget is 5 logins a minute for each IP.

## List products

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Jwt as JwtAuthGuard
    participant Limit as RateLimitGuard
    participant Redis
    participant Products as ProductsService
    participant DynamoDB as DynamoDB products table

    Client->>Jwt: GET /products?limit=20&cursor=... with a bearer token
    alt The token is missing, expired, or not valid
        Jwt-->>Client: 401 AUTH_INVALID_TOKEN
    end
    Jwt->>Limit: The request now carries the user ID
    Limit->>Redis: Count the request for the user
    alt The user is over its limit
        Limit-->>Client: 429 RATE_LIMIT_EXCEEDED with Retry-After
    end
    Limit->>Products: list(limit, cursor)
    alt The cursor does not decode
        Products-->>Client: 400 PRODUCTS_INVALID_CURSOR
    end
    Products->>DynamoDB: Query the byCreatedAt index, newest first, limit + 1 items, from the cursor position
    DynamoDB-->>Products: Up to limit + 1 products
    Products->>Products: Keep limit products, and encode the last one as nextCursor if more exist
    Products-->>Client: 200 with items and nextCursor
```

To read the next page, the client sends `nextCursor` back as `cursor`. The last page has a `nextCursor` of `null`. Each user has one budget for all routes, 60 requests a minute by default.

## AWS architecture

```mermaid
flowchart LR
    Client([Client])

    subgraph Edge[AWS public endpoints]
        WAF[WAF web ACL<br/>login rate per IP<br/>AWS common rule set]
        APIGW[API Gateway REST API<br/>stage v1, throttling cap]
    end

    subgraph VPC[VPC with private subnets in 2 zones, no internet access]
        Lambda[Lambda<br/>Node 22, arm64]
        Redis[(ElastiCache Redis<br/>TLS)]
        SSMEndpoint[SSM interface endpoint]
        DynamoEndpoint[DynamoDB gateway endpoint]
    end

    DynamoDB[(DynamoDB<br/>users and products tables)]
    SSM[SSM Parameter Store<br/>JWT secret]
    Logs[CloudWatch Logs]

    Client -->|HTTPS| WAF
    WAF --> APIGW
    APIGW -->|AWS_PROXY| Lambda
    Lambda -->|rate limit counters| Redis
    Lambda -->|JWT secret at cold start| SSMEndpoint
    SSMEndpoint --> SSM
    Lambda --> DynamoEndpoint
    DynamoEndpoint --> DynamoDB
    Lambda --> Logs
```

A request passes three rate limits on AWS:

1. WAF blocks an IP that sends more than 100 logins in 5 minutes.
2. API Gateway accepts up to 100 requests a second for the whole API.
3. The app limits each user and each IP in Redis.

The Lambda reaches DynamoDB and SSM through VPC endpoints, because its subnets have no route to the internet. The Terraform for these resources is in [infra/](../infra/README.md).
