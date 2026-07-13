import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const typeSource = await readFile(new URL("../src/types/contracts.ts", import.meta.url), "utf8");

test("mobile TypeScript contracts expose API JSON fields", () => {
  for (const field of [
    "energyKcal",
    "proteinG",
    "totalFatG",
    "carbohydrateG",
    "sugarG",
    "servingQuantity",
    "nutritionTotal",
    "moreOptions",
    "profile",
    "weightKg",
    "gender",
    "confidence",
    "allergenWarnings",
    "period",
    "startDate",
    "endDate",
    "consumed",
    "remaining",
  ]) {
    assert.match(typeSource, new RegExp(`${field}[?]?:`));
  }
});
