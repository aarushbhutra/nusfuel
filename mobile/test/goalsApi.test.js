import assert from "node:assert/strict";
import test from "node:test";

import { putGoal } from "../src/lib/api/goals.js";

test("goal API sends the authenticated goal to the backend", async () => {
  let request;
  const goal = { mode: "preset", preset: "maintenance", caloriesKcal: 2200, proteinG: 140 };

  const result = await putGoal(goal, {
    accessToken: "token-123",
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => goal };
    },
  });

  assert.equal(request.url, "https://api.example.test/goals");
  assert.equal(request.options.method, "PUT");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
  assert.deepEqual(JSON.parse(request.options.body), goal);
  assert.deepEqual(result, goal);
});

test("goal API requires a signed-in session", async () => {
  await assert.rejects(() => putGoal({ mode: "custom" }), /signed-in API session/);
});
