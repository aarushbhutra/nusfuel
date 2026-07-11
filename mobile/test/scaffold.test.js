import assert from "node:assert/strict";
import test from "node:test";
import { appName } from "../src/index.js";

test("mobile scaffold identifies the app", () => {
  assert.equal(appName, "NUSFuel");
});
