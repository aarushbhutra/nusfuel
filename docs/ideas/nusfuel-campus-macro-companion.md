# NUSFuel — Campus Macro Companion

## Problem Statement

How might we help gym-focused NUS students log campus meals in seconds and decide what to eat next so they can stay on track with calorie and macro goals?

## Recommended Direction

Build a Techno Edge-focused campus macro companion around one loop: **log a meal → see the remaining target → receive three suitable meal recommendations**.

Meals are recorded using the published nutrition data instead of manual entry. Users may enter their own overall calorie and macro targets or choose one of three predefined goals: cutting, maintenance, or gaining. Recommendations use verified meal data and explain the match; AI can help interpret requests, but it must not invent nutrition, allergen, price, or availability data.

## Nutrition Data

Each menu item is shown for **one serving** and includes:

- Energy (kcal)
- Protein (g)
- Total fat (g)
- Carbohydrate (g)
- Sugar (g)

Users can change the number of servings, with totals recalculated accordingly.

## Key Assumptions to Validate

- [ ] Users can find and log common Techno Edge meals quickly.
- [ ] One-serving defaults plus adjustable servings are accurate enough for repeat use.
- [ ] Three ranked “eat next” recommendations are useful after a meal is logged.
- [ ] Users understand and trust the distinction between verified and estimated nutrition data.

## MVP Scope

The MVP serves **Techno Edge and its stalls only**.

Included:

- User authentication
- Calorie and macro goal setup
- Three predefined goals plus custom overall targets
- Techno Edge outlet and stall browsing
- Meal details with the five nutrition fields, allergens, serving size, and source confidence
- Adjustable serving quantities
- Meal logging
- Daily and weekly calorie/macro progress
- Three ranked “eat next” recommendations
- Natural-language search grounded in stored menu data
- Basic correction reporting for inaccurate menu information

The initial ranking can be deterministic:

```text
hard dietary/allergen filters
→ calorie and macro fit
→ distance or outlet relevance
→ price and variety
```

## Not Doing (and Why)

- **Other NUS dining locations** — keep the first dataset and experience focused on Techno Edge.
- **Adaptive weekly coaching** — add after the basic logging and recommendation loop works.
- **Multi-item meal-stack builder** — add later; it depends on reliable portions and add-ons.
- **Social features, distribution, and retention programs** — outside the current product-definition scope.
- **Machine-learning ranking** — rules are easier to validate and explain initially.
- **Full admin dashboard and ingestion pipeline** — manual data maintenance is sufficient for the first narrow release.
- **Medical or body-transformation advice** — outside the app’s safe scope.

## Product Sequence

1. **Campus Macro Companion:** logging and immediate next-meal recommendations.
2. **Adaptive Weekly Coach:** adjust suggestions based on weekly progress.
3. **Macro Meal Builder:** construct realistic multi-item combinations.

## Open Questions

- What are the exact three predefined goal names and target formulas?
- Should custom targets include only calories and protein initially, or all five nutrition fields?
- How should serving-size differences be represented when a stall’s portion is not standardized?
- Which Techno Edge stalls have sufficiently reliable nutrition and allergen data for launch?
