export const PRESETS = Object.freeze({
  cutting: Object.freeze({
    label: "Cutting",
    description: "A lighter target for a focused day",
    caloriesKcal: 1800,
    proteinG: 120,
  }),
  maintenance: Object.freeze({
    label: "Maintenance",
    description: "A steady target for your usual training",
    caloriesKcal: 2200,
    proteinG: 140,
  }),
  gaining: Object.freeze({
    label: "Gaining",
    description: "More fuel for building and recovery",
    caloriesKcal: 2600,
    proteinG: 160,
  }),
});

export const PRESET_KEYS = Object.freeze(Object.keys(PRESETS));

export function goalFromPreset(preset) {
  const values = PRESETS[preset];
  if (!values) {
    throw new Error("Choose a valid preset.");
  }
  return {
    mode: "preset",
    preset,
    caloriesKcal: values.caloriesKcal,
    proteinG: values.proteinG,
  };
}

export function goalFromCustom(values) {
  const goal = {
    mode: "custom",
    caloriesKcal: numberValue(values.caloriesKcal),
    proteinG: numberValue(values.proteinG),
  };
  const moreOptions = {};
  for (const key of ["totalFatG", "carbohydrateG", "sugarG"]) {
    if (values[key] !== "" && values[key] !== undefined) {
      moreOptions[key] = numberValue(values[key]);
    }
  }
  if (Object.keys(moreOptions).length > 0) {
    goal.moreOptions = moreOptions;
  }
  return goal;
}

export function validateGoal(goal) {
  const errors = {};
  if (goal.mode === "preset" && !PRESETS[goal.preset]) {
    errors.preset = "Choose one of the available targets.";
  }
  if (goal.mode !== "preset" && goal.mode !== "custom") {
    errors.mode = "Choose a target type.";
  }
  if (goal.mode === "custom" && goal.preset) {
    errors.preset = "Custom targets cannot include a preset.";
  }
  if (!positive(goal.caloriesKcal)) {
    errors.caloriesKcal = "Enter calories greater than zero.";
  }
  if (!positive(goal.proteinG)) {
    errors.proteinG = "Enter protein greater than zero.";
  }
  for (const key of ["totalFatG", "carbohydrateG", "sugarG"]) {
    const value = goal.moreOptions?.[key];
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      errors[key] = "Use zero or a positive number.";
    }
  }
  return errors;
}

function numberValue(value) {
  return typeof value === "number" ? value : Number(value);
}

function positive(value) {
  return Number.isFinite(value) && value > 0;
}
