import assert from "node:assert/strict";
import test from "node:test";

import { scaleNutrition } from "../src/lib/nutrition.js";

test("scaleNutrition recalculates every nutrition field", () => {
  assert.deepEqual(
    scaleNutrition(
      {
        energyKcal: 500,
        proteinG: 30,
        totalFatG: 10,
        carbohydrateG: 50,
        sugarG: 5,
      },
      1.5,
    ),
    {
      energyKcal: 750,
      proteinG: 45,
      totalFatG: 15,
      carbohydrateG: 75,
      sugarG: 7.5,
    },
  );
});

test("scaleNutrition rejects invalid serving quantities", () => {
  assert.throws(() => scaleNutrition({ energyKcal: 500 }, 0), /greater than zero/);
});
