# Stone product list

This repo is a take-home challenge for Stone. The goal is an API where users log in with a JWT and read a paginated, rate-limited product list.

## Challenge requirements

- Node.js and TypeScript.
- JWT authentication on the protected routes.
- DynamoDB for storage.
- Terraform for the AWS infrastructure.
- Unit tests with broad coverage.
- Project docs: an OpenAPI spec and flow diagrams.
- A front-end that uses the API.

The reviewers grade code organization, market-standard patterns, test coverage, docs, cloud use, and structured AI use.

## Layout

- `back/` is the API. It is a standalone npm project with its own `CLAUDE.md`.
- `front/` is the front-end. It is a separate project, started after the back-end is done.

The repo root has no `package.json`. Run npm commands inside the project folder.

## Workflow

Work in small tasks. One task is one commit.

1. Agree on the task list with the user before writing code.
2. Do one task, then run the project's checks.
3. Stop and show the user the result. Commit only after the user approves.
4. Write the commit message in Conventional Commits format with the project scope, such as `feat(back): add login endpoint`.

Group the commits of one phase on a branch, such as `chore/project-setup`, and merge the branch into `master` through a pull request.
