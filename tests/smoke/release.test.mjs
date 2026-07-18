import assert from "node:assert/strict";
import test from "node:test";

import { runReleaseSmoke } from "./release.mjs";

test("release smoke covers the authenticated MVP flow", async () => {
  const calls = [];
  const meal = {
    id: "meal-1",
    nutrition: { energyKcal: 500, proteinG: 30, totalFatG: 10, carbohydrateG: 50, sugarG: 5 },
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    const path = new URL(url).pathname;
    const response = (payload) => ({ ok: true, status: 200, json: async () => payload });
    if (path === "/health") return response({ status: "ok" });
    if (path === "/auth/register") return response({ accessToken: "token-1" });
    if (path === "/goals") return response({});
    if (path === "/search") return response({ items: [meal], usedFallback: false });
    if (path === "/meal-logs") return response({ servingQuantity: 1.5, nutritionTotal: { energyKcal: 750, proteinG: 45, totalFatG: 15, carbohydrateG: 75, sugarG: 7.5 } });
    if (path === "/progress") return response({ period: "daily" });
    if (path === "/menu") return response([meal]);
    if (path === "/recommendations") return response([{ menuItemId: meal.id }]);
    throw new Error(`unexpected path ${path}`);
  };

  const result = await runReleaseSmoke({ baseUrl: "https://api.example.test/", fetchImpl, now: () => 123, random: () => 0.5 });

  assert.equal(result.mealID, meal.id);
  assert.equal(result.recommendationCount, 1);
  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), ["/health", "/auth/register", "/goals", "/search", "/meal-logs", "/progress", "/menu", "/recommendations"]);
});
