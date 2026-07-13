import assert from "node:assert/strict";
import test from "node:test";

import {
	goalFromCustom,
	goalFromPreset,
	onboardingStepError,
	profileFromValues,
	validateProfile,
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

test("preset goals use profile details to personalize calories and protein", () => {
	assert.deepEqual(
		goalFromPreset("cutting", { age: 30, weightKg: 80, gender: "male" }),
		{
			mode: "preset",
			preset: "cutting",
			caloriesKcal: 2030,
			proteinG: 160,
			profile: { age: 30, weightKg: 80, gender: "male" },
		},
	);
});

test("profile validation requires usable age, weight, and gender", () => {
	assert.deepEqual(validateProfile(profileFromValues({ age: "12", weightKg: "0", gender: "" })), {
		age: "Enter an age between 13 and 120.",
		weightKg: "Enter a weight between 20 and 300 kg.",
		gender: "Choose an option.",
	});
});

test("onboarding validates only the answer on the active step", () => {
	const profile = profileFromValues({ age: "", weightKg: "", gender: "" });
	const goal = goalFromPreset("maintenance", profile);

	assert.equal(onboardingStepError(0, profile, goal), "Enter an age between 13 and 120.");
	assert.equal(onboardingStepError(1, profile, goal), "Enter a weight between 20 and 300 kg.");
	assert.equal(onboardingStepError(2, profile, goal), "Choose an option.");
	assert.equal(onboardingStepError(3, { age: 20, weightKg: 60, gender: "other" }, goalFromPreset("maintenance")), "");
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
