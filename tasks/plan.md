# Implementation Plan: NUSFuel MVP

## Overview

Build a mobile-only Expo app backed by AWS-hosted Go Lambdas for Techno Edge meal logging and macro recommendations. The first release proves the core user loop: authenticate, set calorie/protein goals, browse stored Techno Edge meals, adjust servings, log meals, view daily/weekly progress, and get up to three grounded recommendations.

## Architecture Decisions

- Keep the first data source as repository seed data that can be uploaded to DynamoDB/S3 by Terraform or a small import command. This avoids building an admin CMS before the app has real users.
- Keep recommendation ranking deterministic in Go. Bedrock is used only to convert natural-language requests into structured filters; stored menu data remains the source of truth.
- Use Cognito, API Gateway, Lambda, DynamoDB, CloudWatch, and Terraform from the start because the spec requires an AWS-ready backend.
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

### Phase 2: Core User Loop

- [x] Task 5: Add AWS auth and API infrastructure baseline
- [x] Task 6: Implement authenticated goal setup API
- [x] Task 7: Implement mobile onboarding and goal setup
- [ ] Task 8: Implement menu browse and meal detail API
- [ ] Task 9: Implement mobile menu browse, serving adjustment, and nutrition display
- [ ] Task 10: Implement meal logging and progress API
- [ ] Task 11: Implement mobile meal logging and daily/weekly progress

### Checkpoint: Core User Loop

- [ ] A signed-in user can set a preset or custom goal
- [ ] A signed-in user can browse Techno Edge meals
- [ ] Serving quantity changes recalculate all displayed nutrition fields
- [ ] A signed-in user can log a meal and see updated daily/weekly totals
- [ ] Backend and mobile tests pass

### Phase 3: Recommendations and Search

- [ ] Task 12: Implement deterministic recommendation endpoint
- [ ] Task 13: Add mobile recommendation cards
- [ ] Task 14: Implement Bedrock natural-language filter extraction
- [ ] Task 15: Add mobile natural-language search

### Checkpoint: Recommendations

- [ ] Recommendation endpoint returns up to three stored Techno Edge meals
- [ ] Allergen and dietary filters run before ranking
- [ ] Optional macro targets affect ranking only if present
- [ ] Natural-language search cannot return meals or facts absent from storage

### Phase 4: Deployment and Release Gate

- [ ] Task 16: Add CloudWatch logging and basic operational errors
- [ ] Task 17: Complete Terraform deployment wiring
- [ ] Task 18: Add end-to-end smoke check and release checklist

### Checkpoint: Complete

- [ ] `go test ./...` passes
- [ ] `npm run mobile:test` passes
- [ ] `npm run mobile:lint` passes
- [ ] `terraform -chdir=infra plan` completes and is reviewed before apply
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

Terraform auth/API/database baseline
  -> authenticated backend APIs
  -> deployed smoke path

Deterministic recommendation logic
  -> recommendation API
  -> mobile recommendation cards
  -> Bedrock natural-language filters
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Preset formulas are not yet chosen | Medium | Ship configurable preset constants with conservative placeholders and keep custom goals available |
| Menu/allergen data is incomplete | High | Store confidence/source metadata and show incomplete allergen warnings |
| Bedrock adds latency or unreliable parsing | Medium | Keep deterministic browse/filter path working without AI |
| AWS setup slows early development | Medium | Build backend handlers and tests locally before wiring Terraform apply |
| Mobile and backend contracts drift | High | Define shared JSON contracts early and test request/response shapes |

## Open Questions

- Exact calorie/protein defaults for cutting, maintenance, and gaining.
- Whether fat/carbohydrate/sugar targets affect recommendation ranking immediately or only progress display.
- Minimum confidence threshold for a meal to be recommended.
- Bedrock model, AWS region, and budget limit.
- Exact Techno Edge menu import format.
