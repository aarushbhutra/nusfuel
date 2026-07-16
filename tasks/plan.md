# Implementation Plan: NUSFuel MVP

## Overview

Build a mobile-only Expo app backed by a Railway-hosted Go API and Railway PostgreSQL for Techno Edge meal logging and macro recommendations. The first release proves the core user loop: authenticate, set calorie/protein goals, browse stored Techno Edge meals, adjust servings, log meals, view daily/weekly progress, and get up to three grounded recommendations.

## Architecture Decisions

- Keep the first data source as repository seed data loaded by the service. This avoids building an admin CMS before the app has real users.
- Keep recommendation ranking deterministic in Go. DeepSeek V4 Flash is used only to convert natural-language requests into structured filters; stored menu data remains the source of truth.
- Host one Go API service and one PostgreSQL service on Railway. Use backend-issued JWTs backed by PostgreSQL users; do not add a second auth platform.
- Use DeepSeek V4 Flash through its Anthropic-compatible endpoint at `https://api.deepseek.com/anthropic`. Store `DEEPSEEK_API_KEY` only in Railway variables, set an explicit per-request token cap, and rotate the key outside the repository.
- Treat the existing Cognito, API Gateway, Lambda, DynamoDB, CloudWatch, and Terraform baseline as superseded. Do not apply it; remove it only as part of the Railway migration implementation.
- Do not add Redis, background jobs, social features, or retention mechanics in the MVP. Add them only after measured load or product usage demands them.

## Task List

### Phase 1: Foundation

- [x] Task 1: Create the project command scaffold
- [x] Task 2: Define menu, goal, meal-log, and recommendation contracts
- [x] Task 3: Add Techno Edge seed data format and importer checks
- [x] Task 4: Implement backend domain rules with tests

### Checkpoint: Foundation

- [x] `go test ./...` passes for backend domain code
- [x] `npm run mobile:test` exists, even if only smoke-level tests exist initially
- [x] Seed data validates required nutrition, source, confidence, and allergen fields
- [x] No implementation depends on AI-generated nutrition facts

### Phase 2: Railway Platform Migration and Core User Loop

Status note: completed AWS-specific adapter work remains useful as a behavioral reference, but it does not satisfy the Railway target. Reopened tasks cover only the HTTP, authentication, and persistence migration; completed domain and UI tasks remain in place.

- [ ] Task 5: Replace the AWS baseline with a Railway HTTP API, PostgreSQL schema, and migration path
- [ ] Task 6: Replace Cognito claims with backend JWT authentication and PostgreSQL-backed goal persistence
- [ ] Task 7: Connect mobile onboarding and goal setup to backend JWT authentication
- [ ] Task 8: Rewire menu browse and meal detail API to the Railway HTTP server
- [x] Task 9: Implement mobile menu browse, serving adjustment, and nutrition display
- [ ] Task 10: Replace DynamoDB meal logging with PostgreSQL persistence and preserve progress behavior
- [x] Task 11: Implement mobile meal logging and daily/weekly progress

### Checkpoint: Railway Core User Loop

- [ ] A signed-in user can set a preset or custom goal
- [ ] A signed-in user can browse Techno Edge meals
- [ ] Serving quantity changes recalculate all displayed nutrition fields
- [ ] A signed-in user can log a meal and see updated daily/weekly totals
- [ ] Backend and mobile tests pass against the Railway-compatible API and PostgreSQL integration setup

### Phase 3: Recommendations and Search

- [ ] Task 12: Rewire deterministic recommendations to the Railway API and PostgreSQL-backed logs
- [x] Task 13: Add mobile recommendation cards
- [x] Task 14: Implement DeepSeek V4 Flash natural-language filter extraction
- [ ] Task 15: Add mobile natural-language search

### Checkpoint: Recommendations

- [x] Recommendation endpoint returns up to three stored Techno Edge meals
- [x] Allergen and dietary filters run before ranking
- [x] Optional macro targets affect ranking only if present
- [ ] Natural-language search cannot return meals or facts absent from storage

### Phase 4: Railway Deployment and Release Gate

- [ ] Task 16: Add structured Railway runtime logging and basic operational errors
- [ ] Task 17: Configure Railway deployment, PostgreSQL variables, health check, and DeepSeek credentials
- [ ] Task 18: Add end-to-end smoke check and release checklist

### Checkpoint: Complete

- [ ] `go test ./...` passes
- [ ] `npm run mobile:test` passes
- [ ] `npm run mobile:lint` passes
- [ ] Railway service, variables, and health check are reviewed before deployment
- [ ] Smoke path passes: sign in, set goal, find meal, change servings, log meal, view recommendations
- [ ] All MVP success criteria from `docs/specs/nusfuel-mvp.md` are covered

## Dependency Graph

```text
Contracts and seed data
  -> backend domain tests
  -> backend APIs
  -> mobile API client
  -> mobile screens
  -> smoke path

Railway HTTP API + PostgreSQL migration
  -> JWT-authenticated backend APIs
  -> deployed smoke path

Deterministic recommendation logic
  -> recommendation API
  -> mobile recommendation cards
  -> DeepSeek natural-language filters
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Preset formulas are not yet chosen | Medium | Ship configurable preset constants with conservative placeholders and keep custom goals available |
| Menu/allergen data is incomplete | High | Store confidence/source metadata and show incomplete allergen warnings |
| DeepSeek adds latency or unreliable parsing | Medium | Keep deterministic browse/filter path working without AI |
| Railway migration changes completed AWS-specific adapters | Medium | Keep domain and handler contracts, replace transport/persistence behind existing store interfaces, and re-run integration checks |
| DeepSeek credentials are static | High | Store `DEEPSEEK_API_KEY` only in Railway variables; never expose it to mobile clients |
| Mobile and backend contracts drift | High | Define shared JSON contracts early and test request/response shapes |

## Open Questions

- Exact calorie/protein defaults for cutting, maintenance, and gaining.
- Whether fat/carbohydrate/sugar targets affect recommendation ranking immediately or only progress display.
- Minimum confidence threshold for a meal to be recommended.
- DeepSeek V4 Flash per-request token cap and monthly budget limit.
- Exact Techno Edge menu import format.
