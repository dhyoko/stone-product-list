# Product API infrastructure

This folder holds the Terraform for the Product API on AWS. It is one root module with one file for each area.

## What it creates

| File                 | Resources                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamodb.tf`        | The `users` and `products` tables, with the same keys and indexes as `back/src/database/tables.ts`. Point-in-time recovery is on.           |
| `ssm.tf`             | A random 48-character JWT secret, stored as an SSM `SecureString`.                                                                          |
| `network.tf`         | A VPC with two private subnets, a gateway endpoint for DynamoDB, and an interface endpoint for SSM. The VPC has no internet or NAT gateway. |
| `security-groups.tf` | Security groups that let the Lambda reach Redis, DynamoDB, and SSM, and nothing else.                                                       |
| `elasticache.tf`     | A one-node Redis 7.1 replication group for the rate limit counters, with TLS and encryption at rest.                                        |
| `iam.tf`             | The Lambda role. It can read and write the two tables, read the JWT secret, and manage its network interfaces in the VPC.                   |
| `lambda.tf`          | The API Lambda on Node 22 and arm64, in the private subnets, and its log group.                                                             |
| `api-gateway.tf`     | A regional REST API that sends every path to the Lambda, a `v1` stage, and a throttling cap for the whole API.                              |
| `waf.tf`             | A WAF web ACL on the stage. It blocks an IP that sends too many logins in 5 minutes, and it runs the AWS common rule set.                   |

The app limits requests per user and per IP in Redis. API Gateway and WAF add limits in front of the app, so a flood never reaches the Lambda.

## Deploy to AWS

You need Terraform 1.9 or later, Node 22, and AWS credentials for the target account.

1. Build the Lambda zip in `back/`:

   ```bash
   npm run package:lambda
   ```

2. Initialize Terraform in `infra/`:

   ```bash
   terraform init
   ```

3. Review the plan, then apply it:

   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

4. Read the API URL from the outputs:

   ```bash
   terraform output api_url
   ```

The tables start empty. To create the demo user and products, run `npm run db:seed` in `back/` with `USERS_TABLE`, `PRODUCTS_TABLE`, and `AWS_REGION` set to the deployed values, and with `DYNAMODB_LOCAL_ENDPOINT` unset.

## Variables

| Variable              | Default                    | What it sets                                                    |
| --------------------- | -------------------------- | --------------------------------------------------------------- |
| `project`             | `product-api`              | Prefix of every resource name.                                  |
| `environment`         | `dev`                      | `dev`, `staging`, or `prod`. It is part of every resource name. |
| `aws_region`          | `us-east-1`                | Region of every resource.                                       |
| `deletion_protection` | `true`                     | Deletion protection on the DynamoDB tables.                     |
| `vpc_cidr`            | `10.20.0.0/16`             | VPC range. Each private subnet takes a `/24` from it.           |
| `redis_node_type`     | `cache.t4g.micro`          | ElastiCache node type.                                          |
| `lambda_zip_path`     | `../back/build/lambda.zip` | Zip that `npm run package:lambda` builds.                       |
| `lambda_memory_mb`    | `1024`                     | Lambda memory. Lambda gives more CPU with more memory.          |
| `log_retention_days`  | `14`                       | Days that CloudWatch keeps the Lambda logs.                     |
| `api_rate_limit`      | `100`                      | Requests per second that API Gateway accepts for the whole API. |
| `api_burst_limit`     | `200`                      | Request burst that API Gateway accepts for the whole API.       |
| `waf_login_limit`     | `100`                      | Logins that one IP can send in 5 minutes before WAF blocks it.  |
| `cors_origins`        | `[]`                       | Browser origins that may call the API. Empty turns CORS off.    |

## Checks

CI runs these commands on every pull request that changes `infra/`:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

`terraform validate` does not need the Lambda zip or AWS credentials.

## Why there is no local apply

The project runs locally with no AWS account, but no free emulator can apply this Terraform:

- Moto does not return a status for a REST API, and AWS provider 6.58 and later waits for one. Moto also does not create the node of a Redis replication group.
- LocalStack needs an account token. Its free plan does not include ElastiCache or WAF, and its ElastiCache has no TLS.

So the Terraform is checked with `terraform validate`, and the app is tested locally with Docker Compose, DynamoDB Local, and Redis.

## Things to know

- Terraform keeps its state in a local `terraform.tfstate` file. For a team, move it to an S3 backend before the first apply.
- The state holds the JWT secret in plain text, because Terraform generates it. Keep the state private.
- A table key or index in `dynamodb.tf` must match `back/src/database/tables.ts`. Change both together.
- The Lambda reads the JWT secret from SSM when it starts, through the SSM endpoint, because the VPC has no internet access.
- The REST API stage logs no access logs. To add them, set up an `aws_api_gateway_account` role for CloudWatch first.
