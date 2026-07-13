import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function AuthEntryScreen({ onContinue }) {
  const { styles } = useTheme(createStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <View style={styles.brandDot} />
              </View>
              <Text style={styles.brand}>NUSFuel</Text>
            </View>
            <Text style={styles.fieldNote}>FIELD NOTE 01</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>NUS / TECHNO EDGE</Text>
            <Text style={styles.title}>Eat with a plan.</Text>
            <Text style={styles.copy}>
              Set a daily target, then choose a stored Techno Edge meal that fits the way you train.
            </Text>
            <View style={styles.editorialMark}>
              <View style={styles.editorialDot} />
              <View style={styles.editorialRule} />
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>TODAY&apos;S STARTING POINT</Text>
            <View style={styles.metricRow}>
              <View>
                <Text style={styles.metricLabel}>Energy</Text>
                <Text style={styles.metricValue}>2,200 kcal</Text>
              </View>
              <View style={styles.metricRight}>
                <Text style={styles.metricLabel}>Protein</Text>
                <Text style={styles.metricValue}>140 g</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.previewHint}>A clearer starting point for the next meal.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start setting a target in NUSFuel preview"
            onPress={onContinue}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Set my target</Text>
          </Pressable>
          <Text style={styles.helper}>Local preview session</Text>
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
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  brandDot: {
    backgroundColor: colors.accentText,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  brand: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  fieldNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
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
    fontSize: 39,
    fontWeight: "800",
    letterSpacing: -1.4,
    lineHeight: 43,
    marginTop: spacing.md,
    maxWidth: 300,
  },
  copy: {
    color: colors.muted,
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.lg,
    maxWidth: 330,
  },
  editorialMark: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  editorialDot: {
    backgroundColor: colors.accent,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  editorialRule: {
    backgroundColor: colors.line,
    height: 1,
    marginLeft: spacing.sm,
    width: 72,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    marginTop: 54,
    padding: spacing.lg,
  },
  previewLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  metricRight: {
    alignItems: "flex-end",
  },
  metricLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontFamily,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  progressTrack: {
    backgroundColor: colors.line,
    borderRadius: 2,
    height: 3,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    height: "100%",
    width: "58%",
  },
  previewHint: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
    marginTop: spacing.md,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radiusLarge,
    justifyContent: "center",
    minHeight: 56,
  },
  buttonText: {
    color: colors.accentText,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
  },
  helper: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
