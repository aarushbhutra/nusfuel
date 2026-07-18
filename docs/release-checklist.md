# NUSFuel Railway release checklist

## Before deployment

- Run `go -C backend test ./...`.
- Run `npm run mobile:test` and `npm run mobile:lint`.
- Run `npm run smoke:test`.
- Review `railway status --json` and verify the `api` and `Postgres` services are healthy.
- Review the API variable names without reading values: `DATABASE_URL`, `JWT_SECRET`, `MENU_SEED_DIR`, and `DEEPSEEK_API_KEY`.
- Confirm `railway.toml` configures the Dockerfile and `/health`; confirm the mobile environment contains only `EXPO_PUBLIC_API_BASE_URL`.

## Deployment and operational review

- Deploy the committed API with `railway up --service api --environment production --detach -m "<release summary>"`.
- Confirm the deployment is successful with `railway deployment list --service api --limit 1 --json`.
- Request `https://<api-domain>/health` and expect `{"status":"ok"}`.
- Confirm a protected route returns `401` without a bearer token.
- Review `railway logs --latest --lines 100 --json`; successful application entries contain `request_id`, `route`, `method`, `status`, and `duration_ms`.

## Smoke path

The smoke runner creates a unique `release-smoke-*` user and a single meal log. Run it only against the approved release environment:

```text
NUSFUEL_SMOKE_BASE_URL=https://<api-domain> npm run smoke:release
```

It verifies health, sign-in, custom goal setup, stored-meal search, 1.5-serving nutrition scaling, meal logging, daily progress, and grounded recommendations.

## Manual Expo check

- Start the app with `EXPO_PUBLIC_API_BASE_URL=https://<api-domain> npm run mobile:web`.
- At a mobile-width viewport, sign in, set a goal, search a Techno Edge meal, adjust servings, log it, and open recommendations.
- Verify the incomplete-allergen warning remains visible where applicable.

## Open product questions

- Exact calorie/protein defaults for the three goal presets.
- Whether optional macro targets affect ranking immediately or only progress display.
- Minimum nutrition/allergen confidence required for recommendations.
- DeepSeek request-token cap and monthly budget.
- Techno Edge menu update process after the repository seed files.
