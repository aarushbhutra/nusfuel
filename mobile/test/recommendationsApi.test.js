import assert from "node:assert/strict";
import test from "node:test";

import { getRecommendations } from "../src/lib/api/recommendations.js";

test("recommendations API loads the selected period for an authenticated user", async () => {
  let request;
  const recommendations = [{ rank: 1, menuItemId: "meal-1", fitReason: "Best fit", allergenWarnings: [] }];

  const result = await getRecommendations("weekly", {
    accessToken: "token-123",
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => recommendations };
    },
  });

  assert.equal(request.url, "https://api.example.test/recommendations?period=weekly");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
  assert.deepEqual(result, recommendations);
});

test("recommendations API rejects invalid periods and missing sessions", async () => {
  await assert.rejects(() => getRecommendations("monthly"), /signed-in API session/);
  await assert.rejects(
    () => getRecommendations("monthly", { accessToken: "token-123", baseUrl: "https://api.example.test" }),
    /daily or weekly/,
  );
});
