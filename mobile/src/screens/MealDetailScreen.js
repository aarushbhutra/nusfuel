import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { scaleNutrition } from "../lib/nutrition.js";
import { colors, radius, spacing } from "../theme.js";

const SERVING_STEP = 0.5;
const MIN_SERVINGS = 0.5;

export default function MealDetailScreen({ item, onBack }) {
  const [servings, setServings] = useState(1);
  const nutrition = useMemo(() => scaleNutrition(item.nutrition, servings), [item.nutrition, servings]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityLabel="Back to Techno Edge menu"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>‹  Techno Edge menu</Text>
        </Pressable>

        <Text style={styles.stall}>{item.stall}</Text>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.servingNote}>Nutrition is listed per {item.serving.unit}.</Text>

        <View style={styles.quantityBlock}>
          <View>
            <Text style={styles.quantityLabel}>Serving quantity</Text>
            <Text style={styles.quantityHint}>Adjust to match what you ordered.</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Decrease serving quantity"
              accessibilityRole="button"
              disabled={servings <= MIN_SERVINGS}
              onPress={() => setServings((value) => Math.max(MIN_SERVINGS, value - SERVING_STEP))}
              style={({ pressed }) => [styles.stepButton, servings <= MIN_SERVINGS && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text accessibilityLabel={`${servings} servings`} style={styles.quantityValue}>{servings}</Text>
            <Pressable
              accessibilityLabel="Increase serving quantity"
              accessibilityRole="button"
              onPress={() => setServings((value) => value + SERVING_STEP)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.nutritionCard}>
          <NutritionRow label="Energy" value={`${formatNumber(nutrition.energyKcal)} kcal`} prominent />
          <NutritionRow label="Protein" value={`${formatNumber(nutrition.proteinG)} g`} />
          <NutritionRow label="Total Fat" value={`${formatNumber(nutrition.totalFatG)} g`} />
          <NutritionRow label="Carbohydrate" value={`${formatNumber(nutrition.carbohydrateG)} g`} />
          <NutritionRow label="Sugar" value={`${formatNumber(nutrition.sugarG)} g`} last />
        </View>

        {item.allergens?.incomplete ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>Allergen data incomplete</Text>
            <Text style={styles.warningText}>
              Some allergen information was not provided. Check with the stall before ordering.
            </Text>
          </View>
        ) : null}

        <View style={styles.sourceBlock}>
          <Text style={styles.sourceLabel}>SOURCE</Text>
          <Text style={styles.sourceName}>{item.source.name}</Text>
          <Text style={styles.sourceMeta}>Confidence: {item.source.confidence} · Verified {item.source.lastVerified}</Text>
        </View>
        <Text style={styles.disclaimer}>General nutrition guidance, not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function NutritionRow({ label, value, prominent, last }) {
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

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: 20, paddingTop: spacing.md },
  backButton: { alignSelf: "flex-start", minHeight: 48, justifyContent: "center", paddingRight: spacing.lg },
  backText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  stall: { color: colors.accent, fontSize: 13, fontWeight: "800", marginTop: spacing.xl, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 34, fontWeight: "800", letterSpacing: -1, lineHeight: 40, marginTop: spacing.sm },
  servingNote: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.md },
  quantityBlock: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xxl, padding: spacing.lg },
  quantityLabel: { color: colors.text, fontSize: 15, fontWeight: "800" },
  quantityHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  stepper: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  stepButton: { alignItems: "center", backgroundColor: colors.surfaceRaised, borderRadius: 14, height: 48, justifyContent: "center", width: 48 },
  stepText: { color: colors.accent, fontSize: 25, fontWeight: "500", lineHeight: 28 },
  quantityValue: { color: colors.text, fontSize: 17, fontWeight: "800", minWidth: 34, textAlign: "center" },
  disabled: { opacity: 0.35 },
  nutritionCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  nutritionRow: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 56 },
  nutritionRowLast: { borderBottomWidth: 0 },
  nutritionLabel: { color: colors.muted, fontSize: 14 },
  nutritionLabelProminent: { color: colors.text, fontWeight: "800" },
  nutritionValue: { color: colors.text, fontSize: 15, fontWeight: "700" },
  nutritionValueProminent: { color: colors.accent, fontSize: 20, fontWeight: "800" },
  warning: { backgroundColor: "#2A2420", borderColor: "#765444", borderRadius: radius, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  warningTitle: { color: "#FFD1A8", fontSize: 14, fontWeight: "800" },
  warningText: { color: "#E8C4A7", fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  sourceBlock: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: spacing.xxl, paddingTop: spacing.lg },
  sourceLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  sourceName: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: spacing.sm },
  sourceMeta: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing.xl },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
