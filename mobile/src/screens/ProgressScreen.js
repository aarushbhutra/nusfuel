import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getProgress } from "../lib/api/progress.js";
import { buildPreviewProgress } from "../lib/progress.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

const MACROS = [
  ["Total fat", "totalFatG", "g"],
  ["Carbohydrate", "carbohydrateG", "g"],
  ["Sugar", "sugarG", "g"],
];

export default function ProgressScreen({ goal, logs, apiBaseUrl, authSession, onBack, reducedMotion }) {
  const { colors, styles } = useTheme(createStyles);
  const preview = !apiBaseUrl || !authSession?.accessToken;
  const [period, setPeriod] = useState("daily");
  const [progress, setProgress] = useState(() => (
    preview ? buildPreviewProgress({ goal, logs, period }) : null
  ));
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const energyFill = useRef(new Animated.Value(0)).current;

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProgress(preview
        ? buildPreviewProgress({ goal, logs, period })
        : await getProgress(period, {
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your progress.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authSession, goal, logs, period, preview]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const macros = progress
    ? MACROS.filter(([, key]) => progress.goal.moreOptions?.[key] !== undefined)
    : [];
  const energyPercentage = progress
    ? percent(progress.consumed.energyKcal, progress.goal.caloriesKcal)
    : 0;

  useEffect(() => {
    if (reducedMotion) {
      energyFill.setValue(0);
    }
    const animation = Animated.timing(energyFill, {
      duration: reducedMotion ? 140 : 220,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      toValue: reducedMotion ? 1 : energyPercentage,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [energyFill, energyPercentage, reducedMotion]);

  const energyFillStyle = reducedMotion
    ? { opacity: energyFill, transform: [{ scaleX: energyPercentage / 100 }] }
    : { transform: [{ scaleX: energyFill.interpolate({ inputRange: [0, 100], outputRange: [0, 1] }) }] };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>NUSFuel</Text>
          <Pressable
            accessibilityLabel="Back to saved target"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>Back to target</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PROGRESS / {period.toUpperCase()}</Text>
          <Text style={styles.title}>Your day, in focus.</Text>
          <Text style={styles.copy}>See what is logged, what remains, and how the week is moving.</Text>
        </View>

        <View accessibilityRole="tablist" style={styles.periodTabs}>
          {[["daily", "Today"], ["weekly", "This week"]].map(([value, label]) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: period === value }}
              key={value}
              onPress={() => setPeriod(value)}
              style={({ pressed }) => [styles.periodTab, period === value && styles.periodTabActive, pressed && styles.pressed]}
            >
              <Text style={[styles.periodText, period === value && styles.periodTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {loading && progress ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error && !progress ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Progress is out of reach.</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={loadProgress}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        {loading && !progress ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.stateText}>Reading your progress.</Text>
          </View>
        ) : null}
        {progress ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{period === "daily" ? "TODAY" : "THIS WEEK"} / CONSUMED</Text>
              <Text style={styles.energyValue}>{formatNumber(progress.consumed.energyKcal)}</Text>
              <Text style={styles.energyMeta}>of {formatNumber(progress.goal.caloriesKcal)} kcal</Text>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, energyFillStyle]} />
              </View>
              <View style={styles.metricRow}>
                <Metric label="Protein" value={`${formatNumber(progress.consumed.proteinG)} / ${formatNumber(progress.goal.proteinG)} g`} styles={styles} />
                <View style={styles.metricDivider} />
                <Metric label="Remaining" value={`${formatNumber(progress.remaining.energyKcal)} kcal`} styles={styles} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Nutrition logged</Text>
            <View style={styles.nutritionCard}>
              <NutritionRow label="Energy" consumed={progress.consumed.energyKcal} remaining={progress.remaining.energyKcal} unit="kcal" styles={styles} prominent />
              <NutritionRow label="Protein" consumed={progress.consumed.proteinG} remaining={progress.remaining.proteinG} unit="g" styles={styles} />
              {macros.map(([label, key, unit]) => (
                <NutritionRow key={key} label={label} consumed={progress.consumed[key]} remaining={progress.remaining[key]} unit={unit} styles={styles} />
              ))}
            </View>
            {error ? <Text style={styles.refreshNote}>{error}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, styles }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function NutritionRow({ label, consumed, remaining, unit, styles, prominent }) {
  return (
    <View style={styles.nutritionRow}>
      <View>
        <Text style={[styles.nutritionLabel, prominent && styles.nutritionLabelProminent]}>{label}</Text>
        <Text style={styles.nutritionRemaining}>{formatNumber(remaining)} {unit} remaining</Text>
      </View>
      <Text style={[styles.nutritionValue, prominent && styles.nutritionValueProminent]}>{formatNumber(consumed)} {unit}</Text>
    </View>
  );
}

function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString() : Number(value).toFixed(1);
}

function percent(value, target) {
  return Math.min(100, Math.max(0, (value / target) * 100));
}

const createStyles = (colors) => StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: 24, paddingTop: spacing.md },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brand: { color: colors.text, fontFamily, fontSize: 15, fontWeight: "700" },
  backButton: { justifyContent: "center", minHeight: 44, paddingLeft: spacing.md },
  backText: { color: colors.muted, fontFamily, fontSize: 12, fontWeight: "700" },
  hero: { marginTop: 48 },
  eyebrow: { color: colors.accent, fontFamily, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.text, fontFamily, fontSize: 34, fontWeight: "800", letterSpacing: -1.1, lineHeight: 39, marginTop: spacing.md },
  copy: { color: colors.muted, fontFamily, fontSize: 14, lineHeight: 21, marginTop: spacing.md, maxWidth: 330 },
  periodTabs: { backgroundColor: colors.surfaceRaised, borderRadius: radiusLarge, flexDirection: "row", marginTop: spacing.xl, padding: spacing.xs },
  periodTab: { alignItems: "center", borderRadius: radiusLarge, flex: 1, justifyContent: "center", minHeight: 44 },
  periodTabActive: { backgroundColor: colors.surface },
  periodText: { color: colors.muted, fontFamily, fontSize: 13, fontWeight: "700" },
  periodTextActive: { color: colors.text },
  loading: { marginTop: spacing.md },
  state: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.xl, padding: spacing.xl },
  stateTitle: { color: colors.text, fontFamily, fontSize: 17, fontWeight: "800" },
  stateText: { color: colors.muted, fontFamily, fontSize: 13, lineHeight: 19, marginTop: spacing.sm, textAlign: "center" },
  retryButton: { alignItems: "center", borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.lg, minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xl },
  retryText: { color: colors.text, fontFamily, fontSize: 13, fontWeight: "800" },
  summaryCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  summaryLabel: { color: colors.muted, fontFamily, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  energyValue: { color: colors.text, fontFamily, fontSize: 40, fontWeight: "800", letterSpacing: -1.2, marginTop: spacing.md },
  energyMeta: { color: colors.accent, fontFamily, fontSize: 12, fontWeight: "800", marginTop: 2 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 4, height: 8, marginTop: spacing.lg, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, borderRadius: 4, height: "100%", transformOrigin: "left center", width: "100%" },
  metricRow: { flexDirection: "row", marginTop: spacing.xl },
  metric: { flex: 1 },
  metricDivider: { backgroundColor: colors.line, marginHorizontal: spacing.lg, width: 1 },
  metricLabel: { color: colors.muted, fontFamily, fontSize: 12 },
  metricValue: { color: colors.text, fontFamily, fontSize: 14, fontWeight: "800", marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontFamily, fontSize: 18, fontWeight: "800", marginTop: spacing.xl },
  nutritionCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radiusLarge, borderWidth: 1, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  nutritionRow: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 68 },
  nutritionLabel: { color: colors.muted, fontFamily, fontSize: 14 },
  nutritionLabelProminent: { color: colors.text, fontWeight: "800" },
  nutritionRemaining: { color: colors.muted, fontFamily, fontSize: 11, marginTop: spacing.xs },
  nutritionValue: { color: colors.text, fontFamily, fontSize: 14, fontWeight: "700" },
  nutritionValueProminent: { color: colors.accent, fontSize: 16, fontWeight: "800" },
  refreshNote: { color: colors.muted, fontFamily, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
