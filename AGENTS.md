# Repository Guidelines

## Project Structure

- `mobile/` contains the Expo/React Native client, shared mobile types, and Node tests.
- `backend/` contains the Go module, domain rules, contract validation, and seed checks.
- `data/` contains API examples and Techno Edge stall JSON files.
- `infra/` contains Terraform for Cognito, API Gateway, Lambda, DynamoDB, IAM, and CloudWatch.
- `docs/` holds product decisions and the MVP specification; `tasks/` holds the dependency-ordered implementation plan.

Keep nutrition contracts aligned across `backend/internal/contracts`, `mobile/src/types`, and `data/examples`.

## Build, Test, and Development Commands

```text
npm run mobile:dev       # Run the current mobile scaffold
npm run mobile:test      # Run mobile Node tests
npm run mobile:lint      # Syntax-check mobile JavaScript
go -C backend test ./... # Run backend tests
terraform -chdir=infra fmt
terraform -chdir=infra validate
terraform -chdir=infra plan
```

Terraform requires valid AWS credentials. Review the plan before any apply; do not apply infrastructure automatically.

## Coding Style & Naming

Use `gofmt` and standard Go naming. Use two-space TypeScript/JSON indentation, `camelCase` API fields, and `PascalCase` types/components. Run `terraform fmt` for HCL. Prefer small explicit modules and existing dependencies over new abstractions.

## Testing Guidelines

Backend tests use Go's standard `testing` package and live beside packages as `*_test.go`. Mobile tests use Node's built-in test runner under `mobile/test/` as `*.test.js`. Add tests for validation, serving scaling, goals, ranking, and any regression. No coverage threshold is configured yet.

## Commit & Pull Requests

Use conventional, imperative commit subjects such as `feat(domain): add goal rules` or `docs: mark AWS baseline complete`. Keep commits focused, run relevant checks, then push the completed task branch to GitHub. PRs should summarize behavior, list verification commands, link related tasks, and include a reviewed Terraform plan for infrastructure changes. Never include credentials, tokens, `.env` files, Terraform state, or generated build output.

## Architecture & Security

The MVP is mobile-only, Techno Edge-focused, and AWS-backed. Nutrition and allergen facts must come from stored data; AI may interpret requests but must not invent meal facts. Use least-privilege AWS identities and preserve source, confidence, and incomplete-allergen metadata.
