import { scaleNutrition } from "./nutrition.js";

const NUTRITION_FIELDS = ["energyKcal", "proteinG", "totalFatG", "carbohydrateG", "sugarG"];
const CORE_FIELDS = ["energyKcal", "proteinG"];
const OPTIONAL_FIELDS = ["totalFatG", "carbohydrateG", "sugarG"];

export function createPreviewMealLog(item, servingQuantity, loggedAt = new Date().toISOString()) {
  return {
    id: `local-${Date.now()}`,
    menuItemId: item.id,
    loggedAt,
    servingQuantity,
    nutritionTotal: scaleNutrition(item.nutrition, servingQuantity),
  };
}

export function buildPreviewProgress({ goal, logs = [], period = "daily", now = new Date() } = {}) {
  if (period !== "daily" && period !== "weekly") {
    throw new Error("Progress period must be daily or weekly.");
  }

  const { start, end } = progressWindow(period, now);
  const totals = Object.fromEntries(NUTRITION_FIELDS.map((field) => [field, 0]));
  for (const log of logs) {
    const loggedAt = new Date(log.loggedAt);
    if (loggedAt >= start && loggedAt < end) {
      for (const field of NUTRITION_FIELDS) {
        totals[field] += log.nutritionTotal[field] || 0;
      }
    }
  }

  const periodGoal = period === "weekly" ? scaleGoal(goal, 7) : goal;
  const consumed = Object.fromEntries(CORE_FIELDS.map((field) => [field, totals[field]]));
  const remaining = Object.fromEntries(
    CORE_FIELDS.map((field) => [field, periodGoal[field === "energyKcal" ? "caloriesKcal" : "proteinG"] - totals[field]]),
  );
  for (const field of OPTIONAL_FIELDS) {
    if (periodGoal.moreOptions?.[field] !== undefined) {
      consumed[field] = totals[field];
      remaining[field] = periodGoal.moreOptions[field] - totals[field];
    }
  }

  return {
    period,
    startDate: formatDate(start),
    endDate: formatDate(new Date(end.getTime() - 86400000)),
    goal: periodGoal,
    consumed,
    remaining,
  };
}

function progressWindow(period, now) {
  const date = new Date(now);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (period === "weekly") {
    const daysSinceMonday = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (period === "weekly" ? 7 : 1));
  return { start, end };
}

function scaleGoal(goal, multiplier) {
  const scaled = { ...goal, caloriesKcal: goal.caloriesKcal * multiplier, proteinG: goal.proteinG * multiplier };
  if (goal.moreOptions) {
    scaled.moreOptions = Object.fromEntries(
      Object.entries(goal.moreOptions).map(([key, value]) => [key, value * multiplier]),
    );
  }
  return scaled;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}
