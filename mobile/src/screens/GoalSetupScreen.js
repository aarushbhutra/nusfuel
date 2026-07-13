import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  goalFromCustom,
  goalFromPreset,
  onboardingStepError,
  PRESETS,
  PRESET_KEYS,
  profileFromValues,
} from "../lib/goalSetup.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

const OPTIONAL_FIELDS = [
  { key: "totalFatG", label: "Fat", suffix: "g" },
  { key: "carbohydrateG", label: "Carbohydrates", suffix: "g" },
  { key: "sugarG", label: "Sugar", suffix: "g" },
];

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other / prefer not to say" },
];

export default function GoalSetupScreen({ onSave }) {
  const { colors, styles } = useTheme(createStyles);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("preset");
  const [preset, setPreset] = useState("maintenance");
  const [values, setValues] = useState({
    caloriesKcal: "2400",
    proteinG: "150",
    totalFatG: "",
    carbohydrateG: "",
    sugarG: "",
  });
  const [profileValues, setProfileValues] = useState({ age: "", weightKg: "", gender: "" });
  const [moreOpen, setMoreOpen] = useState(false);
  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const profile = useMemo(() => profileFromValues(profileValues), [profileValues]);
  const goal = useMemo(() => {
    const base = mode === "preset" ? goalFromPreset(preset, profile) : goalFromCustom(values);
    const optional = goalFromCustom(values).moreOptions;
    return { ...(optional ? { ...base, moreOptions: optional } : base), profile };
  }, [mode, preset, profile, values]);

  const updateProfileValue = (key, value) => {
    setProfileValues((current) => ({ ...current, [key]: value }));
    setStepError("");
    setSaveError("");
  };

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStepError("");
    setSaveError("");
  };

  const continueFlow = async () => {
    const error = onboardingStepError(step, profile, goal);
    if (error) {
      setStepError(error);
      return;
    }

    setStepError("");
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await onSave(goal);
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : "Could not save your target.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(0, current - 1));
    setStepError("");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            {step > 0 ? (
              <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <Text style={styles.brand}>NUSFuel</Text>
            )}
            <Text style={styles.stepLabel}>STEP {step + 1} OF 4</Text>
          </View>
          <View accessibilityLabel={`Onboarding progress: step ${step + 1} of 4`} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step + 1) * 25}%` }]} />
          </View>

          <View style={[styles.stepBody, step === 3 && styles.targetBody]}>
            {step === 0 ? (
              <PromptStep
                autoFocus
                copy="Used to shape a practical starting target."
                error={stepError}
                label="Age"
                onChangeText={(value) => updateProfileValue("age", value)}
                suffix="years"
                title="How old are you?"
                value={profileValues.age}
              />
            ) : null}

            {step === 1 ? (
              <PromptStep
                autoFocus
                copy="This helps keep the starting numbers useful for your body."
                error={stepError}
                label="Weight"
                onChangeText={(value) => updateProfileValue("weightKg", value)}
                suffix="kg"
                title="What is your weight?"
                value={profileValues.weightKg}
              />
            ) : null}

            {step === 2 ? (
              <View>
                <Text style={styles.eyebrow}>YOUR BASELINE</Text>
                <Text style={styles.title}>How should we tailor your starting point?</Text>
                <Text style={styles.copy}>Choose the option that best fits you. It only changes the preset calculation.</Text>
                <View style={styles.optionList}>
                  {GENDER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: profileValues.gender === option.value }}
                      onPress={() => updateProfileValue("gender", option.value)}
                      style={({ pressed }) => [
                        styles.genderOption,
                        profileValues.gender === option.value && styles.genderOptionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.genderOptionText}>{option.label}</Text>
                      <View style={[styles.radio, profileValues.gender === option.value && styles.radioSelected]}>
                        {profileValues.gender === option.value ? <View style={styles.radioDot} /> : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
                {stepError ? <Text style={styles.error}>{stepError}</Text> : null}
              </View>
            ) : null}

            {step === 3 ? (
              <View>
                <Text style={styles.eyebrow}>YOUR DAILY TARGET</Text>
                <Text style={styles.title}>What are you aiming for?</Text>
                <Text style={styles.copy}>Choose a starting point for the way you are training right now.</Text>
                <View style={styles.presetList}>
                  {PRESET_KEYS.map((key) => (
                    <PresetRow
                      key={key}
                      selected={mode === "preset" && preset === key}
                      preset={{ ...PRESETS[key], ...goalFromPreset(key, profile) }}
                      onPress={() => {
                        setMode("preset");
                        setPreset(key);
                        setStepError("");
                      }}
                    />
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === "custom" }}
                  onPress={() => {
                    setMode("custom");
                    setStepError("");
                  }}
                  style={({ pressed }) => [styles.customChoice, mode === "custom" && styles.customChoiceSelected, pressed && styles.pressed]}
                >
                  <View>
                    <Text style={styles.customTitle}>Build a custom target</Text>
                    <Text style={styles.customCopy}>Use your own calorie and protein numbers.</Text>
                  </View>
                  <Text style={styles.customAction}>{mode === "custom" ? "Selected" : "Choose"}</Text>
                </Pressable>
                {mode === "custom" ? (
                  <View style={styles.customFields}>
                    <InputField label="Daily calories" suffix="kcal" value={values.caloriesKcal} error={stepError} onChangeText={(value) => updateValue("caloriesKcal", value)} />
                    <InputField label="Daily protein" suffix="g" value={values.proteinG} error={stepError} onChangeText={(value) => updateValue("proteinG", value)} />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: moreOpen }}
                  onPress={() => setMoreOpen((open) => !open)}
                  style={({ pressed }) => [styles.moreOptions, pressed && styles.pressed]}
                >
                  <View>
                    <Text style={styles.moreTitle}>More options</Text>
                    <Text style={styles.moreCopy}>Add fat, carbohydrate, or sugar targets.</Text>
                  </View>
                  <Text style={styles.moreAction}>{moreOpen ? "Hide" : "Open"}</Text>
                </Pressable>
                {moreOpen ? (
                  <View style={styles.customFields}>
                    {OPTIONAL_FIELDS.map((field) => (
                      <InputField key={field.key} label={field.label} suffix={field.suffix} optional value={values[field.key]} error="" onChangeText={(value) => updateValue(field.key, value)} />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            {step === 3 ? <Text style={styles.disclaimer}>General nutrition guidance, not medical advice.</Text> : null}
            <Pressable accessibilityRole="button" disabled={saving} onPress={continueFlow} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.primaryButtonText}>{step === 3 ? "Save target" : "Continue"}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PromptStep({ autoFocus, copy, error, label, onChangeText, suffix, title, value }) {
  const { colors, styles } = useTheme(createStyles);

  return (
    <View>
      <Text style={styles.eyebrow}>YOUR BASELINE</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
      <View style={[styles.answerShell, error && styles.answerShellError]}>
        <TextInput
          accessibilityLabel={label}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.answerInput}
          value={value}
        />
        <Text style={styles.answerSuffix}>{suffix}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function PresetRow({ preset, selected, onPress }) {
  const { styles } = useTheme(createStyles);

  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.presetRow, selected && styles.presetRowSelected, pressed && styles.pressed]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.presetInfo}>
        <Text style={styles.presetTitle}>{preset.label}</Text>
        <Text style={styles.presetCopy}>{preset.description}</Text>
      </View>
      <View style={styles.presetNumbers}>
        <Text style={styles.presetCalories}>{preset.caloriesKcal.toLocaleString()} kcal</Text>
        <Text style={styles.presetProtein}>{preset.proteinG} g protein</Text>
      </View>
    </Pressable>
  );
}

function InputField({ label, suffix, value, optional = false, error, onChangeText }) {
  const { colors, styles } = useTheme(createStyles);

  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <TextInput accessibilityLabel={label} keyboardType="decimal-pad" onChangeText={onChangeText} placeholder="0" placeholderTextColor={colors.muted} style={styles.input} value={value} />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.lg, paddingHorizontal: 24, paddingTop: spacing.md },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brand: { color: colors.text, fontFamily, fontSize: 15, fontWeight: "700" },
  backButton: { justifyContent: "center", minHeight: 44 },
  backText: { color: colors.muted, fontFamily, fontSize: 13, fontWeight: "700" },
  stepLabel: { color: colors.muted, fontFamily, fontSize: 10, fontWeight: "700", letterSpacing: 1.1 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 2, height: 3, marginTop: spacing.lg, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, height: "100%" },
  stepBody: { flex: 1, justifyContent: "center", paddingBottom: spacing.xxl, paddingTop: spacing.xxl },
  targetBody: { justifyContent: "flex-start" },
  eyebrow: { color: colors.accent, fontFamily, fontSize: 11, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: colors.text, fontFamily, fontSize: 34, fontWeight: "800", letterSpacing: -1.1, lineHeight: 39, marginTop: spacing.md, maxWidth: 330 },
  copy: { color: colors.muted, fontFamily, fontSize: 15, lineHeight: 23, marginTop: spacing.md, maxWidth: 335 },
  answerShell: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, flexDirection: "row", marginTop: spacing.section, minHeight: 84, paddingHorizontal: spacing.lg },
  answerShellError: { borderColor: colors.danger },
  answerInput: { color: colors.text, flex: 1, fontFamily, fontSize: 32, fontWeight: "800", paddingVertical: 0 },
  answerSuffix: { color: colors.muted, fontFamily, fontSize: 15, fontWeight: "700" },
  optionList: { gap: spacing.sm, marginTop: spacing.section },
  genderOption: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 64, paddingHorizontal: spacing.lg },
  genderOptionSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.accent },
  genderOptionText: { color: colors.text, fontFamily, fontSize: 15, fontWeight: "700" },
  radio: { alignItems: "center", borderColor: colors.line, borderRadius: 10, borderWidth: 1, height: 20, justifyContent: "center", width: 20 },
  radioSelected: { borderColor: colors.accent },
  radioDot: { backgroundColor: colors.accent, borderRadius: 5, height: 10, width: 10 },
  presetList: { gap: spacing.sm, marginTop: spacing.xl },
  presetRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, flexDirection: "row", minHeight: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  presetRowSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.accent },
  presetInfo: { flex: 1, marginLeft: spacing.md, paddingRight: spacing.sm },
  presetTitle: { color: colors.text, fontFamily, fontSize: 16, fontWeight: "800" },
  presetCopy: { color: colors.muted, fontFamily, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  presetNumbers: { alignItems: "flex-end" },
  presetCalories: { color: colors.text, fontFamily, fontSize: 12, fontWeight: "800" },
  presetProtein: { color: colors.accent, fontFamily, fontSize: 11, fontWeight: "800", marginTop: spacing.xs },
  customChoice: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, minHeight: 64, paddingBottom: spacing.md, paddingTop: spacing.sm },
  customChoiceSelected: { borderBottomColor: colors.accent },
  customTitle: { color: colors.text, fontFamily, fontSize: 16, fontWeight: "800" },
  customCopy: { color: colors.muted, fontFamily, fontSize: 12, marginTop: spacing.xs },
  customAction: { color: colors.accent, fontFamily, fontSize: 12, fontWeight: "800" },
  customFields: { gap: spacing.lg, marginTop: spacing.lg },
  field: { gap: spacing.sm },
  fieldLabelRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  fieldLabel: { color: colors.text, fontFamily, fontSize: 13, fontWeight: "800" },
  optional: { color: colors.muted, fontFamily, fontSize: 11 },
  inputShell: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: "row", minHeight: 54, paddingHorizontal: spacing.md },
  inputShellError: { borderColor: colors.danger },
  input: { color: colors.text, flex: 1, fontFamily, fontSize: 18, fontWeight: "700", paddingVertical: 0 },
  suffix: { color: colors.muted, fontFamily, fontSize: 13, fontWeight: "700" },
  moreOptions: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: spacing.section, minHeight: 64, paddingBottom: spacing.md },
  moreTitle: { color: colors.text, fontFamily, fontSize: 16, fontWeight: "800" },
  moreCopy: { color: colors.muted, fontFamily, fontSize: 12, marginTop: spacing.xs },
  moreAction: { color: colors.accent, fontFamily, fontSize: 12, fontWeight: "800" },
  footer: { paddingTop: spacing.md },
  disclaimer: { color: colors.muted, fontFamily, fontSize: 12, lineHeight: 18, marginBottom: spacing.md, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radiusLarge, justifyContent: "center", minHeight: 56 },
  primaryButtonText: { color: colors.accentText, fontFamily, fontSize: 15, fontWeight: "800" },
  error: { color: colors.danger, fontFamily, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
