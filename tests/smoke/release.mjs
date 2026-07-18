import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export async function runReleaseSmoke({
  baseUrl = process.env.NUSFUEL_SMOKE_BASE_URL,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  random = Math.random,
} = {}) {
  const apiBaseUrl = String(baseUrl || "").replace(/\/$/, "");
  if (!apiBaseUrl) {
    throw new Error("Set NUSFUEL_SMOKE_BASE_URL to the Railway API URL.");
  }

  const request = async (path, options = {}) => {
    const response = await fetchImpl(`${apiBaseUrl}${path}`, options);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`${options.method || "GET"} ${path} returned ${response.status}: ${payload?.error || "invalid response"}`);
    }
    return payload;
  };
  const authorized = (accessToken) => ({ authorization: `Bearer ${accessToken}` });

  const health = await request("/health");
  assert.equal(health.status, "ok", "health check must pass");

  const email = `release-smoke-${now()}-${Math.floor(random() * 1e9)}@example.test`;
  const session = await request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "release-smoke-password-1" }),
  });
  assert.ok(session.accessToken, "registration must return an access token");

  const goal = { mode: "custom", caloriesKcal: 2400, proteinG: 150 };
  const apiHeaders = authorized(session.accessToken);
  await request("/goals", {
    method: "PUT",
    headers: { ...apiHeaders, "content-type": "application/json" },
    body: JSON.stringify(goal),
  });

  const search = await request("/search?query=chicken", { headers: apiHeaders });
  assert.ok(Array.isArray(search.items) && search.items.length > 0, "search must return a stored meal");
  const meal = search.items[0];
  const servings = 1.5;
  const mealLog = await request("/meal-logs", {
    method: "POST",
    headers: { ...apiHeaders, "content-type": "application/json" },
    body: JSON.stringify({ menuItemId: meal.id, servingQuantity: servings }),
  });
  assert.equal(mealLog.servingQuantity, servings, "meal log must keep the selected servings");
  for (const field of ["energyKcal", "proteinG", "totalFatG", "carbohydrateG", "sugarG"]) {
    assert.equal(mealLog.nutritionTotal[field], meal.nutrition[field] * servings, `${field} must scale with servings`);
  }

  const progress = await request("/progress?period=daily", { headers: apiHeaders });
  assert.equal(progress.period, "daily", "daily progress must load after logging a meal");

  const menu = await request("/menu", { headers: apiHeaders });
  const menuIDs = new Set(menu.map((item) => item.id));
  const recommendations = await request("/recommendations?period=daily", { headers: apiHeaders });
  assert.ok(Array.isArray(recommendations) && recommendations.length <= 3, "recommendations must return up to three meals");
  assert.ok(recommendations.every((item) => menuIDs.has(item.menuItemId)), "recommendations must reference stored meals");

  return { email, mealID: meal.id, recommendationCount: recommendations.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReleaseSmoke()
    .then(({ email, mealID, recommendationCount }) => {
      console.log(`Release smoke passed for ${email}: ${mealID}, ${recommendationCount} recommendations.`);
    })
    .catch((error) => {
      console.error(`Release smoke failed: ${error.message}`);
      process.exitCode = 1;
    });
}
