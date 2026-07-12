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
  PRESETS,
  PRESET_KEYS,
  validateGoal,
} from "../lib/goalSetup.js";
import { colors, radius, spacing } from "../theme.js";

const OPTIONAL_FIELDS = [
  { key: "totalFatG", label: "Fat", suffix: "g" },
  { key: "carbohydrateG", label: "Carbohydrates", suffix: "g" },
  { key: "sugarG", label: "Sugar", suffix: "g" },
];

export default function GoalSetupScreen({ onSave }) {
  const [mode, setMode] = useState("preset");
  const [preset, setPreset] = useState("maintenance");
  const [values, setValues] = useState({
    caloriesKcal: "2400",
    proteinG: "150",
    totalFatG: "",
    carbohydrateG: "",
    sugarG: "",
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const goal = useMemo(() => {
    const base = mode === "preset" ? goalFromPreset(preset) : goalFromCustom(values);
    const optional = goalFromCustom(values).moreOptions;
    return optional ? { ...base, moreOptions: optional } : base;
  }, [mode, preset, values]);
  const errors = validateGoal(goal);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaveError("");
  };

  const submit = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await onSave(goal);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save your target.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={styles.brand}>NUSFuel</Text>
            <Text style={styles.topBarText}>Goal setup</Text>
          </View>

          <Text style={styles.title}>Set your daily targets.</Text>
          <Text style={styles.copy}>
            Start with a clear calorie and protein target. You can change it any time.
          </Text>

          <Text style={styles.sectionTitle}>Choose a starting point</Text>
          <Text style={styles.sectionCopy}>Pick a preset or build a target around your training.</Text>

          <View style={styles.presetList}>
            {PRESET_KEYS.map((key) => (
              <PresetRow
                key={key}
                selected={mode === "preset" && preset === key}
                preset={PRESETS[key]}
                onPress={() => {
                  setMode("preset");
                  setPreset(key);
                  setShowErrors(false);
                }}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === "custom" }}
            onPress={() => {
              setMode("custom");
              setShowErrors(false);
            }}
            style={({ pressed }) => [
              styles.customChoice,
              mode === "custom" && styles.customChoiceSelected,
              pressed && styles.pressed,
            ]}
          >
            <View>
              <Text style={styles.customTitle}>Build your own</Text>
              <Text style={styles.customCopy}>Use numbers that match your plan.</Text>
            </View>
            <Text style={styles.customAction}>{mode === "custom" ? "Selected" : "Choose"}</Text>
          </Pressable>

          {mode === "custom" && (
            <View style={styles.formBlock}>
              <InputField
                label="Daily calories"
                suffix="kcal"
                value={values.caloriesKcal}
                error={showErrors ? errors.caloriesKcal : ""}
                onChangeText={(value) => updateValue("caloriesKcal", value)}
              />
              <InputField
                label="Daily protein"
                suffix="g"
                value={values.proteinG}
                error={showErrors ? errors.proteinG : ""}
                onChangeText={(value) => updateValue("proteinG", value)}
              />
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen }}
            onPress={() => setMoreOpen((open) => !open)}
            style={({ pressed }) => [styles.moreOptions, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.moreTitle}>More Options</Text>
              <Text style={styles.moreCopy}>Add fat, carbohydrate, or sugar targets.</Text>
            </View>
            <Text style={styles.moreAction}>{moreOpen ? "Hide" : "Open"}</Text>
          </Pressable>

          {moreOpen && (
            <View style={styles.formBlock}>
              {OPTIONAL_FIELDS.map((field) => (
                <InputField
                  key={field.key}
                  label={field.label}
                  suffix={field.suffix}
                  optional
                  value={values[field.key]}
                  error={showErrors ? errors[field.key] : ""}
                  onChangeText={(value) => updateValue(field.key, value)}
                />
              ))}
            </View>
          )}

          {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
          <Text style={styles.disclaimer}>General nutrition guidance, not medical advice.</Text>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={submit}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.saveButtonText}>Save target</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PresetRow({ preset, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.presetRow, selected && styles.presetRowSelected, pressed && styles.pressed]}
    >
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
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <TextInput
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={value}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  topBarText: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.1,
    lineHeight: 40,
    marginTop: spacing.xxl,
    maxWidth: 330,
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    marginTop: spacing.section,
  },
  sectionCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  presetList: {
    marginTop: spacing.lg,
  },
  presetRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  presetRowSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.accent,
  },
  presetInfo: {
    flex: 1,
    paddingRight: 12,
  },
  presetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  presetCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  presetNumbers: {
    alignItems: "flex-end",
  },
  presetCalories: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  presetProtein: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  customChoice: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  customChoiceSelected: {
    borderBottomColor: colors.accent,
  },
  customTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  customCopy: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  customAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  formBlock: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  optional: {
    color: colors.muted,
    fontSize: 12,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  inputShellError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    paddingVertical: 0,
  },
  suffix: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  moreOptions: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.section,
    paddingBottom: spacing.lg,
  },
  moreTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  moreCopy: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  moreAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xl,
  },
  saveError: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xl,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 58,
  },
  saveButtonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
