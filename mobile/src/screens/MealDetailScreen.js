import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { scaleNutrition } from "../lib/nutrition.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

const SERVING_STEP = 0.5;
const MIN_SERVINGS = 0.5;

export default function MealDetailScreen({ item, onBack, onLog, onViewProgress, backLabel = "Back to menu" }) {
  const { colors, styles } = useTheme(createStyles);
  const [servings, setServings] = useState(1);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [logError, setLogError] = useState("");
  const nutrition = useMemo(() => scaleNutrition(item.nutrition, servings), [item.nutrition, servings]);

  const logMeal = async () => {
    setLogging(true);
    setLogError("");
    try {
      await onLog(servings);
      setLogged(true);
    } catch (error) {
      setLogError(error instanceof Error ? error.message : "Could not log this meal.");
    } finally {
      setLogging(false);
    }
  };

  const changeServings = (next) => {
    setServings(next);
    setLogged(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>NUSFuel</Text>
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{item.stall}</Text>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.servingNote}>Nutrition recalculates as you adjust the serving quantity.</Text>
        </View>

        <View style={styles.energyCard}>
          <View>
            <Text style={styles.cardLabel}>CURRENT SERVING</Text>
            <Text style={styles.energyValue}>{formatNumber(nutrition.energyKcal)}</Text>
            <Text style={styles.energyUnit}>kcal</Text>
          </View>
          <View style={styles.proteinBadge}>
            <Text style={styles.proteinLabel}>PROTEIN</Text>
            <Text style={styles.proteinValue}>{formatNumber(nutrition.proteinG)} g</Text>
          </View>
        </View>

        <View style={styles.quantityBlock}>
          <View style={styles.quantityCopy}>
            <Text style={styles.quantityLabel}>Serving quantity</Text>
            <Text style={styles.quantityHint}>Adjust to match what you ordered.</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Decrease serving quantity"
              accessibilityRole="button"
              disabled={servings <= MIN_SERVINGS}
              onPress={() => changeServings(Math.max(MIN_SERVINGS, servings - SERVING_STEP))}
              style={({ pressed }) => [styles.stepButton, servings <= MIN_SERVINGS && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>-</Text>
            </Pressable>
            <Text accessibilityLabel={`${servings} servings`} style={styles.quantityValue}>{servings}</Text>
            <Pressable
              accessibilityLabel="Increase serving quantity"
              accessibilityRole="button"
              onPress={() => changeServings(servings + SERVING_STEP)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Nutrition at this quantity</Text>
        <View style={styles.nutritionCard}>
          <NutritionRow label="Energy" value={`${formatNumber(nutrition.energyKcal)} kcal`} prominent />
          <NutritionRow label="Protein" value={`${formatNumber(nutrition.proteinG)} g`} />
          <NutritionRow label="Total fat" value={`${formatNumber(nutrition.totalFatG)} g`} />
          <NutritionRow label="Carbohydrate" value={`${formatNumber(nutrition.carbohydrateG)} g`} />
          <NutritionRow label="Sugar" value={`${formatNumber(nutrition.sugarG)} g`} last />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={logging || logged}
          onPress={logMeal}
          style={({ pressed }) => [styles.primaryButton, (logging || logged) && styles.disabledButton, pressed && styles.pressed]}
        >
          {logging ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.primaryButtonText}>{logged ? "Meal logged" : "Log this meal"}</Text>}
        </Pressable>
        {logged && onViewProgress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onViewProgress}
            style={({ pressed }) => [styles.progressButton, pressed && styles.pressed]}
          >
            <Text style={styles.progressButtonText}>View daily progress</Text>
          </Pressable>
        ) : null}
        {logError ? <Text style={styles.logError}>{logError}</Text> : null}

        {item.allergens?.incomplete ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>Allergen data incomplete</Text>
            <Text style={styles.warningText}>
              Some allergen information was not provided. Check with the stall before ordering.
            </Text>
          </View>
        ) : null}

        <View style={styles.sourceBlock}>
          <Text style={styles.sourceLabel}>SOURCE RECORD</Text>
          <Text style={styles.sourceName}>{item.source.name}</Text>
          <Text style={styles.sourceMeta}>Confidence: {item.source.confidence} / Verified {item.source.lastVerified}</Text>
        </View>
        <Text style={styles.disclaimer}>General nutrition guidance, not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function NutritionRow({ label, value, prominent, last }) {
  const { styles } = useTheme(createStyles);

  return (
    <View style={[styles.nutritionRow, last && styles.nutritionRowLast]}>
      <Text style={[styles.nutritionLabel, prominent && styles.nutritionLabelProminent]}>{label}</Text>
      <Text style={[styles.nutritionValue, prominent && styles.nutritionValueProminent]}>{value}</Text>
    </View>
  );
}

function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: 24,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
  backButton: {
    justifyContent: "center",
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  backText: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    fontWeight: "700",
  },
  hero: {
    marginTop: 58,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
    lineHeight: 39,
    marginTop: spacing.md,
  },
  servingNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  energyCard: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    padding: spacing.lg,
  },
  cardLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  energyValue: {
    color: colors.text,
    fontFamily,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  energyUnit: {
    color: colors.accent,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  proteinBadge: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  proteinLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  proteinValue: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  quantityBlock: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    minHeight: 80,
    paddingBottom: spacing.lg,
  },
  quantityCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  quantityLabel: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  quantityHint: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  stepText: {
    color: colors.accent,
    fontFamily,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 25,
  },
  quantityValue: {
    color: colors.text,
    fontFamily,
    fontSize: 16,
    fontWeight: "800",
    minWidth: 34,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: "800",
    marginTop: spacing.xl,
  },
  nutritionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  nutritionRow: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
  },
  nutritionRowLast: {
    borderBottomWidth: 0,
  },
  nutritionLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
  },
  nutritionLabelProminent: {
    color: colors.text,
    fontWeight: "800",
  },
  nutritionValue: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  nutritionValueProminent: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  warning: {
    backgroundColor: colors.warningBackground,
    borderColor: colors.warningBorder,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radiusLarge,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 56,
  },
  primaryButtonText: {
    color: colors.accentText,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  progressButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: spacing.sm,
  },
  progressButtonText: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: "800",
  },
  logError: {
    color: colors.danger,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  warningTitle: {
    color: colors.warningTitle,
    fontFamily,
    fontSize: 14,
    fontWeight: "800",
  },
  warningText: {
    color: colors.warningText,
    fontFamily,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  sourceBlock: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
  },
  sourceLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sourceName: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  sourceMeta: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  disclaimer: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
