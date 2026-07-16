import assert from "node:assert/strict";
import test from "node:test";

import { filterPreviewMenu, PREVIEW_MENU } from "../src/lib/menuPreview.js";

test("preview search returns only stored meals that match the request", () => {
  const results = filterPreviewMenu("I want grilled fish");

  assert.deepEqual(results.map((item) => item.id), ["techno-edge-western-003"]);
  assert.ok(results.every((item) => PREVIEW_MENU.includes(item)));
});

test("preview search returns no result for an unsupported request", () => {
  assert.deepEqual(filterPreviewMenu("sushi"), []);
});
