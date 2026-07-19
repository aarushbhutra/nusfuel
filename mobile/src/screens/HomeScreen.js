import { useCallback, useEffect, useState } from "react";
import {
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

const OPTIONAL_MACROS = [
  ["Total fat", "totalFatG", "g"],
  ["Carbohydrate", "carbohydrateG", "g"],
  ["Sugar", "sugarG", "g"],
];

export default function HomeScreen({
  apiBaseUrl,
  authSession,
  goal,
  logs,
  onBrowse,
  onEdit,
  onProgress,
  onRecommendations,
}) {
  const { styles } = useTheme(createStyles);
  const preview = !apiBaseUrl || !authSession?.accessToken;
  const [progress, setProgress] = useState(() => (
    preview ? buildPreviewProgress({ goal, logs }) : null
  ));
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProgress(preview
        ? buildPreviewProgress({ goal, logs })
        : await getProgress("daily", {
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load today’s progress.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authSession, goal, logs, preview]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const macros = progress
    ? [
      ["Protein", "proteinG", "g"],
      ...OPTIONAL_MACROS.filter(([, key]) => progress.goal.moreOptions?.[key] !== undefined),
    ]
    : [];
  const consumedEnergy = progress?.consumed.energyKcal ?? 0;
  const calorieGoal = progress?.goal.caloriesKcal ?? goal.caloriesKcal;
  const remainingEnergy = progress?.remaining.energyKcal ?? goal.caloriesKcal;
  const isOverGoal = remainingEnergy < 0;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brand}>NUSFuel</Text>
          </View>
          <Pressable
            accessibilityLabel="Edit nutrition target"
            accessibilityRole="button"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editText}>Edit target</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.date}>{formatToday()}</Text>
        </View>

        {loading && !progress ? <BudgetSkeleton styles={styles} /> : null}
        {error && !progress ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Today’s progress is unavailable.</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={loadProgress}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {progress ? (
          <>
            <View style={styles.budgetPanel}>
              <View style={styles.budgetHeading}>
                <Text style={styles.budgetLabel}>Daily budget</Text>
                <Text style={styles.budgetGoal}>{formatNumber(calorieGoal)} kcal goal</Text>
              </View>
              <Text style={[styles.budgetValue, isOverGoal && styles.budgetValueOver]}>
                {formatNumber(Math.abs(remainingEnergy))}
              </Text>
              <Text style={[styles.budgetCaption, isOverGoal && styles.budgetCaptionOver]}>
                {isOverGoal ? "kcal over today’s goal" : "kcal remaining"}
              </Text>
              <View accessibilityLabel={`${formatNumber(consumedEnergy)} of ${formatNumber(calorieGoal)} kilocalories consumed`} style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent(consumedEnergy, calorieGoal)}%` }]} />
              </View>
              <View style={styles.budgetStats}>
                <BudgetStat label="Consumed" value={`${formatNumber(consumedEnergy)} kcal`} styles={styles} />
                <View style={styles.statDivider} />
                <BudgetStat label="Remaining" value={remainingLabel(remainingEnergy, "kcal")} styles={styles} />
              </View>
              {!consumedEnergy ? <Text style={styles.emptyNote}>Nothing logged yet. Start with a stored Techno Edge meal.</Text> : null}
            </View>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onBrowse}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Find a meal</Text>
          <Text style={styles.primaryButtonArrow}>›</Text>
        </Pressable>

        {progress ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Your nutrients</Text>
              <Pressable accessibilityRole="button" onPress={onProgress} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Full progress</Text>
              </Pressable>
            </View>
            <View style={styles.macroList}>
              {macros.map(([label, key, unit], index) => {
                const target = key === "proteinG" ? progress.goal.proteinG : progress.goal.moreOptions[key];
                return (
                  <MacroRow
                    divider={index > 0}
                    key={key}
                    label={label}
                    target={target}
                    unit={unit}
                    value={progress.consumed[key]}
                    styles={styles}
                  />
                );
              })}
            </View>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onRecommendations}
          style={({ pressed }) => [styles.picksRow, pressed && styles.pressed]}
        >
          <View>
            <Text style={styles.picksTitle}>What fits next?</Text>
            <Text style={styles.picksCopy}>See stored meals ranked against today’s target.</Text>
          </View>
          <Text style={styles.picksArrow}>›</Text>
        </Pressable>
        {error && progress ? <Text style={styles.refreshNote}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BudgetSkeleton({ styles }) {
  return (
    <View accessibilityLabel="Loading today’s progress" style={styles.budgetPanel}>
      <View style={[styles.skeleton, styles.skeletonLabel]} />
      <View style={[styles.skeleton, styles.skeletonValue]} />
      <View style={[styles.skeleton, styles.skeletonTrack]} />
      <View style={styles.budgetStats}>
        <View style={[styles.skeleton, styles.skeletonStat]} />
        <View style={styles.statDivider} />
        <View style={[styles.skeleton, styles.skeletonStat]} />
      </View>
    </View>
  );
}

function BudgetStat({ label, value, styles }) {
  return (
    <View style={styles.budgetStat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MacroRow({ divider, label, target, unit, value, styles }) {
  return (
    <View style={[styles.macroRow, divider && styles.macroRowDivider]}>
      <View style={styles.macroCopy}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{formatNumber(value)} / {formatNumber(target)} {unit}</Text>
      </View>
      <View accessibilityLabel={`${label}: ${formatNumber(value)} of ${formatNumber(target)} ${unit}`} style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${percent(value, target)}%` }]} />
      </View>
    </View>
  );
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", weekday: "long" });
}

function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString() : Number(value).toFixed(1);
}

function percent(value, target) {
  if (!target) {
    return 0;
  }
  return Math.min(100, Math.max(0, (value / target) * 100));
}

function remainingLabel(value, unit) {
  return value < 0
    ? `${formatNumber(Math.abs(value))} ${unit} over`
    : `${formatNumber(value)} ${unit} remaining`;
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
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  brandDot: {
    backgroundColor: colors.accentText,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  brand: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  editButton: {
    justifyContent: "center",
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  editText: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    fontWeight: "700",
  },
  heading: {
    marginTop: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
    lineHeight: 40,
  },
  date: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  budgetPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  budgetHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  budgetLabel: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  budgetGoal: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    fontWeight: "700",
  },
  budgetValue: {
    color: colors.text,
    fontFamily,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.3,
    marginTop: spacing.xl,
  },
  budgetValueOver: {
    color: colors.danger,
  },
  budgetCaption: {
    color: colors.accent,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  budgetCaptionOver: {
    color: colors.danger,
  },
  progressTrack: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
    height: 8,
    marginTop: spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    height: "100%",
  },
  budgetStats: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  budgetStat: {
    flex: 1,
  },
  statDivider: {
    backgroundColor: colors.line,
    marginHorizontal: spacing.lg,
    width: 1,
  },
  statLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
  },
  statValue: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  emptyNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: "800",
  },
  linkButton: {
    justifyContent: "center",
    minHeight: 40,
    paddingLeft: spacing.md,
  },
  linkText: {
    color: colors.accent,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
  },
  macroList: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  macroRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: spacing.lg,
  },
  macroRowDivider: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  macroCopy: {
    minWidth: 112,
  },
  macroLabel: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: "800",
  },
  macroValue: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  macroTrack: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 3,
    flex: 1,
    height: 6,
    marginLeft: spacing.md,
    overflow: "hidden",
  },
  macroFill: {
    backgroundColor: colors.accent,
    borderRadius: 3,
    height: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radiusLarge,
    flexDirection: "row",
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
  primaryButtonArrow: {
    color: colors.accentText,
    fontFamily,
    fontSize: 27,
    fontWeight: "500",
    lineHeight: 28,
    marginLeft: spacing.sm,
  },
  picksRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    minHeight: 72,
  },
  picksTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  picksCopy: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  picksArrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 28,
    fontWeight: "400",
    marginLeft: spacing.md,
  },
  errorState: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 16,
    fontWeight: "800",
  },
  errorText: {
    color: colors.muted,
    fontFamily,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  retryButton: {
    alignSelf: "flex-start",
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 40,
  },
  retryText: {
    color: colors.accent,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
  },
  refreshNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
  },
  skeletonLabel: {
    height: 16,
    width: 112,
  },
  skeletonValue: {
    height: 42,
    marginTop: spacing.xl,
    width: 156,
  },
  skeletonTrack: {
    height: 8,
    marginTop: spacing.xl,
    width: "100%",
  },
  skeletonStat: {
    flex: 1,
    height: 24,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
