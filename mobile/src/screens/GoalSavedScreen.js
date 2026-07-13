import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function GoalSavedScreen({ goal, onEdit, onBrowse }) {
  const { styles } = useTheme(createStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>NUSFuel</Text>
            <Text style={styles.fieldNote}>FIELD NOTE 02 / 02</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TARGET SAVED</Text>
            <Text style={styles.title}>Your baseline is ready.</Text>
            <Text style={styles.copy}>
              Keep this close while you choose a Techno Edge meal. You can edit it whenever your training changes.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>{goal.mode === "custom" ? "CUSTOM TARGET" : "DAILY TARGET"}</Text>
              <View style={styles.savedDot} />
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Energy</Text>
                <Text style={styles.metricValue}>{goal.caloriesKcal.toLocaleString()}</Text>
                <Text style={styles.metricUnit}>kcal</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Protein</Text>
                <Text style={styles.metricValue}>{goal.proteinG}</Text>
                <Text style={styles.metricUnit}>g</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>General nutrition guidance, not medical advice.</Text>
          {onBrowse ? (
            <Pressable
              accessibilityRole="button"
              onPress={onBrowse}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Browse Techno Edge</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editButtonText}>Edit target</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
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
  fieldNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  hero: {
    marginTop: 88,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 41,
    marginTop: spacing.md,
    maxWidth: 310,
  },
  copy: {
    color: colors.muted,
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.lg,
    maxWidth: 330,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: 56,
    padding: spacing.lg,
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  savedDot: {
    backgroundColor: colors.accent,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  metricRow: {
    alignItems: "stretch",
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontFamily,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  metricUnit: {
    color: colors.accent,
    fontFamily,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.line,
    marginHorizontal: spacing.lg,
    width: 1,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  disclaimer: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radiusLarge,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButtonText: {
    color: colors.accentText,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  editButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: spacing.sm,
  },
  editButtonText: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
