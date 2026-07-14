import assert from "node:assert/strict";
import test from "node:test";

import { PREVIEW_RECOMMENDATIONS } from "../src/lib/menuPreview.js";

test("preview recommendations include fit reasons and incomplete allergen warnings", () => {
  assert.equal(PREVIEW_RECOMMENDATIONS.length, 3);
  assert.equal(PREVIEW_RECOMMENDATIONS[0].menuItemId, "techno-edge-western-003");
  assert.match(PREVIEW_RECOMMENDATIONS[0].fitReason, /protein/i);
  assert.equal(PREVIEW_RECOMMENDATIONS[2].menuItemId, "techno-edge-western-043");
  assert.ok(PREVIEW_RECOMMENDATIONS[2].allergenWarnings.length > 0);
});
