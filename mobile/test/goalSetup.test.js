import assert from "node:assert/strict";
import test from "node:test";

import {
  goalFromCustom,
  goalFromPreset,
  validateGoal,
} from "../src/lib/goalSetup.js";

test("preset goals use the shared product defaults", () => {
  assert.deepEqual(goalFromPreset("maintenance"), {
    mode: "preset",
    preset: "maintenance",
    caloriesKcal: 2200,
    proteinG: 140,
  });
});

test("custom goals include only entered More Options macros", () => {
  assert.deepEqual(
    goalFromCustom({ caloriesKcal: "2400", proteinG: "150", totalFatG: "70", sugarG: "" }),
    {
      mode: "custom",
      caloriesKcal: 2400,
      proteinG: 150,
      moreOptions: { totalFatG: 70 },
    },
  );
});

test("goal validation catches invalid core and optional values", () => {
  assert.deepEqual(
    validateGoal({
      mode: "custom",
      caloriesKcal: 0,
      proteinG: 150,
      moreOptions: { totalFatG: -1 },
    }),
    {
      caloriesKcal: "Enter calories greater than zero.",
      totalFatG: "Use zero or a positive number.",
    },
  );
});
