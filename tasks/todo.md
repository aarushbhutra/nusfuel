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

## Task 5: Add AWS auth and API infrastructure baseline

**Description:** Define Terraform resources for Cognito, API Gateway, Lambda, DynamoDB, IAM, and CloudWatch logs. Keep it minimal and environment-variable driven.

**Acceptance criteria:**
- [x] Terraform can plan Cognito, API Gateway, Lambda, DynamoDB, IAM, and logs.
- [x] Lambdas receive table names and configuration through environment variables.
- [x] No secrets or credentials are committed.

**Verification:**
- [x] Run `terraform -chdir=infra fmt`.
- [x] Run `terraform -chdir=infra validate`.
- [x] Run `terraform -chdir=infra plan`.

**Dependencies:** Task 1

**Files likely touched:**
- `infra/*.tf`
- `backend/cmd`
- `backend/internal/config`

**Estimated scope:** M

## Task 6: Implement authenticated goal setup API

**Description:** Add backend endpoints for reading and writing the signed-in user's macro goal. Persist goals in DynamoDB keyed by authenticated user ID.

**Acceptance criteria:**
- [x] Unauthenticated requests are rejected.
- [x] Users can save preset or custom goals.
- [x] More Options macros are optional and validated when present.

**Verification:**
- [x] Run `go test ./...`.
- [x] Run API handler tests for authorized and unauthorized requests.

**Dependencies:** Tasks 2, 4, 5

**Files likely touched:**
- `backend/cmd/api`
- `backend/internal/store`
- `backend/internal/handlers`
- `backend/internal/domain`

**Estimated scope:** M

## Task 7: Implement mobile onboarding and goal setup

**Description:** Add the mobile auth entry point and goal setup screen. Users can choose cutting, maintenance, gaining, or custom targets, with fat/carbohydrate/sugar hidden under More Options.

**Acceptance criteria:**
- [x] User can sign in or reach authenticated app state.
- [x] User can choose one of three presets.
- [x] User can enter custom calorie/protein goals and optional macros.
- [x] Onboarding collects age, weight, and gender for personalized preset targets.

**Verification:**
- [x] Run `npm run mobile:test`.
- [x] Run `npm run mobile:lint`.
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
- [x] API returns only stored Techno Edge meals.
- [x] Meal detail includes all five nutrition fields per serving.
- [x] Incomplete allergen data is explicit in the response.

**Verification:**
- [x] Run `go test ./...`.
- [x] Run handler tests for menu list and meal detail.

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

**Description:** Add endpoints to log a meal with serving quantity and retrieve daily/weekly progress against the user's goal.

**Acceptance criteria:**
- [x] Logged meals store scaled nutrition totals.
- [x] Daily and weekly progress return calorie and protein totals.
- [x] Optional macros are included in progress when a user configured them.

**Verification:**
- [x] Run `go test ./...`.
- [x] Run handler tests for log creation and progress retrieval.

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
- [x] Endpoint returns up to three stored Techno Edge meals.
- [x] Allergen and dietary exclusions run before scoring.
- [x] Missing allergen data creates a warning in the response.

**Verification:**
- [x] Run `go test ./...`.
- [x] Run ranking tests for calorie/protein fit, optional macro fit, outlet relevance, and variety.

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
- [ ] Recommendation cards show meal, stall, nutrition, and fit reason.
- [ ] Incomplete allergen warnings are visible.
- [ ] User can open a recommended meal detail and log it.

**Verification:**
- [ ] Run `npm run mobile:test`.
- [ ] Run `npm run mobile:lint`.
- [ ] Manual check in Expo dev server.

**Dependencies:** Task 12

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 14: Implement Bedrock natural-language filter extraction

**Description:** Add backend-only Bedrock integration that converts natural-language meal requests into validated structured filters. The filters are then applied to stored Techno Edge meals.

**Acceptance criteria:**
- [ ] Bedrock output is parsed and validated before use.
- [ ] Invalid or unsupported model output falls back to deterministic search behavior.
- [ ] AI cannot create meals, facts, allergens, or nutrition values.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Run handler tests with mocked Bedrock responses.

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
- [ ] User can search for meal intent in natural language.
- [ ] Results show only stored Techno Edge meals.
- [ ] Empty or unsupported queries show a usable fallback state.

**Verification:**
- [ ] Run `npm run mobile:test`.
- [ ] Run `npm run mobile:lint`.
- [ ] Manual check in Expo dev server.

**Dependencies:** Task 14

**Files likely touched:**
- `mobile/src/screens`
- `mobile/src/components`
- `mobile/src/lib/api`
- `mobile/src/types`

**Estimated scope:** M

## Task 16: Add CloudWatch logging and basic operational errors

**Description:** Add structured backend logs for auth failures, validation failures, DynamoDB failures, Bedrock failures, and recommendation fallbacks.

**Acceptance criteria:**
- [ ] Backend logs include request ID and route.
- [ ] User-facing API errors do not expose internals.
- [ ] Bedrock failures are observable and degrade gracefully.

**Verification:**
- [ ] Run `go test ./...`.
- [ ] Review CloudWatch log resources in Terraform plan.

**Dependencies:** Tasks 5, 14

**Files likely touched:**
- `backend/internal/handlers`
- `backend/internal/logging`
- `backend/internal/ai`
- `infra/*.tf`

**Estimated scope:** S

## Task 17: Complete Terraform deployment wiring

**Description:** Wire Lambda build artifacts, API routes, Cognito authorizer, DynamoDB tables, environment variables, and outputs needed by the mobile app.

**Acceptance criteria:**
- [ ] Terraform plan includes all MVP backend routes.
- [ ] API endpoints require Cognito auth except public health checks if any.
- [ ] Terraform outputs include mobile API base URL and Cognito config.

**Verification:**
- [ ] Run `terraform -chdir=infra fmt`.
- [ ] Run `terraform -chdir=infra validate`.
- [ ] Run `terraform -chdir=infra plan`.

**Dependencies:** Tasks 5, 6, 8, 10, 12, 14, 16

**Files likely touched:**
- `infra/*.tf`
- `backend/cmd`
- `mobile/src/lib/config`

**Estimated scope:** M

## Task 18: Add end-to-end smoke check and release checklist

**Description:** Add the smallest repeatable smoke check for the MVP flow and document the release gate.

**Acceptance criteria:**
- [ ] Smoke path covers sign in, set goal, find meal, change servings, log meal, view recommendations.
- [ ] Release checklist includes backend tests, mobile tests, lint, Terraform plan, and manual Expo check.
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
