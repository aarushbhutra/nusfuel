import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme.js";

export default function GoalSavedScreen({ goal, onEdit }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.progress}>Step 1 of 2 complete</Text>
        <View style={styles.confirmation}>
          <Text style={styles.confirmationMark}>✓</Text>
        </View>
        <Text style={styles.title}>You’re set.</Text>
        <Text style={styles.copy}>
          Your target is ready. Next, choose a Techno Edge meal and see how it fits your day.
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily calories</Text>
            <Text style={styles.summaryValue}>{goal.caloriesKcal.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily protein</Text>
            <Text style={styles.summaryValue}>{goal.proteinG} g</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>You can edit this target any time.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Edit target</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  progress: {
    alignSelf: "flex-start",
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.xl,
  },
  confirmation: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  confirmationMark: {
    color: colors.accentText,
    fontSize: 28,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: spacing.xl,
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.section,
    padding: spacing.lg,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  footer: {
    paddingBottom: 18,
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
