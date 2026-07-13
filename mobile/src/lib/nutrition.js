export function scaleNutrition(nutrition, servings) {
  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error("servings must be greater than zero");
  }

  return Object.fromEntries(
    Object.entries(nutrition).map(([key, value]) => [key, value * servings]),
  );
}
