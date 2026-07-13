import assert from "node:assert/strict";
import test from "node:test";

import { buildPreviewProgress, createPreviewMealLog } from "../src/lib/progress.js";

const item = {
  id: "meal-1",
  nutrition: { energyKcal: 500, proteinG: 30, totalFatG: 10, carbohydrateG: 50, sugarG: 5 },
};

test("preview meal logs scale the selected serving quantity", () => {
  const log = createPreviewMealLog(item, 1.5, "2026-07-14T08:00:00.000Z");

  assert.equal(log.menuItemId, "meal-1");
  assert.equal(log.servingQuantity, 1.5);
  assert.deepEqual(log.nutritionTotal, {
    energyKcal: 750,
    proteinG: 45,
    totalFatG: 15,
    carbohydrateG: 75,
    sugarG: 7.5,
  });
});

test("preview progress aggregates the selected window and configured macros", () => {
  const goal = {
    mode: "custom",
    caloriesKcal: 2200,
    proteinG: 140,
    moreOptions: { totalFatG: 70 },
  };
  const logs = [
    createPreviewMealLog(item, 1, "2026-07-14T08:00:00.000Z"),
    createPreviewMealLog(item, 0.5, "2026-07-13T08:00:00.000Z"),
  ];

  const daily = buildPreviewProgress({ goal, logs, now: "2026-07-14T12:00:00.000Z" });
  assert.equal(daily.consumed.energyKcal, 500);
  assert.equal(daily.consumed.totalFatG, 10);
  assert.equal(daily.consumed.carbohydrateG, undefined);
  assert.equal(daily.remaining.energyKcal, 1700);

  const weekly = buildPreviewProgress({ goal, logs, period: "weekly", now: "2026-07-14T12:00:00.000Z" });
  assert.equal(weekly.goal.caloriesKcal, 15400);
  assert.equal(weekly.consumed.energyKcal, 750);
  assert.equal(weekly.startDate, "2026-07-13");
});
