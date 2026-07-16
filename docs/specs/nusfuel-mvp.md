# Spec: NUSFuel MVP

## Objective

NUSFuel is a mobile-only nutrition companion for gym-focused NUS students. The MVP covers Techno Edge and its stalls. It lets a user set calorie and protein goals, optionally add fat, carbohydrate, and sugar targets under “More options,” log one-serving meals with adjustable quantities, view progress, and receive three grounded meal recommendations.

The backend is cloud-hosted on Railway from the first implementation. AI interprets natural-language meal requests through DeepSeek V4 Flash's Anthropic-compatible API, but recommendations and nutrition facts must come from stored menu data.

## Product Requirements

### Goals

- Provide three initial presets: cutting, maintenance, and gaining.
- Allow custom calorie and protein targets by default.
- Allow optional custom fat, carbohydrate, and sugar targets through “More options.”
- Represent every menu item as one serving and recalculate totals when servings change.
- Store Energy (kcal), Protein (g), Total Fat (g), Carbohydrate (g), and Sugar (g).
- Support meal logging, daily/weekly progress, and three ranked next-meal recommendations.
- Support grounded natural-language search from the first release.

### Safety and data quality

- AI must not invent meals, nutrition, prices, allergens, or availability.
- Recommendations must apply structured allergen and dietary filters before ranking.
- Nutrition records must include source and confidence metadata.
- Missing or uncertain allergen data must be shown as incomplete, never guaranteed safe.
- The app must display a general-nutrition disclaimer, not medical advice.

### Initial recommendation ranking

```text
structured dietary/allergen filters
→ calorie and protein fit
→ optional macro fit
→ outlet relevance
→ variety
```

## Tech Stack

- Mobile: React Native, Expo, TypeScript
- Navigation: React Navigation
- Client data fetching: TanStack Query
- Local UI state: Zustand
- API: Railway public Go service
- Backend: Go; use DeepSeek's Anthropic-compatible API directly
- Authentication: backend-issued JWTs backed by Railway PostgreSQL user records
- Primary database: Railway PostgreSQL
- AI: DeepSeek V4 Flash through `https://api.deepseek.com/anthropic`, called only by the Railway service with `DEEPSEEK_API_KEY`
- Menu seed/source files: one repository JSON file per Techno Edge stall during MVP, loaded by the service
- Observability: Railway deployment/runtime logs and structured application logs
- Hosting: Railway service plus Railway PostgreSQL; no AWS hosting infrastructure
- Testing: Go `testing`, Vitest, React Native Testing Library, and optional Playwright/device smoke tests

Redis is not required for the first vertical slice. Add it only after baseline latency/read measurements justify cache complexity.

## Commands

Commands are the intended project contract; exact package scripts are created during implementation.

```text
Mobile dev:   npm run mobile:dev
Mobile test:  npm run mobile:test
Mobile lint:  npm run mobile:lint
Backend test: go test ./...
Backend lint: golangci-lint run
Railway status: railway status
Railway logs:   railway logs --latest --lines 100
Deploy:         Railway GitHub deployment or railway up
```

## Project Structure

```text
mobile/                 React Native + Expo application
mobile/src/screens/     App screens and navigation targets
mobile/src/components/  Reusable UI components
mobile/src/lib/         API client, query hooks, and local state
mobile/src/types/       Shared mobile-facing types
backend/cmd/             HTTP API entrypoint
backend/internal/        Go modules for auth, menus, logs, goals, and recommendations
backend/internal/ai/     DeepSeek intent extraction and grounded explanation
backend/internal/store/  PostgreSQL and seed-menu access
backend/tests/           Backend unit and integration tests
infra/                   Legacy AWS Terraform baseline; do not apply
data/                    Techno Edge seed menu data
docs/ideas/              Product ideation artifacts
docs/specs/              Specifications and living contracts
```

## Code Style

Use small, explicit modules; validate at trust boundaries; keep domain rules deterministic and independently testable.

TypeScript example:

```ts
export function scaleNutrition(item: Nutrition, servings: number): Nutrition {
  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error("servings must be greater than zero");
  }

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, value * servings]),
  ) as Nutrition;
}
```

Conventions:

- TypeScript: `camelCase` values, `PascalCase` types/components, strict mode.
- Go: standard `gofmt`, short packages, errors wrapped with context.
- API fields: JSON `camelCase`; prices and nutrition values use explicit units in names or schemas.
- No AI call may bypass the menu repository or structured validation.
- Initial menu import uses `data/techno-edge/*.json`; backend seed checks validate each stall file before it can feed app storage.

## Testing Strategy

- Unit tests cover serving scaling, goal presets, custom-goal validation, recommendation ranking, allergen exclusion, and AI-filter validation.
- API integration tests run against an isolated PostgreSQL database.
- Mobile component tests cover goal setup, meal detail/serving changes, meal logging, progress summaries, and recommendation rendering.
- One end-to-end smoke path must cover sign-in, set goal, find Techno Edge meal, change servings, log meal, and receive recommendations.
- Every bug fix adds one regression test.
- Before implementation is considered complete: backend tests, mobile tests, lint, Railway deployment health check, and the smoke path pass.

## Boundaries

### Always

- Validate all user input and authenticated identity at the backend boundary.
- Ground AI output in database results.
- Preserve source, confidence, and last-verified metadata for menu data.
- Run the relevant tests before committing.
- Keep the first release limited to Techno Edge and its stalls.

### Ask first

- Adding an AI provider other than the approved DeepSeek integration, or a paid dependency.
- Changing the menu, goal, or meal-log data contracts.
- Expanding beyond mobile or Techno Edge.
- Adding medical, body-transformation, or safety guarantees.
- Changing the AI provider or allowing model-generated meal facts.

### Never

- Commit credentials, tokens, or unredacted personal data.
- Treat missing allergen information as safe.
- Return AI-generated meals or nutrition values that are absent from storage.
- Remove failing tests to make a build pass.
- Deploy before reviewing Railway service settings, variables, and health-check status.

## Success Criteria

- A new user can authenticate, choose a preset or custom calorie/protein goal, and optionally add more macro targets.
- A user can browse Techno Edge meals and see all five nutrition fields per serving.
- Changing servings recalculates displayed and logged nutrition totals correctly.
- A user can log a meal and see correct daily and weekly calorie/protein totals.
- The recommendation endpoint returns up to three available, dietary-compatible meals ranked by target fit.
- Natural-language search produces validated structured filters and retrieves only stored Techno Edge meals.
- Incomplete allergen data produces a visible warning.
- The backend is deployed to Railway with authenticated API access, Railway PostgreSQL, structured logs, and a passing health check.
- Automated tests cover the core domain rules and the end-to-end smoke path passes.

## Open Questions

- What exact calorie/protein defaults should the three presets use?
- Should optional targets affect ranking immediately or only progress display?
- What minimum nutrition/allergen confidence is required before a meal can be recommended?
- What per-request token cap and monthly budget fit DeepSeek V4 Flash?
- What is the menu update process after the initial repository seed files?
