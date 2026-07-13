import assert from "node:assert/strict";
import test from "node:test";

import { getMenu, getMenuItem } from "../src/lib/api/menu.js";

test("menu API loads the authenticated menu", async () => {
  let request;
  const menu = [{ id: "meal-1", stall: "Techno Edge Western" }];

  const result = await getMenu({
    accessToken: "token-123",
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => menu };
    },
  });

  assert.equal(request.url, "https://api.example.test/menu");
  assert.equal(request.options.headers.authorization, "Bearer token-123");
  assert.deepEqual(result, menu);
});

test("menu API encodes menu item IDs", async () => {
  let requestedUrl;

  await getMenuItem("meal/one", {
    accessToken: "token-123",
    baseUrl: "https://api.example.test",
    fetchImpl: async (url) => {
      requestedUrl = url;
      return { ok: true, json: async () => ({ id: "meal/one" }) };
    },
  });

  assert.equal(requestedUrl, "https://api.example.test/menu/meal%2Fone");
});

test("menu API requires a signed-in session", async () => {
  await assert.rejects(() => getMenu(), /signed-in API session/);
});
