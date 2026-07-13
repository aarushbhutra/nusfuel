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
export const PROFILE_GENDERS = Object.freeze(["female", "male", "other"]);

export function goalFromPreset(preset, profile) {
  const values = PRESETS[preset];
  if (!values) {
    throw new Error("Choose a valid preset.");
  }
  const goal = {
    mode: "preset",
    preset,
    caloriesKcal: values.caloriesKcal,
    proteinG: values.proteinG,
  };
  if (!profile || Object.keys(validateProfile(profile)).length > 0) {
    return goal;
  }

  const calorieRate = profile.gender === "male" ? 32 : profile.gender === "female" ? 29 : 30;
  const maintenance = Math.max(1200, profile.weightKg * calorieRate - Math.max(0, profile.age - 25) * 5);
  const calorieMultiplier = preset === "cutting" ? 0.8 : preset === "gaining" ? 1.1 : 1;
  const proteinPerKg = preset === "cutting" ? 2 : preset === "gaining" ? 1.8 : 1.6;
  return {
    ...goal,
    caloriesKcal: Math.round((maintenance * calorieMultiplier) / 10) * 10,
    proteinG: Math.round(profile.weightKg * proteinPerKg),
    profile,
  };
}

export function profileFromValues(values) {
  return {
    age: numberValue(values.age),
    weightKg: numberValue(values.weightKg),
    gender: values.gender || "",
  };
}

export function validateProfile(profile) {
  const errors = {};
  if (!Number.isInteger(profile.age) || profile.age < 13 || profile.age > 120) {
    errors.age = "Enter an age between 13 and 120.";
  }
  if (!Number.isFinite(profile.weightKg) || profile.weightKg < 20 || profile.weightKg > 300) {
    errors.weightKg = "Enter a weight between 20 and 300 kg.";
  }
  if (!PROFILE_GENDERS.includes(profile.gender)) {
    errors.gender = "Choose an option.";
  }
  return errors;
}

export function onboardingStepError(step, profile, goal) {
  if (step === 0) {
    return validateProfile({ ...profile, weightKg: 60, gender: "other" }).age || "";
  }
  if (step === 1) {
    return validateProfile({ ...profile, age: 20, gender: "other" }).weightKg || "";
  }
  if (step === 2) {
    return validateProfile({ ...profile, age: 20, weightKg: 60 }).gender || "";
  }
  return Object.values(validateGoal(goal))[0] || "";
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
