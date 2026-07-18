import assert from "node:assert/strict";
import test from "node:test";

import { authenticate } from "../src/lib/api/auth.js";

test("authentication sends credentials only to the Railway API", async () => {
  let request;
  const session = await authenticate("register", { email: "student@example.test", password: "safe-password-1" }, {
    baseUrl: "https://api.example.test/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ accessToken: "token-123" }) };
    },
  });

  assert.equal(request.url, "https://api.example.test/auth/register");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), { email: "student@example.test", password: "safe-password-1" });
  assert.equal(session.accessToken, "token-123");
});
