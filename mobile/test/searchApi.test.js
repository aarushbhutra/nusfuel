import assert from "node:assert/strict";
import test from "node:test";

import { searchMeals } from "../src/lib/api/search.js";

test("natural-language search sends an encoded query for the authenticated user", async () => {
  let request;
  const results = { items: [{ id: "meal-1", name: "Grilled Chicken" }], usedFallback: false };

  const result = await searchMeals("chicken without peanuts", {
    accessToken: "token-123",
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => results };
    },
  });

  assert.equal(request.url, "https://api.example.test/search?query=chicken%20without%20peanuts");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
  assert.deepEqual(result, results);
});

test("natural-language search rejects blank queries and missing sessions", async () => {
  await assert.rejects(() => searchMeals(""), /meal request/);
  await assert.rejects(
    () => searchMeals("chicken", { baseUrl: "https://api.example.test" }),
    /signed-in API session/,
  );
});
