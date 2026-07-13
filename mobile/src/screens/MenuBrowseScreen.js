import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMenu } from "../lib/api/menu.js";
import { PREVIEW_MENU } from "../lib/menuPreview.js";
import { fontFamily, radiusLarge, spacing, useTheme } from "../theme.js";

export default function MenuBrowseScreen({ apiBaseUrl, authSession, onSelect, onBack }) {
  const { colors, styles } = useTheme(createStyles);
  const preview = !apiBaseUrl || !authSession?.accessToken;
  const [items, setItems] = useState(preview ? PREVIEW_MENU : []);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");

  const loadMenu = useCallback(async () => {
    if (preview) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(
        await getMenu({
          accessToken: authSession.accessToken,
          baseUrl: apiBaseUrl,
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the menu.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authSession, preview]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const sections = useMemo(() => {
    const grouped = new Map();
    for (const item of items) {
      if (!grouped.has(item.stall)) {
        grouped.set(item.stall, []);
      }
      grouped.get(item.stall).push(item);
    }
    return [...grouped].map(([title, data]) => ({ title, data }));
  }, [items]);

  return (
    <SafeAreaView style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.stateText}>Reading the Techno Edge menu.</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>The menu is out of reach.</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadMenu}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>No meals yet.</Text>
              <Text style={styles.stateText}>There are no stored Techno Edge meals to show.</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Text style={styles.brand}>NUSFuel</Text>
              {onBack ? (
                <Pressable
                  accessibilityLabel="Back to saved target"
                  accessibilityRole="button"
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                  <Text style={styles.backText}>Back to target</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>TECHNO EDGE / MENU</Text>
              <Text style={styles.title}>The menu, in view.</Text>
              <Text style={styles.copy}>
                Browse stored meals by stall. Open one to see the full nutrition record and adjust servings.
              </Text>
            </View>
            {preview ? <Text style={styles.previewNote}>Preview menu. Connected data appears here when signed in.</Text> : null}
          </View>
        }
        renderItem={({ item }) => <MealRow item={item} onPress={() => onSelect(item)} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionRule} />
          </View>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function MealRow({ item, onPress }) {
  const { styles } = useTheme(createStyles);

  return (
    <Pressable
      accessibilityLabel={`View ${item.name}, ${item.nutrition.energyKcal} kilocalories`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.mealRow, pressed && styles.pressed]}
    >
      <View style={styles.mealAccent} />
      <View style={styles.mealCopy}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealMeta}>{item.serving.quantity} {item.serving.unit} / {item.nutrition.proteinG} g protein</Text>
      </View>
      <View style={styles.mealEnergy}>
        <Text style={styles.energyValue}>{item.nutrition.energyKcal}</Text>
        <Text style={styles.energyLabel}>kcal</Text>
      </View>
    </Pressable>
  );
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
    letterSpacing: 1.3,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 35,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 40,
    marginTop: spacing.md,
  },
  copy: {
    color: colors.muted,
    fontFamily,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  previewNote: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.sm,
    marginTop: spacing.section,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  sectionRule: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1,
    marginLeft: spacing.md,
  },
  mealRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radiusLarge,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.sm,
    minHeight: 82,
    overflow: "hidden",
    paddingRight: spacing.lg,
  },
  mealAccent: {
    backgroundColor: colors.accent,
    height: "100%",
    marginRight: spacing.md,
    width: 4,
  },
  mealCopy: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  mealName: {
    color: colors.text,
    fontFamily,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  mealMeta: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  mealEnergy: {
    alignItems: "flex-end",
  },
  energyValue: {
    color: colors.accent,
    fontFamily,
    fontSize: 17,
    fontWeight: "800",
  },
  energyLabel: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
    marginTop: 2,
  },
  state: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.section,
  },
  stateTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
