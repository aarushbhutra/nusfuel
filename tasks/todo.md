# Task List: NUSFuel MVP

## Task 1: Create the project command scaffold

**Description:** Create the minimum repo structure and scripts for mobile, backend, infrastructure, data, and task execution. This task establishes the commands from the spec without implementing product behavior.

**Acceptance criteria:**
- [x] `mobile/`, `backend/`, `infra/`, and `data/` exist.
- [x] Root scripts expose `mobile:dev`, `mobile:test`, and `mobile:lint`.
- [x] Backend Go module runs `go test ./...`.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
- [x] Run `go test ./...`.

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `mobile/package.json`
- `backend/go.mod`
- `infra/versions.tf`

**Estimated scope:** M

## Task 2: Define menu, goal, meal-log, and recommendation contracts

**Description:** Define the JSON contracts used between mobile, backend, seed data, and tests. Contracts must include nutrition units, source metadata, confidence, serving quantity, allergens, and optional macro targets.

**Acceptance criteria:**
- [x] Menu item contract includes Energy (kcal), Protein (g), Total Fat (g), Carbohydrate (g), and Sugar (g).
- [x] Goal contract supports preset and custom calorie/protein goals plus optional More Options macros.
- [x] Meal log contract stores serving quantity and scaled nutrition totals.

**Verification:**
- [x] Contract examples validate in backend tests.
- [x] Mobile-facing TypeScript types match the API JSON fields.

**Dependencies:** Task 1

**Files likely touched:**
- `backend/internal/contracts`
- `mobile/src/types`
- `data/examples`
- `docs/specs/nusfuel-mvp.md`

**Estimated scope:** M

## Task 3: Add Techno Edge seed data format and importer checks

**Description:** Add the initial seed-data shape for Techno Edge stalls and menu items. Include validation so incomplete nutrition or missing source/confidence metadata fails fast.

**Acceptance criteria:**
- [x] Seed entries are one serving by default.
- [x] Required nutrition fields, source, confidence, stall, and allergen status are validated.
- [x] Missing allergen data is represented as incomplete, not safe.

**Verification:**
- [x] Run seed validation test or command.
- [x] Run `go test ./...`.

**Dependencies:** Task 2

**Files likely touched:**
- `data/techno-edge-menu.json`
- `backend/internal/seed`
- `backend/internal/seed/seed_test.go`

**Estimated scope:** S

## Task 4: Implement backend domain rules with tests

**Description:** Implement pure Go domain logic for serving scaling, goal validation, preset selection, allergen filtering, and deterministic recommendation ranking.

**Acceptance criteria:**
- [x] Invalid serving values are rejected.
- [x] Preset and custom goals validate correctly.
- [x] Recommendation ranking follows filters, calorie/protein fit, optional macro fit, outlet relevance, then variety.

**Verification:**
- [x] Run `go test ./...`.

**Dependencies:** Tasks 2, 3

**Files likely touched:**
- `backend/internal/domain`
- `backend/internal/domain/*_test.go`

**Estimated scope:** M

## Task 5: Replace the AWS baseline with Railway API and PostgreSQL

**Description:** Replace the legacy Terraform/Cognito/API Gateway/Lambda/DynamoDB baseline with one Railway-hosted Go HTTP API and Railway PostgreSQL. Keep the legacy `infra/` directory unapplied until the implementation safely removes it.

**Acceptance criteria:**
- [ ] The Go API runs as an HTTP service on Railway and listens on Railway's assigned port.
- [ ] Railway PostgreSQL holds user, goal, and meal-log records with the required query indexes.
- [ ] Railway variables provide database configuration; no secrets or credentials are committed.
- [ ] The legacy AWS Terraform baseline is explicitly marked as not deployable until removed.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Verify the Railway service health check.
- [ ] Verify the Railway PostgreSQL connection from the deployed service.

**Dependencies:** Task 1

**Files likely touched:**
- `backend/cmd`
- `backend/internal/config`
- `backend/internal/store`
- Railway service configuration

**Estimated scope:** M

## Task 6: Implement authenticated goal setup API

**Description:** Add backend email/password authentication with backend-issued JWTs, then read and write the signed-in user's macro goal in Railway PostgreSQL keyed by the authenticated user ID.

**Acceptance criteria:**
- [ ] Unauthenticated requests are rejected.
- [ ] Users can save preset or custom goals.
- [ ] More Options macros are optional and validated when present.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run API handler tests for authorized and unauthorized requests.

**Dependencies:** Tasks 2, 4, 5

**Files likely touched:**
- `backend/cmd/api`
- `backend/internal/store`
- `backend/internal/handlers`
- `backend/internal/domain`

**Estimated scope:** M

## Task 7: Implement mobile onboarding and goal setup

**Description:** Connect the mobile auth entry point and goal setup screen to backend JWT authentication. Users can choose cutting, maintenance, gaining, or custom targets, with fat/carbohydrate/sugar hidden under More Options.

**Acceptance criteria:**
- [ ] User can sign in and reach authenticated app state.
- [ ] User can choose one of three presets.
- [ ] User can enter custom calorie/protein goals and optional macros.
- [ ] Onboarding collects age, weight, and gender for personalized preset targets.

**Verification:**
- [ ] Run `npm run mobile:test`.
- [ ] Run `npm run mobile:lint`.
- [ ] Manual check in Expo dev server.

**Dependencies:** Task 6

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 8: Implement menu browse and meal detail API

**Description:** Add endpoints for listing Techno Edge stalls/items and retrieving meal details with per-serving nutrition, allergens, and source/confidence metadata.

**Acceptance criteria:**
- [ ] API returns only stored Techno Edge meals.
- [ ] Meal detail includes all five nutrition fields per serving.
- [ ] Incomplete allergen data is explicit in the response.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run handler tests for menu list and meal detail.

**Dependencies:** Tasks 2, 3, 5

**Files likely touched:**
- `backend/internal/handlers`
- `backend/internal/store`
- `backend/internal/domain`
- `backend/cmd/api`

**Estimated scope:** M

## Task 9: Implement mobile menu browse, serving adjustment, and nutrition display

**Description:** Add Techno Edge browse and meal detail screens. Show one-serving nutrition by default and recalculate all five nutrition fields when serving quantity changes.

**Acceptance criteria:**
- [x] User can browse Techno Edge stalls and meals.
- [x] Meal detail shows Energy, Protein, Total Fat, Carbohydrate, and Sugar.
- [x] Serving quantity updates displayed nutrition totals.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
- [x] Manual check in Expo dev server.

**Dependencies:** Task 8

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 10: Implement meal logging and progress API

**Description:** Add Railway HTTP endpoints that log a meal with serving quantity in PostgreSQL and retrieve daily/weekly progress against the user's goal.

**Acceptance criteria:**
- [ ] Logged meals store scaled nutrition totals.
- [ ] Daily and weekly progress return calorie and protein totals.
- [ ] Optional macros are included in progress when a user configured them.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run handler tests for log creation and progress retrieval.

**Dependencies:** Tasks 6, 8

**Files likely touched:**
- `backend/internal/handlers`
- `backend/internal/store`
- `backend/internal/domain`
- `backend/cmd/api`

**Estimated scope:** M

## Task 11: Implement mobile meal logging and daily/weekly progress

**Description:** Connect meal detail to logging and add a progress view for daily and weekly calorie/protein totals, with optional More Options macros when configured.

**Acceptance criteria:**
- [x] User can log a selected meal with selected servings.
- [x] Daily and weekly progress updates after logging.
- [x] Optional macro progress appears only when configured.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
- [x] Manual check in Expo dev server.

**Dependencies:** Task 10

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/lib/state`

**Estimated scope:** M

## Task 12: Implement deterministic recommendation endpoint

**Description:** Add backend recommendations based on stored menu data and the user's remaining daily/weekly targets. Allergen and dietary filters must run before ranking.

**Acceptance criteria:**
- [ ] Endpoint returns up to three stored Techno Edge meals.
- [ ] Allergen and dietary exclusions run before scoring.
- [ ] Missing allergen data creates a warning in the response.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run ranking tests for calorie/protein fit, optional macro fit, outlet relevance, and variety.

**Dependencies:** Tasks 4, 10

**Files likely touched:**
- `backend/internal/handlers`
- `backend/internal/domain`
- `backend/internal/store`
- `backend/cmd/api`

**Estimated scope:** M

## Task 13: Add mobile recommendation cards

**Description:** Show up to three recommended meals with nutrition impact, source/confidence metadata, and incomplete allergen warnings.

**Acceptance criteria:**
- [x] Recommendation cards show meal, stall, nutrition, and fit reason.
- [x] Incomplete allergen warnings are visible.
- [x] User can open a recommended meal detail and log it.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
- [x] Manual check in Expo dev server.

**Dependencies:** Task 12

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 14: Implement DeepSeek V4 Flash natural-language filter extraction

**Description:** Add backend-only DeepSeek V4 Flash integration in the Railway service that calls `https://api.deepseek.com/anthropic` with `DEEPSEEK_API_KEY`, converts natural-language meal requests into validated structured filters, and applies the filters to stored Techno Edge meals.

**Acceptance criteria:**
- [x] DeepSeek output is parsed and validated before use.
- [x] Invalid or unsupported model output falls back to deterministic search behavior.
- [x] AI cannot create meals, facts, allergens, or nutrition values.

**Verification:**
- [x] Run `go test ./...`.
- [x] Run handler tests with mocked DeepSeek responses.

**Dependencies:** Tasks 8, 12

**Files likely touched:**
- `backend/internal/ai`
- `backend/internal/handlers`
- `backend/internal/domain`
- `backend/internal/config`

**Estimated scope:** M

## Task 15: Add mobile natural-language search

**Description:** Add a mobile search input that sends natural-language queries to the backend and renders validated stored meal results.

**Acceptance criteria:**
- [x] User can search for meal intent in natural language.
- [x] Results show only stored Techno Edge meals.
- [x] Empty or unsupported queries show a usable fallback state.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
- [x] Manual check in Expo dev server.

**Dependencies:** Task 14

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 16: Add Railway logging and basic operational errors

**Description:** Add structured backend logs visible in Railway for auth failures, validation failures, PostgreSQL failures, DeepSeek failures, and recommendation fallbacks.

**Acceptance criteria:**
- [ ] Backend logs include request ID and route.
- [ ] User-facing API errors do not expose internals.
- [ ] DeepSeek failures are observable and degrade gracefully.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Verify structured logs in Railway after a deployed request.

**Dependencies:** Tasks 5, 14

**Files likely touched:**
- `backend/internal/handlers`
- `backend/internal/logging`
- `backend/internal/ai`
- Railway service configuration

**Estimated scope:** S

## Task 17: Complete Railway deployment wiring

**Description:** Connect the repository to a Railway Go service and PostgreSQL, configure the public API domain, database and `DEEPSEEK_API_KEY` variables, and a `/health` deployment health check. The mobile app receives only the Railway API base URL.

**Acceptance criteria:**
- [ ] Railway deploys all MVP backend routes from the repository.
- [ ] API endpoints require backend JWT auth except the public health check.
- [ ] Railway variables include database configuration and `DEEPSEEK_API_KEY`; the mobile config contains only the API base URL.
- [ ] Railway marks the service healthy through `/health` after deployment.

**Verification:**
- [ ] Review Railway service settings and variables without exposing values.
- [ ] Verify `railway status` and `railway logs --latest --lines 100` after deployment.

**Dependencies:** Tasks 5, 6, 8, 10, 12, 14, 16

**Files likely touched:**
- `backend/cmd`
- `mobile/src/lib/config`
- Railway service configuration

**Estimated scope:** M

## Task 18: Add end-to-end smoke check and release checklist

**Description:** Add the smallest repeatable smoke check for the MVP flow and document the Railway release gate.

**Acceptance criteria:**
- [ ] Smoke path covers sign in, set goal, find meal, change servings, log meal, view recommendations.
- [ ] Release checklist includes backend tests, mobile tests, lint, Railway health/log review, and manual Expo check.
- [ ] Known open questions are documented if still unresolved.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run `npm run mobile:test`.
- [ ] Run `npm run mobile:lint`.
- [ ] Run the smoke path manually or with the chosen smoke tool.

**Dependencies:** Tasks 7, 9, 11, 13, 15, 17

**Files likely touched:**
- `tests/smoke`
- `docs/release-checklist.md`
- `mobile/src`
- `backend`

**Estimated scope:** M
