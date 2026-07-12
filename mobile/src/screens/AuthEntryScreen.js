import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing } from "../theme.js";

export default function AuthEntryScreen({ onContinue }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.mark}>
            <Text style={styles.markText}>N</Text>
          </View>
          <Text style={styles.brand}>NUSFuel</Text>
        </View>
        <Text style={styles.title}>Plan the next meal.</Text>
        <Text style={styles.copy}>
          Set a target once. Keep the rest of your day clear and grounded in
          Techno Edge meals.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter NUSFuel preview"
          onPress={onContinue}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Enter preview</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </Pressable>
        <Text style={styles.helper}>Local preview session</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  mark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  markText: {
    color: colors.accentText,
    fontSize: 24,
    fontWeight: "800",
  },
  brand: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 46,
    marginTop: spacing.section,
    maxWidth: 320,
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.lg,
    maxWidth: 330,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: "800",
  },
  buttonArrow: {
    color: colors.accentText,
    fontSize: 24,
    fontWeight: "600",
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
