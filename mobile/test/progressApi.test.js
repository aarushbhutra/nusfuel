import assert from "node:assert/strict";
import test from "node:test";

import { getProgress, postMealLog } from "../src/lib/api/progress.js";

test("meal log API posts the selected meal and servings", async () => {
  let request;
  const mealLog = { menuItemId: "meal-1", servingQuantity: 1.5 };

  const result = await postMealLog(mealLog, {
    accessToken: "token-123",
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ id: "log-1", ...mealLog }) };
    },
  });

  assert.equal(request.url, "https://api.example.test/meal-logs");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
  assert.deepEqual(JSON.parse(request.options.body), mealLog);
  assert.equal(result.id, "log-1");
});

test("progress API requests the selected period", async () => {
  let request;

  await getProgress("weekly", {
    accessToken: "token-123",
    baseUrl: "https://api.example.test",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ period: "weekly" }) };
    },
  });

  assert.equal(request.url, "https://api.example.test/progress?period=weekly");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
});

test("progress API rejects invalid periods and missing sessions", async () => {
  await assert.rejects(() => getProgress("monthly"), /signed-in API session/);
  await assert.rejects(
    () => getProgress("monthly", { accessToken: "token-123", baseUrl: "https://api.example.test" }),
    /daily or weekly/,
  );
  await assert.rejects(() => postMealLog({ menuItemId: "meal-1", servingQuantity: 1 }), /signed-in API session/);
});
