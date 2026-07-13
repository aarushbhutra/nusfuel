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
import { colors, radius, spacing } from "../theme.js";

export default function MenuBrowseScreen({
  apiBaseUrl,
  authSession,
  onSelect,
  onBack,
}) {
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
              <Text style={styles.stateText}>Loading Techno Edge menu…</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Menu unavailable</Text>
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
              <Text style={styles.stateTitle}>No meals yet</Text>
              <Text style={styles.stateText}>There are no stored Techno Edge meals to show.</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
                <Text style={styles.title}>Choose a meal.</Text>
              </View>
              {onBack ? (
                <Pressable
                  accessibilityLabel="Back to saved target"
                  accessibilityRole="button"
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                  <Text style={styles.backText}>Back</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.copy}>
              Browse the stored Techno Edge menu by stall. Tap a meal to view its full nutrition.
            </Text>
            {preview ? <Text style={styles.previewNote}>Preview menu · connected data appears here when signed in</Text> : null}
          </View>
        }
        renderItem={({ item }) => <MealRow item={item} onPress={() => onSelect(item)} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function MealRow({ item, onPress }) {
  return (
    <Pressable
      accessibilityLabel={`View ${item.name}, ${item.nutrition.energyKcal} kilocalories`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.mealRow, pressed && styles.pressed]}
    >
      <View style={styles.mealCopy}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealMeta}>{item.serving.quantity} {item.serving.unit} · {item.nutrition.proteinG} g protein</Text>
      </View>
      <View style={styles.mealEnergy}>
        <Text style={styles.energyValue}>{item.nutrition.energyKcal}</Text>
        <Text style={styles.energyLabel}>kcal</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: 20, paddingTop: spacing.md },
  headerRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 34, fontWeight: "800", letterSpacing: -1, marginTop: spacing.sm },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.md, maxWidth: 350 },
  previewNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  backButton: { alignItems: "center", borderColor: colors.line, borderRadius: 12, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 64, paddingHorizontal: 12 },
  backText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  sectionTitle: { color: colors.muted, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, marginBottom: spacing.sm, marginTop: spacing.section, textTransform: "uppercase" },
  mealRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm, minHeight: 78, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  mealCopy: { flex: 1, paddingRight: spacing.md },
  mealName: { color: colors.text, fontSize: 16, fontWeight: "800", lineHeight: 21 },
  mealMeta: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  mealEnergy: { alignItems: "flex-end" },
  energyValue: { color: colors.accent, fontSize: 17, fontWeight: "800" },
  energyLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  state: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.section, textAlign: "center" },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  stateText: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm, textAlign: "center" },
  retryButton: { alignItems: "center", borderColor: colors.line, borderRadius: 12, borderWidth: 1, marginTop: spacing.lg, minHeight: 48, justifyContent: "center", paddingHorizontal: spacing.xl },
  retryText: { color: colors.text, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
